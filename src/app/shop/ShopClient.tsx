"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCart } from "src/context/CartContext";
import { useLanguage } from "src/context/LanguageContext";
import styles from "./shop.module.css";

// Тип для значения фильтра (включает "ALL" для сброса)
type FilterValue = "ALL" | "BRACELET" | "COURSE" | "CONSULTATION";

interface ShopClientProps {
  products: any[];
}

/**
 * Клиентский компонент магазина товаров и услуг.
 * Предоставляет интерфейс фильтрации продуктов по категориям и добавления их в корзину.
 * 
 * @param props Свойства компонента, содержащие список продуктов products.
 * @returns JSX элемент каталога магазина.
 */
export default function ShopClient({ products }: ShopClientProps) {
  const { items, addToCart, updateQuantity, setIsCartOpen } = useCart();


  const { language, t } = useLanguage();
  const searchParams = useSearchParams();

  // Локаль пользователя из мультиязычного контекста
  const locale = language;

  // Состояние активного основного фильтра
  const [filter, setFilter] = useState<FilterValue>("ALL");
  
  // Состояние активного подфильтра услуг
  const [subFilter, setSubFilter] = useState<string | "ALL">("ALL");

  // Состояние текстового поиска товаров
  const [searchQuery, setSearchQuery] = useState("");
  const [showToast, setShowToast] = useState<boolean>(false);

  // Плавное скрытие Toast-уведомления
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);


  // Инициализация фильтров из query-параметров при первой загрузке
  useEffect(() => {
    const categoryParam = searchParams.get("category");
    const subCategoryParam = searchParams.get("subCategory");

    if (categoryParam === "BRACELET" || categoryParam === "COURSE" || categoryParam === "CONSULTATION") {
      setFilter(categoryParam);
    }
    
    if (subCategoryParam === "NUMEROLOGY" || subCategoryParam === "TAROT" || subCategoryParam === "WAX" || subCategoryParam === "LADING") {
      setSubFilter(subCategoryParam);
    }
  }, [searchParams]);

  // Сбрасываем подфильтр при смене основной категории
  const handleMainFilterChange = (newFilter: FilterValue) => {
    setFilter(newFilter);
    setSubFilter("ALL");
  };

  // Безопасный парсинг переведенных полей на основе JSON структуры
  const getTranslation = (fieldObj: any, lang: string = "ru") => {
    if (!fieldObj) return "";
    const parsed = typeof fieldObj === "string" ? JSON.parse(fieldObj) : fieldObj;
    return parsed[lang] || parsed["ru"] || "";
  };

  // Фильтруем продукты по категории и поисковому запросу
  const filteredProducts = products.filter((product) => {
    // 1. Фильтр по основной категории
    if (filter !== "ALL" && product.category !== filter) {
      return false;
    }
    // 2. Фильтр по подкатегории (только если выбрана категория CONSULTATION)
    if (filter === "CONSULTATION" && subFilter !== "ALL" && product.subCategory !== subFilter) {
      return false;
    }
    
    // 3. Поиск по заголовку, описанию и цене
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      const name = getTranslation(product.name, locale).toLowerCase();
      const description = getTranslation(product.description, locale).toLowerCase();
      const priceStr = product.price.toString();
      
      const matchesName = name.includes(query);
      const matchesDesc = description.includes(query);
      const matchesPrice = priceStr.includes(query);
      
      if (!matchesName && !matchesDesc && !matchesPrice) {
        return false;
      }
    }
    
    return true;
  });

  // Порядок сортировки категорий во вкладке "Все предложения":
  // Сначала Браслеты (BRACELET), затем Курсы (COURSE), затем Консультации (CONSULTATION)
  const categoryOrder: Record<string, number> = {
    BRACELET: 1,
    COURSE: 2,
    CONSULTATION: 3,
  };

  // Сортируем продукты (применяется всегда для удобства, особенно во вкладке "Все предложения")
  const displayProducts = [...filteredProducts].sort((a, b) => {
    const orderA = categoryOrder[a.category] || 99;
    const orderB = categoryOrder[b.category] || 99;
    return orderA - orderB;
  });

  // Получение переведенного массива фич
  const getFeatures = (featuresObj: any, lang: string = "ru") => {
    if (!featuresObj) return [];
    const parsed = typeof featuresObj === "string" ? JSON.parse(featuresObj) : featuresObj;
    return parsed[lang] || parsed["ru"] || [];
  };

  return (
    <main className="container">
      {/* Кнопки фильтрации основных категорий */}
      <section className={styles.filterSection}>
        <div className={styles.filterRow}>
          <button
            className={`${styles.filterBtn} ${filter === "ALL" ? styles.filterBtnActive : ""}`}
            onClick={() => handleMainFilterChange("ALL")}
          >
            {t("shop", "all")}
          </button>
          <button
            className={`${styles.filterBtn} ${filter === "BRACELET" ? styles.filterBtnActive : ""}`}
            onClick={() => handleMainFilterChange("BRACELET")}
          >
            {t("shop", "bracelets")}
          </button>
          <button
            className={`${styles.filterBtn} ${filter === "COURSE" ? styles.filterBtnActive : ""}`}
            onClick={() => handleMainFilterChange("COURSE")}
          >
            {t("shop", "courses")}
          </button>
          <button
            className={`${styles.filterBtn} ${filter === "CONSULTATION" ? styles.filterBtnActive : ""}`}
            onClick={() => handleMainFilterChange("CONSULTATION")}
          >
            {t("shop", "consultations")}
          </button>

          {/* Поисковая строка в один ряд с фильтрами */}
          <div className={styles.searchWrapper}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder={
                language === "ru"
                  ? "Поиск..."
                  : "Suche..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className={styles.searchIcon}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
          </div>
        </div>

        {/* Горизонтальный блок подфильтров для консультаций */}
        {filter === "CONSULTATION" && (
          <div className={`${styles.subFilterRow} animate-fade-in`}>
            <button
              className={`${styles.subFilterBtn} ${subFilter === "ALL" ? styles.subFilterBtnActive : ""}`}
              onClick={() => setSubFilter("ALL")}
            >
              {language === "ru" ? "Все услуги" : "Alle Dienstleistungen"}
            </button>
            <button
              className={`${styles.subFilterBtn} ${subFilter === "NUMEROLOGY" ? styles.subFilterBtnActive : ""}`}
              onClick={() => setSubFilter("NUMEROLOGY")}
            >
              {language === "ru" ? "Нумерология" : "Numerologie"}
            </button>
            <button
              className={`${styles.subFilterBtn} ${subFilter === "TAROT" ? styles.subFilterBtnActive : ""}`}
              onClick={() => setSubFilter("TAROT")}
            >
              {language === "ru" ? "Карты Таро" : "Tarot-Karten"}
            </button>
            <button
              className={`${styles.subFilterBtn} ${subFilter === "WAX" ? styles.subFilterBtnActive : ""}`}
              onClick={() => setSubFilter("WAX")}
            >
              {language === "ru" ? "Восковые отливки" : "Wachsguss"}
            </button>
            <button
              className={`${styles.subFilterBtn} ${subFilter === "LADING" ? styles.subFilterBtnActive : ""}`}
              onClick={() => setSubFilter("LADING")}
            >
              {language === "ru" ? "Ладование" : "Ladowanie"}
            </button>
          </div>
        )}
      </section>

      {/* Сетка товаров */}
      <section className={styles.grid}>
        {displayProducts.length === 0 ? (
          <div style={{ textAlign: "center", gridColumn: "1 / -1", padding: "40px 0", color: "var(--color-gray)" }}>
            <p>{language === "ru" ? "Нет доступных предложений по выбранным фильтрам." : "Keine Angebote für die ausgewählten Filter verfügbar."}</p>
          </div>
        ) : (
          displayProducts.map((product) => {
            const cartItem = items?.find((item) => item.product.id === product.id);
            const quantityInCart = cartItem ? cartItem.quantity : 0;

            // Определение локализованных данных
            const name = getTranslation(product.name, locale);

            const description = getTranslation(product.description, locale);
            const features = getFeatures(product.features, locale);

            // Определяем класс стиля для бейджа и эмодзи на основе категории
            let badgeClass = styles.badgeBracelet;
            let categoryLabel = language === "ru" ? "Браслет" : "Kraftarmband";
            let imageEmoji = "📿";

            if (product.category === "COURSE") {
              badgeClass = styles.badgeCourse;
              categoryLabel = language === "ru" ? "Курс" : "Kurs";
              imageEmoji = "📖";
            } else if (product.category === "CONSULTATION") {
              badgeClass = styles.badgeConsultation;
              
              if (product.subCategory === "NUMEROLOGY") {
                categoryLabel = language === "ru" ? "Нумерология" : "Numerologie";
                imageEmoji = "🔢";
              } else if (product.subCategory === "TAROT") {
                categoryLabel = language === "ru" ? "Таро" : "Tarot";
                imageEmoji = "🃏";
              } else if (product.subCategory === "WAX") {
                categoryLabel = language === "ru" ? "Отливка" : "Wachsguss";
                imageEmoji = "🕯️";
              } else if (product.subCategory === "LADING") {
                categoryLabel = language === "ru" ? "Ладование" : "Ladowanie";
                imageEmoji = "☀️";
              } else {
                categoryLabel = language === "ru" ? "Услуга" : "Dienstleistung";
                imageEmoji = "🔮";
              }
            }

            // Расчет скидки в процентах для бейджа
            const discountPercent = product.oldPrice 
              ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
              : 0;

            return (
              <article key={product.id} className={styles.card}>
                {/* Картинка товара с поддержкой реальных фото или заглушки */}
                <Link href={`/shop/${product.id}`} className={styles.cardImageLink}>
                  <div className={styles.imageWrapper}>
                    <img 
                      src={product.imageUrl || "/placeholder_no_photo.jpeg"} 
                      alt={name} 
                      className={styles.productImage} 
                      style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                      loading="lazy"
                      decoding="async"
                    />
                    <span className={`${styles.badge} ${badgeClass}`}>{categoryLabel}</span>
                    
                    {/* Бейдж скидки на картинке */}
                    {discountPercent > 0 && (
                      <span 
                        style={{
                          position: "absolute",
                          top: "16px",
                          right: "16px",
                          backgroundColor: "var(--color-primary)",
                          color: "#fff",
                          padding: "4px 10px",
                          borderRadius: "var(--radius-sm)",
                          fontSize: "12px",
                          fontWeight: 700,
                          boxShadow: "0 2px 6px rgba(197, 23, 34, 0.2)"
                        }}
                      >
                        -{discountPercent}%
                      </span>
                    )}
                  </div>
                </Link>

                {/* Содержимое карточки */}
                <div className={styles.cardBody}>
                  {/* Цена СРАЗУ после картинки */}
                  <div className={styles.priceRow}>
                    <div className={styles.priceValues}>
                      <span className={styles.price}>
                        {product.price.toLocaleString("de-DE")} €
                      </span>
                      {product.oldPrice && (
                        <span className={styles.oldPrice}>
                          {product.oldPrice.toLocaleString("de-DE")} €
                        </span>
                      )}
                    </div>
                    <Link href={`/shop/${product.id}`} className={styles.priceMoreLink}>
                      {language === "ru" ? "Подробнее" : "Mehr Details"}
                    </Link>
                  </div>

                  <Link href={`/shop/${product.id}`} className={styles.cardTitleLink}>
                    <h3 className={styles.productName}>{name}</h3>
                  </Link>

                  <Link href={`/shop/${product.id}`} className={styles.productDesc}>
                    {description}
                  </Link>


                  {/* Особенности (Features) с золотыми галочками */}
                  {features && features.length > 0 && (
                    <ul className={styles.featureList}>
                      {features.slice(0, 2).map((feature: string, idx: number) => (
                        <li key={idx} className={styles.featureItem}>
                          <span className={styles.featureIcon}>✓</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Подвал карточки: Две кнопки "Купить" (залитая) и "В корзину" (рамка) */}
                  <div className={styles.cardActionRow}>
                    <button
                      className={`${styles.actionBtn} ${styles.buyBtn}`}
                    onClick={() => {
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
                    }}


                    >
                      {language === "ru" ? "Купить" : "Kaufen"}
                    </button>
                    {quantityInCart > 0 ? (
                      <div className={styles.quantitySelector}>
                        <button 
                          className={styles.quantityBtn} 
                          onClick={(e) => {
                            e.stopPropagation();
                            updateQuantity(product.id, quantityInCart - 1);
                          }}
                        >
                          −
                        </button>
                        <span className={styles.quantityVal}>{quantityInCart}</span>
                        <button 
                          className={styles.quantityBtn} 
                          onClick={(e) => {
                            e.stopPropagation();
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
                      <button
                        className={`${styles.actionBtn} ${styles.cartBtnOutline}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart({
                            id: product.id,
                            name: product.name,
                            price: product.price,
                            category: product.category,
                            imageUrl: product.imageUrl || "",
                            description: product.description,
                            isAvailable: product.isAvailable
                          } as any, false);

                          setShowToast(true);
                        }}
                      >
                        {t("shop", "addToCart")}
                      </button>
                    )}

                  </div>
                </div>
              </article>
            );
          })
        )}
      </section>
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
    </main>

  );
}
