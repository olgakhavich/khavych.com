import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "src/lib/db";
import { logger } from "src/lib/logger";

// Схема валидации данных для входа через Zod
const loginSchema = z.object({
  email: z.string().email("Неверный формат Email"),
  password: z.string().min(1, "Пароль не может быть пустым"),
  turnstileToken: z.string().min(1, "Токен безопасности Turnstile отсутствует"),
});

/**
 * Обработчик POST запроса на авторизацию пользователя.
 * Путь: /api/auth/login
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Валидация входных данных
    const validatedData = loginSchema.parse(body);

    // 1.5. Валидация Cloudflare Turnstile токена безопасности
    const secretKey = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY || "1x00000000000000000000000000000000";
    
    try {
      const cfResponse = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          secret: secretKey,
          response: validatedData.turnstileToken,
        }),
      });
      
      const cfResult = await cfResponse.json();
      
      if (!cfResult.success) {
        logger.warn({ email: validatedData.email, cfResult }, "Авторизация отклонена: неверный или просроченный токен Turnstile (бот)");
        return NextResponse.json(
          {
            error: true,
            code: "TURNSTILE_FAILED",
            message: "Проверка безопасности не пройдена. Пожалуйста, попробуйте снова.",
          },
          { status: 400 }
        );
      }
    } catch (cfError) {
      logger.error({ cfError }, "Ошибка при валидации токена Cloudflare Turnstile на входе");
      // Fail-open: пропускаем авторизацию, если API Cloudflare лежит, чтобы не блокировать реальных людей
    }

    // 2. Поиск пользователя в БД
    const user = await db.user.findUnique({
      where: { email: validatedData.email.toLowerCase() },
    });

    if (!user) {
      logger.warn({ email: validatedData.email }, "Неудачная попытка входа: пользователь не найден");
      return NextResponse.json(
        {
          error: true,
          code: "INVALID_CREDENTIALS",
          message: "Неверный Email или пароль",
        },
        { status: 401 }
      );
    }

    // 3. Проверка пароля через bcrypt
    const isPasswordValid = await bcrypt.compare(validatedData.password, user.passwordHash);

    if (!isPasswordValid) {
      logger.warn({ email: validatedData.email }, "Неудачная попытка входа: неверный пароль");
      return NextResponse.json(
        {
          error: true,
          code: "INVALID_CREDENTIALS",
          message: "Неверный Email или пароль",
        },
        { status: 401 }
      );
    }

    // 4. Генерация JWT токена
    const secret = process.env.JWT_SECRET || "local-development-secret-key-change-me-in-production";
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
      secret,
      { expiresIn: "7d" } // Срок действия токена — 7 дней
    );

    // 5. Запись JWT в защищенную куку (HttpOnly Cookie)
    // Это обеспечивает высокий уровень безопасности от XSS атак
    const response = NextResponse.json({
      success: true,
      message: "Вход выполнен успешно",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    const isProduction = process.env.NODE_ENV === "production";
    
    response.cookies.set("khavych_token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 дней в секундах
      path: "/",
    });

    logger.info({ userId: user.id, role: user.role }, "Пользователь успешно вошел в систему");

    return response;
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: true,
          code: "VALIDATION_ERROR",
          message: "Некоторые поля заполнены неверно",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    logger.error({ error }, "Ошибка при авторизации пользователя");
    return NextResponse.json(
      {
        error: true,
        code: "SERVER_ERROR",
        message: "Произошла внутренняя ошибка при авторизации",
      },
      { status: 500 }
    );
  }
}
