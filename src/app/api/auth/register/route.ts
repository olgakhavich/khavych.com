import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcrypt";
import { db } from "src/lib/db";
import { logger } from "src/lib/logger";
import { sendTelegramNotification } from "src/lib/telegram";

// Схема валидации данных для регистрации через Zod
const registerSchema = z.object({
  email: z.string().email("Неверный формат Email"),
  password: z.string().min(6, "Пароль должен быть не менее 6 символов"),
  name: z.string().min(2, "Имя должно быть не менее 2 символов"),
  phone: z.string().min(8, "Телефон должен быть не менее 8 цифр"),
  website: z.string().optional(),
  turnstileToken: z.string().min(1, "Токен безопасности Turnstile отсутствует"),
});

/**
 * Обработчик POST запроса на регистрацию нового ученика.
 * Путь: /api/auth/register
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 1. Валидация входных данных
    const validatedData = registerSchema.parse(body);

    // Проверка Honeypot поля: если оно заполнено, значит, регистрируется бот
    if (validatedData.website) {
      logger.warn({ email: validatedData.email }, "Регистрация отклонена: сработало Honeypot поле (бот)");
      // Возвращаем статус 200, чтобы бот думал, что все прошло успешно, и не спамил повторно
      return NextResponse.json({
        success: true,
        message: "Регистрация прошла успешно",
      });
    }

    // 2. Валидация Cloudflare Turnstile токена безопасности
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
        logger.warn({ email: validatedData.email, cfResult }, "Регистрация отклонена: неверный или просроченный токен Turnstile (бот)");
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
      logger.error({ cfError }, "Ошибка при валидации токена Cloudflare Turnstile");
      // Fail-open: пропускаем регистрацию, если API Cloudflare лежит, чтобы не блокировать реальных людей
    }

    // 2. Проверка, существует ли уже пользователь с таким email
    const existingUser = await db.user.findUnique({
      where: { email: validatedData.email.toLowerCase() },
    });

    if (existingUser) {
      logger.warn({ email: validatedData.email }, "Попытка регистрации на уже существующий email");
      return NextResponse.json(
        {
          error: true,
          code: "EMAIL_EXISTS",
          message: "Пользователь с таким Email уже зарегистрирован",
        },
        { status: 400 }
      );
    }

    // 3. Хеширование пароля (в соответствии с RULE[user_global])
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(validatedData.password, saltRounds);

    // 4. Определение роли (если регистрируется сама Ольга, даем роль ADMIN)
    const emailLower = validatedData.email.toLowerCase();
    const role = emailLower === "olga.k77@gmx.de" ? "ADMIN" : "USER";

    // 5. Создание записи в базе данных
    const user = await db.user.create({
      data: {
        email: emailLower,
        passwordHash,
        name: validatedData.name,
        phone: validatedData.phone,
        role: role,
      },
    });

    logger.info({ userId: user.id, role: user.role }, "Новый пользователь успешно зарегистрирован");

    // Отправка уведомления в Telegram (с ожиданием, чтобы гарантировать доставку в serverless-среде)
    const tgMsg = `📝 <b>НОВАЯ РЕГИСТРАЦИЯ • KHAVYCH.COM</b>\n\n` +
                  `👤 <b>Имя:</b> <code>${user.name}</code>\n` +
                  `📧 <b>Email:</b> <code>${user.email}</code>\n` +
                  `📞 <b>Телефон:</b> <code>${user.phone}</code>\n` +
                  `🔑 <b>Роль:</b> <code>${user.role}</code>\n` +
                  `⏰ <b>Дата:</b> <code>${new Date().toLocaleString("ru-RU", { timeZone: "Europe/Kiev" })}</code>`;

    try {
      await sendTelegramNotification(tgMsg);
    } catch (err) {
      logger.error({ err }, "Ошибка при отправке уведомления о регистрации в Telegram");
    }

    return NextResponse.json({
      success: true,
      message: "Регистрация прошла успешно",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
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

    logger.error({ error }, "Ошибка при регистрации пользователя");
    return NextResponse.json(
      {
        error: true,
        code: "SERVER_ERROR",
        message: "Произошла внутренняя ошибка при регистрации",
      },
      { status: 500 }
    );
  }
}
