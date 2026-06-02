"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "src/context/LanguageContext";
import { Turnstile } from "@marsidev/react-turnstile";
import styles from "./auth.module.css";

/**
 * Клиентский интерактивный компонент формы входа в личный кабинет.
 * Поддерживает мультиязычность (RU/DE) на основе контекста useLanguage.
 * Обеспечивает ввод данных, отправку POST запроса авторизации
 * и перенаправление пользователя на основе его роли.
 * 
 * @returns JSX элемент интерактивной формы входа.
 */
export default function LoginClient() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  /**
   * Обработка отправки формы входа
   * 
   * @param e Событие отправки формы
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!turnstileToken) {
      setError(language === "ru" ? "Пожалуйста, пройдите проверку безопасности" : "Bitte bestehen Sie die Sicherheitsprüfung");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, turnstileToken }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || t("auth", "loginError"));
      }

      // Успешный вход: перенаправляем на основе роли пользователя
      if (result.user.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/cabinet");
      }
      
      // Принудительно обновляем роутер для обновления состояния кук
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("auth", "genericError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.card}>
        {/* Логотип и заголовок */}
        <div className={styles.logoArea}>
          <Link href="/" className={styles.logoText}>
            <span className="text-gold">OLGA KHAVYCH</span>
          </Link>
          <p className={styles.subtitle}>{t("auth", "loginTitle")}</p>
        </div>

        {/* Сообщение об ошибке */}
        {error && <div className={styles.errorText}>{error}</div>}

        {/* Форма входа */}
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="login-email">{t("auth", "email")}</label>
            <input
              type="email"
              id="login-email"
              className={styles.input}
              placeholder={t("auth", "emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="login-password">{t("auth", "password")}</label>
            <input
              type="password"
              id="login-password"
              className={styles.input}
              placeholder={t("auth", "passwordPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Cloudflare Turnstile для защиты от брутфорс-атак */}
          <div style={{ display: "flex", justifyContent: "center", margin: "16px 0" }}>
            <Turnstile
              siteKey={process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY || "1x00000000000000000000AA"}
              onSuccess={(token) => setTurnstileToken(token)}
              onError={() => setError(language === "ru" ? "Ошибка проверки безопасности Turnstile" : "Turnstile-Sicherheitsprüfung fehlgeschlagen")}
              onExpire={() => setTurnstileToken("")}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", marginTop: "8px" }}
            disabled={isSubmitting}
          >
            {isSubmitting ? t("auth", "submitLoginPending") : t("auth", "submitLogin")}
          </button>
        </form>

        {/* Ссылка на регистрацию */}
        <p className={styles.switchText}>
          {t("auth", "noAccount")}{" "}
          <Link href="/register" className={styles.switchLink}>
            {t("auth", "goToRegister")}
          </Link>
        </p>
      </div>
    </div>
  );
}
