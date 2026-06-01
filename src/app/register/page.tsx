"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "src/context/LanguageContext";
import styles from "../login/auth.module.css";
import { Turnstile } from "@marsidev/react-turnstile";

/**
 * Компонент страницы регистрации нового ученика (/register).
 * Поддерживает мультиязычность (RU/DE) на основе контекста useLanguage.
 * Позволяет новому пользователю создать учетную запись на сайте.
 * 
 * @returns JSX элемент интерактивной страницы регистрации.
 */
export default function RegisterPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [website, setWebsite] = useState<string>("");
  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  /**
   * Обработка отправки формы регистрации.
   * Выполняет проверки на клиенте и отправляет запрос на сервер.
   * 
   * @param e Событие отправки формы
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // 1. Проверка совпадения паролей
    if (password !== confirmPassword) {
      setError(t("auth", "errorPasswordMismatch"));
      setIsSubmitting(false);
      return;
    }

    // 2. Проверка минимальной длины пароля
    if (password.length < 6) {
      setError(t("auth", "validationPassword"));
      setIsSubmitting(false);
      return;
    }

    // 3. Проверка прохождения капчи Turnstile
    if (!turnstileToken) {
      setError(language === "ru" ? "Пожалуйста, пройдите проверку безопасности" : "Bitte bestätigen Sie, dass Sie kein Roboter sind");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          password,
          website,
          turnstileToken,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || t("auth", "registerError"));
      }

      // Регистрация успешна
      setIsSuccess(true);
      
      // Автоматический переход на страницу входа через 3 секунды
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("auth", "genericError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className={styles.authPage}>
        <div className={styles.card} style={{ textAlign: "center" }}>
          <div className={styles.logoArea}>
            <Link href="/" className={styles.logoText}>
              <span className="text-gold">OLGA KHAVYCH</span>
            </Link>
            <h2 className="text-gold" style={{ marginTop: "24px", marginBottom: "12px" }}>
              {t("auth", "regSuccessTitle")}
            </h2>
            <p className={styles.subtitle}>
              {t("auth", "regSuccessDesc")}
            </p>
          </div>
          <div style={{ marginTop: "24px" }}>
            <Link href="/login" className="btn btn-primary" style={{ display: "inline-block", width: "100%" }}>
              {t("auth", "goToLoginManual")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.authPage}>
      <div className={styles.card}>
        {/* Логотип и заголовок */}
        <div className={styles.logoArea}>
          <Link href="/" className={styles.logoText}>
            <span className="text-gold">OLGA KHAVYCH</span>
          </Link>
          <p className={styles.subtitle}>{t("auth", "registerTitle")}</p>
        </div>

        {/* Сообщение об ошибке */}
        {error && <div className={styles.errorText}>{error}</div>}

        {/* Форма регистрации */}
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="reg-name">{t("auth", "name")}</label>
            <input
              type="text"
              id="reg-name"
              className={styles.input}
              placeholder={t("auth", "namePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="reg-email">{t("auth", "email")}</label>
            <input
              type="email"
              id="reg-email"
              className={styles.input}
              placeholder={t("auth", "emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="reg-phone">{t("auth", "phone")}</label>
            <input
              type="tel"
              id="reg-phone"
              className={styles.input}
              placeholder={language === "ru" ? "+7 (999) 123-45-67" : "+49 123 456789"}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="reg-password">{t("auth", "password")}</label>
            <input
              type="password"
              id="reg-password"
              className={styles.input}
              placeholder={t("auth", "passwordMinLength")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="reg-confirm">{t("auth", "confirmPassword")}</label>
            <input
              type="password"
              id="reg-confirm"
              className={styles.input}
              placeholder={t("auth", "passwordPlaceholder")}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {/* Поле-приманка для ботов (Honeypot) */}
          <div style={{ display: "none", position: "absolute", left: "-9999px", top: "-9999px" }} aria-hidden="true">
            <label htmlFor="reg-website">Website</label>
            <input
              type="text"
              id="reg-website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          {/* Cloudflare Turnstile для защиты от ботов */}
          <div className={styles.formGroup} style={{ display: "flex", justifyContent: "center", marginTop: "16px", marginBottom: "16px" }}>
            <Turnstile
              siteKey={process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY || "1x00000000000000000000AA"}
              onSuccess={(token) => setTurnstileToken(token)}
              onError={() => setError(language === "ru" ? "Ошибка проверки безопасности Turnstile" : "Turnstile-Sicherheitsprüfung fehlgeschlagen")}
              onExpire={() => setTurnstileToken("")}
              options={{
                theme: "light",
                size: "normal"
              }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", marginTop: "8px" }}
            disabled={isSubmitting}
          >
            {isSubmitting ? t("auth", "submitRegisterPending") : t("auth", "submitRegister")}
          </button>
        </form>

        {/* Ссылка на вход */}
        <p className={styles.switchText}>
          {t("auth", "hasAccount")}{" "}
          <Link href="/login" className={styles.switchLink}>
            {t("auth", "goToLogin")}
          </Link>
        </p>
      </div>
    </div>
  );
}
