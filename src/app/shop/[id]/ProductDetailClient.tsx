"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useCart } from "src/context/CartContext";
import { useLanguage } from "src/context/LanguageContext";
import { Header } from "src/components/Header";
import styles from "./product-detail.module.css";

interface IProductDetailClientProps {
  product: any;
  serverLanguage: "ru" | "de";
}

/**
 * Клиентский компонент детального просмотра товара/услуги.
 * Поддерживает интерактивный модальный просмотр фото, локализацию
 * и раздельное добавление в корзину/оформление покупки.
 */
export default function ProductDetailClient({ product, serverLanguage }: IProductDetailClientProps) {
  const { items, addToCart, updateQuantity, setIsCartOpen } = useCart();

  const { language: clientLanguage, t } = useLanguage();
  
  const cartItem = items?.find((item) => item.product.id === product.id);
  const quantityInCart = cartItem ? cartItem.quantity : 0;

  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);

  // Используем клиентский язык, если он инициализирован, иначе серверный
  const language = clientLanguage || serverLanguage;
  const locale = language;

  // Безопасный парсинг JSON-полей
  const getTranslation = (fieldObj: any, lang: string = "ru") => {
    if (!fieldObj) return "";
    try {
      const parsed = typeof fieldObj === "string" ? JSON.parse(fieldObj) : fieldObj;
      return parsed[lang] || parsed["ru"] || "";
    } catch (e) {
      return typeof fieldObj === "string" ? fieldObj : "";
    }
  };

  const getFeatures = (featuresObj: any, lang: string = "ru") => {
    if (!featuresObj) return [];
    try {
      const parsed = typeof featuresObj === "string" ? JSON.parse(featuresObj) : featuresObj;
      return parsed[lang] || parsed["ru"] || [];
    } catch (e) {
      return [];
    }
  };

  const name = getTranslation(product.name, locale);
  const description = getTranslation(product.description, locale);
  const features = getFeatures(product.features, locale);

  // Определение локализованных названий категорий
  let categoryLabel = language === "ru" ? "Браслет" : "Kraftarmband";
  let badgeClass = styles.badgeBracelet;

  if (product.category === "COURSE") {
    categoryLabel = language === "ru" ? "Курс" : "Kurs";
    badgeClass = styles.badgeCourse;
  } else if (product.category === "CONSULTATION") {
    badgeClass = styles.badgeConsultation;
    if (product.subCategory === "NUMEROLOGY") {
      categoryLabel = language === "ru" ? "Нумерология" : "Numerologie";
    } else if (product.subCategory === "TAROT") {
      categoryLabel = language === "ru" ? "Таро" : "Tarot";
    } else if (product.subCategory === "WAX") {
      categoryLabel = language === "ru" ? "Отливка" : "Wachsguss";
    } else if (product.subCategory === "LADING") {
      categoryLabel = language === "ru" ? "Ладование" : "Ladowanie";
    } else {
      categoryLabel = language === "ru" ? "Услуга" : "Dienstleistung";
    }
  }

  // Расчет процента скидки
  const discountPercent = product.oldPrice 
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  // Обработчик "В корзину" (добавление без открытия корзины)
  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      category: product.category,
      imageUrl: product.imageUrl || "",
      description: product.description,
      isAvailable: product.isAvailable
    } as any, false);


    // Показываем Toast-уведомление
    setShowToast(true);
  };

  // Плавное скрытие Toast-уведомления
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  // Обработчик "Купить" (добавление с открытием корзины)
  const handleBuyNow = () => {
    if (quantityInCart > 0) {
      setIsCartOpen(true);
    } else {
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        category: product.category,
        imageUrl: product.imageUrl || "",
        description: product.description,
        isAvailable: product.isAvailable
      } as any, true);
    }
  };



  // Блокируем скролл страницы при открытом лайтбоксе
  useEffect(() => {
    if (isLightboxOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isLightboxOpen]);

  return (
    <div className={styles.pageWrapper}>
      {/* Шапка сайта */}
      <Header />

      <main className="container" style={{ marginTop: "40px", paddingBottom: "80px" }}>
        {/* Хлебные крошки */}
        <div className={styles.breadcrumbs}>
          <Link href="/shop" className={styles.backLink}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span>{language === "ru" ? "Назад в магазин" : "Zurück zum Shop"}</span>
          </Link>
        </div>

        {/* Сетка деталей товара */}
        <section className={styles.detailGrid}>
          {/* Левая колонка: Изображение товара */}
          <div className={styles.imageSection}>
            <div className={styles.imageCard} onClick={() => setIsLightboxOpen(true)}>
              <img
                src={product.imageUrl || "/placeholder_no_photo.jpeg"}
                alt={name}
                className={styles.productImage}
                loading="eager"
              />
              <span className={`${styles.badge} ${badgeClass}`}>{categoryLabel}</span>

              {discountPercent > 0 && (
                <span className={styles.discountBadge}>-{discountPercent}%</span>
              )}

              <div className={styles.zoomOverlay}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  <line x1="11" y1="8" x2="11" y2="14" />
                  <line x1="8" y1="11" x2="14" y2="11" />
                </svg>
                <span>{language === "ru" ? "Увеличить фото" : "Bild vergrößern"}</span>
              </div>
            </div>
          </div>

          {/* Правая колонка: Информационный блок */}
          <div className={styles.infoSection}>
            <h1 className={styles.productName}>{name}</h1>

            {/* Цены */}
            <div className={styles.priceContainer}>
              <span className={styles.priceLabel}>
                {language === "ru" ? "Стоимость:" : "Preis:"}
              </span>
              <div className={styles.priceRow}>
                <span className={styles.price}>{product.price.toLocaleString("de-DE")} €</span>
                {product.oldPrice && (
                  <span className={styles.oldPrice}>
                    {product.oldPrice.toLocaleString("de-DE")} €
                  </span>
                )}
              </div>
            </div>

            {/* Локализованное описание с поддержкой абзацев */}
            <div className={styles.descriptionContainer}>
              <h3>{language === "ru" ? "Описание товара" : "Produktbeschreibung"}</h3>
              <p className={styles.descriptionText}>{description}</p>
            </div>

            {/* Характеристики (Features) */}
            {features && features.length > 0 && (
              <div className={styles.featuresContainer}>
                <h3>{language === "ru" ? "Особенности и детали" : "Details & Eigenschaften"}</h3>
                <ul className={styles.featureList}>
                  {features.map((feature: string, idx: number) => (
                    <li key={idx} className={styles.featureItem}>
                      <span className={styles.featureIcon}>✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Блок кнопок действия */}
            <div className={styles.actionRow}>
              <button className={`${styles.actionBtn} ${styles.buyBtn}`} onClick={handleBuyNow}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                >
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                <span>{language === "ru" ? "Купить сейчас" : "Jetzt kaufen"}</span>
              </button>
              
              {quantityInCart > 0 ? (
                <div className={styles.quantitySelector}>
                  <button 
                    className={styles.quantityBtn} 
                    onClick={() => updateQuantity(product.id, quantityInCart - 1)}
                  >
                    −
                  </button>
                  <span className={styles.quantityVal}>{quantityInCart}</span>
                  <button 
                    className={styles.quantityBtn} 
                    onClick={() => {
                      if (product.category === "BRACELET") {
                        updateQuantity(product.id, quantityInCart + 1);
                      }
                    }}
                    disabled={product.category !== "BRACELET"}
                    title={product.category !== "BRACELET" ? (language === "ru" ? "Этот товар можно приобрести только в одном экземпляре" : "Dieses Produkt kann nur einmal erworben werden") : ""}
                  >
                    +
                  </button>
                </div>
              ) : (
                <button className={`${styles.actionBtn} ${styles.cartBtnOutline}`} onClick={handleAddToCart}>
                  <span>{t("shop", "addToCart")}</span>
                </button>
              )}

            </div>
          </div>
        </section>
      </main>

      {/* Полноэкранный модальный просмотр фото (Lightbox) */}
      {isLightboxOpen && (
        <div className={styles.lightbox} onClick={() => setIsLightboxOpen(false)}>
          <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeLightbox} onClick={() => setIsLightboxOpen(false)} aria-label="Close">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <img
              src={product.imageUrl || "/placeholder_no_photo.jpeg"}
              alt={name}
              className={styles.lightboxImage}
            />
          </div>
        </div>
      )}

      {/* Toast-уведомление о добавлении в корзину */}
      <div className={`${styles.toast} ${showToast ? styles.toastVisible : ""}`}>
        <div className={styles.toastContent}>
          <span className={styles.toastIcon}>✓</span>
          <span>
            {language === "ru"
              ? "Товар успешно добавлен в корзину"
              : "Produkt erfolgreich in den Warenkorb gelegt"}
          </span>
        </div>
      </div>
    </div>
  );
}
