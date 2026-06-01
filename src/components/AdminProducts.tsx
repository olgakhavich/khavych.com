"use client";

import React, { useState, useRef } from "react";
import { ConfirmModal } from "./ConfirmModal";
import styles from "./AdminProducts.module.css";
import { IDBProduct } from "./AdminClient";

interface AdminProductsProps {
  initialProducts: any[];
  courses: any[];
  showNotification?: (text: string, type: "success" | "error") => void;
}

export const AdminProducts: React.FC<AdminProductsProps> = ({ initialProducts, courses, showNotification }) => {
  const [products, setProducts] = useState<any[]>(initialProducts);

  // --- СОСТОЯНИЕ ДЛЯ КАСТОМНОГО ДИАЛОГА ПОДТВЕРЖДЕНИЯ ---
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    danger?: boolean;
    confirmText?: string;
    cancelText?: string;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    danger: false,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  // Состояния фильтрации товаров
  const [filter, setFilter] = useState<"ALL" | "BRACELET" | "COURSE" | "CONSULTATION">("ALL");
  const [subFilter, setSubFilter] = useState<string | "ALL">("ALL");

  const handleMainFilterChange = (newFilter: "ALL" | "BRACELET" | "COURSE" | "CONSULTATION") => {
    setFilter(newFilter);
    setSubFilter("ALL");
  };

  // Состояния для полей формы
  const [activeLang, setActiveLang] = useState<"ru" | "de">("ru");
  const [nameRu, setNameRu] = useState("");
  const [nameDe, setNameDe] = useState("");
  const [descRu, setDescRu] = useState("");
  const [descDe, setDescDe] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [oldPrice, setOldPrice] = useState<number | "">("");
  const [category, setCategory] = useState<"BRACELET" | "COURSE" | "CONSULTATION">("BRACELET");
  const [subCategory, setSubCategory] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [courseId, setCourseId] = useState<string>("");

  // Особенности товара (features)
  const [featuresRu, setFeaturesRu] = useState<string[]>([]);
  const [featuresDe, setFeaturesDe] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState("");

  // Загрузка файлов
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Валидация и отправка
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Стейты для кастомных премиальных списков
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isSubCategoryOpen, setIsSubCategoryOpen] = useState(false);

  // Открытие модального окна для добавления нового товара
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setNameRu("");
    setNameDe("");
    setDescRu("");
    setDescDe("");
    setPrice(0);
    setOldPrice("");
    setCategory("BRACELET");
    setSubCategory("");
    setImageUrl("");
    setCourseId("");
    setFeaturesRu([]);
    setFeaturesDe([]);
    setNewFeature("");
    setActiveLang("ru");
    setErrorMsg("");
    setIsCategoryOpen(false);
    setIsSubCategoryOpen(false);
    setIsModalOpen(true);
  };

  // Открытие модального окна для редактирования товара
  const handleOpenEditModal = (product: any) => {
    setEditingProduct(product);
    
    // Безопасный парсинг Json полей имени/описания/фич
    const pName = typeof product.name === "string" ? JSON.parse(product.name) : product.name;
    const pDesc = typeof product.description === "string" ? JSON.parse(product.description) : product.description;
    const pFeatures = product.features 
      ? (typeof product.features === "string" ? JSON.parse(product.features) : product.features)
      : { ru: [], de: [] };

    setNameRu(pName?.ru || "");
    setNameDe(pName?.de || "");
    setDescRu(pDesc?.ru || "");
    setDescDe(pDesc?.de || "");
    setPrice(product.price);
    setOldPrice(product.oldPrice !== null ? product.oldPrice : "");
    setCategory(product.category);
    setSubCategory(product.subCategory || "");
    setImageUrl(product.imageUrl || "");
    setCourseId(product.courseId || "");
    setFeaturesRu(pFeatures?.ru || []);
    setFeaturesDe(pFeatures?.de || []);
    setNewFeature("");
    setActiveLang("ru");
    setErrorMsg("");
    setIsCategoryOpen(false);
    setIsSubCategoryOpen(false);
    setIsModalOpen(true);
  };

  // Изменение статуса активности (isAvailable) в БД по клику на тумблер
  const handleToggleAvailable = async (id: string, currentStatus: boolean) => {
    try {
      const updatedStatus = !currentStatus;
      
      // Локально обновляем статус в интерфейсе сразу для быстродействия
      setProducts(prev => prev.map(p => p.id === id ? { ...p, isAvailable: updatedStatus } : p));

      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isAvailable: updatedStatus,
          // Передаем текущие данные, чтобы Zod прошел валидацию
          name: typeof products.find(p => p.id === id).name === "string" 
            ? JSON.parse(products.find(p => p.id === id).name) 
            : products.find(p => p.id === id).name,
          description: typeof products.find(p => p.id === id).description === "string"
            ? JSON.parse(products.find(p => p.id === id).description)
            : products.find(p => p.id === id).description,
          price: products.find(p => p.id === id).price,
          category: products.find(p => p.id === id).category,
          courseId: products.find(p => p.id === id).courseId || null,
        }),
      });

      if (!res.ok) {
        // Если ошибка сервера, откатываем статус назад
        setProducts(prev => prev.map(p => p.id === id ? { ...p, isAvailable: currentStatus } : p));
        console.error("Ошибка при обновлении активности товара");
      }
    } catch (err) {
      setProducts(prev => prev.map(p => p.id === id ? { ...p, isAvailable: currentStatus } : p));
      console.error(err);
    }
  };

  // Загрузка изображения на сервер Vercel Blob
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith("image/")) {
      if (showNotification) {
        showNotification("Пожалуйста, выберите графический файл (изображение)", "error");
      } else {
        alert("Пожалуйста, выберите графический файл (изображение)");
      }
      return;
    }

    setIsUploading(true);
    setUploadProgress(20); // Имитация начала загрузки

    try {
      const formData = new FormData();
      formData.append("file", file);

      setUploadProgress(50);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(90);

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Ошибка при загрузке картинки");
      }

      setImageUrl(data.url);
      setUploadProgress(100);
    } catch (err: any) {
      if (showNotification) {
        showNotification(err.message || "Не удалось загрузить изображение", "error");
      } else {
        alert(err.message || "Не удалось загрузить изображение");
      }
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  /**
   * Удаление файла из хранилища Vercel Blob
   */
  const deleteBlobFile = async (url: string) => {
    try {
      const response = await fetch("/api/admin/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        console.error("Ошибка при удалении файла из Blob:", data.message);
      }
    } catch (err) {
      console.error("Ошибка сети при удалении файла из Blob:", err);
    }
  };

  // Удаление товара (DELETE)
  const handleDeleteProduct = (id: string) => {
    const productToDelete = products.find(p => p.id === id);
    setConfirmModal({
      isOpen: true,
      title: "Удаление товара",
      message: "Вы уверены, что хотите удалить этот товар? Это действие нельзя отменить.",
      danger: true,
      confirmText: "Удалить",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/products/${id}`, {
            method: "DELETE",
          });

          if (res.ok) {
            setProducts(prev => prev.filter(p => p.id !== id));
            
            // Удаляем изображение товара из Vercel Blob
            if (productToDelete?.imageUrl && productToDelete.imageUrl.includes(".public.blob.vercel-storage.com")) {
              await deleteBlobFile(productToDelete.imageUrl);
            }

            if (showNotification) {
              showNotification("Товар успешно удален!", "success");
            }
          } else {
            const data = await res.json();
            if (showNotification) {
              showNotification(data.message || "Не удалось удалить товар", "error");
            } else {
              alert(data.message || "Не удалось удалить товар");
            }
          }
        } catch (err) {
          console.error(err);
          if (showNotification) {
            showNotification("Произошла ошибка при попытке удаления товара", "error");
          } else {
            alert("Произошла ошибка при попытке удаления товара");
          }
        }
      }
    });
  };

  // Добавление новой особенности товара
  const handleAddFeature = () => {
    if (!newFeature.trim()) return;

    if (activeLang === "ru") {
      setFeaturesRu(prev => [...prev, newFeature.trim()]);
    } else {
      setFeaturesDe(prev => [...prev, newFeature.trim()]);
    }
    setNewFeature("");
  };

  // Удаление особенности товара
  const handleRemoveFeature = (idx: number) => {
    if (activeLang === "ru") {
      setFeaturesRu(prev => prev.filter((_, i) => i !== idx));
    } else {
      setFeaturesDe(prev => prev.filter((_, i) => i !== idx));
    }
  };

  // Отправка формы (создание или обновление)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!nameRu.trim()) {
      setErrorMsg("Название товара на русском языке обязательно");
      return;
    }
    if (!descRu.trim()) {
      setErrorMsg("Описание товара на русском языке обязательно");
      return;
    }
    if (price <= 0) {
      setErrorMsg("Цена товара должна быть больше нуля");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      name: {
        ru: nameRu.trim(),
        de: nameDe.trim() || nameRu.trim(), // Если нет англ., дублируем русское
      },
      description: {
        ru: descRu.trim(),
        de: descDe.trim() || descRu.trim(),
      },
      price: Number(price),
      oldPrice: oldPrice !== "" ? Number(oldPrice) : null,
      imageUrl: imageUrl || null,
      category,
      subCategory: category === "CONSULTATION" && subCategory ? subCategory : null,
      courseId: category === "COURSE" && courseId ? courseId : null,
      features: {
        ru: featuresRu,
        de: featuresDe.length > 0 ? featuresDe : featuresRu,
      },
      isAvailable: editingProduct ? editingProduct.isAvailable : true,
    };

    try {
      const url = editingProduct 
        ? `/api/admin/products/${editingProduct.id}`
        : "/api/admin/products";
      const method = editingProduct ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Ошибка при сохранении товара");
      }

      if (editingProduct) {
        // Удаляем старое изображение из Vercel Blob, если оно было изменено или стерто
        const oldImg = editingProduct.imageUrl;
        if (oldImg && oldImg !== payload.imageUrl && oldImg.includes(".public.blob.vercel-storage.com")) {
          await deleteBlobFile(oldImg);
        }

        // Обновляем в локальном стейте
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? data.product : p));
      } else {
        // Добавляем новый в локальный стейт
        setProducts(prev => [data.product, ...prev]);
      }

      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Произошла ошибка при сохранении товара");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Получение текстового названия категории на русском
  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "BRACELET": return "Браслет";
      case "COURSE": return "Курс";
      case "CONSULTATION": return "Услуга/Консультация";
      default: return cat;
    }
  };

  // Вспомогательный метод получения имени продукта
  const getProductName = (product: any) => {
    const nameObj = typeof product.name === "string" ? JSON.parse(product.name) : product.name;
    return nameObj?.ru || "Без названия";
  };

  // Вспомогательный метод получения описания продукта
  const getProductDesc = (product: any) => {
    if (!product.description) return "";
    try {
      const descObj = typeof product.description === "string" ? JSON.parse(product.description) : product.description;
      return descObj?.ru || "";
    } catch (e) {
      return typeof product.description === "string" ? product.description : "";
    }
  };


  // Фильтруем продукты по выбранной категории
  const filteredProducts = products.filter((product) => {
    if (filter !== "ALL" && product.category !== filter) {
      return false;
    }
    if (filter === "CONSULTATION" && subFilter !== "ALL" && product.subCategory !== subFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-dark)" }}>
            Товары магазина ({filteredProducts.length} из {products.length})
          </h2>
          <p style={{ fontSize: "12px", color: "var(--color-gray)" }}>
            Управление амулетами, курсами и консультациями Ольги в реальном времени
          </p>
        </div>
        <button className={styles.addBtn} onClick={handleOpenAddModal}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Добавить товар
        </button>
      </div>

      {/* Кнопки фильтрации категорий, аналогичные магазину */}
      <section className={styles.filterSection}>
        <div className={styles.filterRow}>
          <button
            className={`${styles.filterBtn} ${filter === "ALL" ? styles.filterBtnActive : ""}`}
            onClick={() => handleMainFilterChange("ALL")}
          >
            Все предложения
          </button>
          <button
            className={`${styles.filterBtn} ${filter === "BRACELET" ? styles.filterBtnActive : ""}`}
            onClick={() => handleMainFilterChange("BRACELET")}
          >
            Амулетные браслеты
          </button>
          <button
            className={`${styles.filterBtn} ${filter === "COURSE" ? styles.filterBtnActive : ""}`}
            onClick={() => handleMainFilterChange("COURSE")}
          >
            Обучающие курсы
          </button>
          <button
            className={`${styles.filterBtn} ${filter === "CONSULTATION" ? styles.filterBtnActive : ""}`}
            onClick={() => handleMainFilterChange("CONSULTATION")}
          >
            Услуги и Консультации
          </button>
        </div>

        {/* Подфильтры для консультаций */}
        {filter === "CONSULTATION" && (
          <div className={styles.subFilterRow}>
            <button
              className={`${styles.subFilterBtn} ${subFilter === "ALL" ? styles.subFilterBtnActive : ""}`}
              onClick={() => setSubFilter("ALL")}
            >
              Все услуги
            </button>
            <button
              className={`${styles.subFilterBtn} ${subFilter === "NUMEROLOGY" ? styles.subFilterBtnActive : ""}`}
              onClick={() => setSubFilter("NUMEROLOGY")}
            >
              Нумерология
            </button>
            <button
              className={`${styles.subFilterBtn} ${subFilter === "TAROT" ? styles.subFilterBtnActive : ""}`}
              onClick={() => setSubFilter("TAROT")}
            >
              Карты Таро
            </button>
            <button
              className={`${styles.subFilterBtn} ${subFilter === "WAX" ? styles.subFilterBtnActive : ""}`}
              onClick={() => setSubFilter("WAX")}
            >
              Восковые отливки
            </button>
            <button
              className={`${styles.subFilterBtn} ${subFilter === "LADING" ? styles.subFilterBtnActive : ""}`}
              onClick={() => setSubFilter("LADING")}
            >
              Ладование
            </button>
          </div>
        )}
      </section>

      {filteredProducts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--color-gray)", border: "1px dashed var(--color-gray-border)", borderRadius: "12px" }}>
          <p>Нет товаров, соответствующих выбранным фильтрам.</p>
        </div>
      ) : (
        <div className={styles.productsGrid}>
          {filteredProducts.map((product) => {
            const name = getProductName(product);
            const emoji = product.category === "COURSE" ? "📖" : product.category === "CONSULTATION" ? "🔮" : "📿";

            return (
              <div key={product.id} className={styles.productCard}>
                <div className={styles.cardImageWrapper}>
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={name} className={styles.cardImage} />
                  ) : (
                    <span className={styles.cardEmoji}>{emoji}</span>
                  )}
                  <span className={`${styles.categoryBadge} ${styles[`badge${product.category}`]}`}>
                    {getCategoryLabel(product.category)}
                  </span>
                </div>

                <div className={styles.cardContent}>
                  <h4 className={styles.cardTitle}>{name}</h4>
                  
                  <div className={styles.priceBlock}>
                    <span className={styles.currentPrice}>{product.price} €</span>
                    {product.oldPrice && (
                      <span className={styles.oldPrice}>{product.oldPrice} €</span>
                    )}
                  </div>

                  <p className={styles.productDesc}>
                    {getProductDesc(product)}
                  </p>


                  <div className={styles.cardActions}>
                    {/* Переключатель активности */}
                    <div className={styles.statusToggle}>
                      <span className={styles.toggleLabel}>Активен:</span>
                      <label className={styles.switch}>
                        <input 
                          type="checkbox" 
                          checked={product.isAvailable} 
                          onChange={() => handleToggleAvailable(product.id, product.isAvailable)} 
                        />
                        <span className={styles.slider}></span>
                      </label>
                    </div>

                    <div style={{ display: "flex", gap: "6px" }}>
                      <button className={styles.editBtn} onClick={() => handleOpenEditModal(product)}>
                        Ред.
                      </button>
                      <button className={styles.deleteBtn} onClick={() => handleDeleteProduct(product.id)} aria-label="Удалить товар">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- Модальное окно создания / редактирования товара --- */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>{editingProduct ? "Редактировать товар" : "Добавить новый товар"}</h3>
              <span className={styles.closeBtn} onClick={() => setIsModalOpen(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </span>
            </div>

            <form onSubmit={handleSubmit}>
              <div className={styles.modalBody}>
                {errorMsg && (
                  <div style={{ padding: "12px", backgroundColor: "#fef2f2", color: "#ef4444", borderRadius: "8px", fontSize: "13px", fontWeight: 600, marginBottom: "16px" }}>
                    {errorMsg}
                  </div>
                )}

                {/* Вкладки переключения языков */}
                <div className={styles.langTabs}>
                  <button 
                    type="button" 
                    className={`${styles.langTab} ${activeLang === "ru" ? styles.langTabActive : ""}`}
                    onClick={() => setActiveLang("ru")}
                  >
                    Русский язык (RU) *
                  </button>
                  <button 
                    type="button" 
                    className={`${styles.langTab} ${activeLang === "de" ? styles.langTabActive : ""}`}
                    onClick={() => setActiveLang("de")}
                  >
                    Немецкий перевод (DE)
                  </button>
                </div>

                {/* Мультиязычные поля на основе выбранного языка */}
                {activeLang === "ru" ? (
                  <>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Название на русском *</label>
                      <input 
                        type="text" 
                        className={styles.formInput} 
                        placeholder="Например: Амулетный браслет «Финансовый поток»"
                        value={nameRu}
                        onChange={(e) => setNameRu(e.target.value)}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Описание на русском *</label>
                      <textarea 
                        rows={4}
                        className={styles.formTextarea} 
                        placeholder="Детальное описание товара, его свойств и назначения..."
                        value={descRu}
                        onChange={(e) => setDescRu(e.target.value)}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Название на немецком (перевод)</label>
                      <input 
                        type="text" 
                        className={styles.formInput} 
                        placeholder="Например: Amulett-Armband 'Finanzfluss'"
                        value={nameDe}
                        onChange={(e) => setNameDe(e.target.value)}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Описание на немецком (перевод)</label>
                      <textarea 
                        rows={4}
                        className={styles.formTextarea} 
                        placeholder="Deutsche Beschreibung des Produkts..."
                        value={descDe}
                        onChange={(e) => setDescDe(e.target.value)}
                      />
                    </div>
                  </>
                )}

                {/* Категории */}
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Категория</label>
                    <div className={styles.customSelectContainer}>
                      <div 
                        className={`${styles.customSelectTrigger} ${isCategoryOpen ? styles.customSelectTriggerActive : ""}`}
                        onClick={() => {
                          setIsCategoryOpen(!isCategoryOpen);
                          setIsSubCategoryOpen(false);
                        }}
                      >
                        <span>{getCategoryLabel(category)}</span>
                        <span style={{ fontSize: "10px", color: "var(--color-primary)" }}>▼</span>
                      </div>

                      {isCategoryOpen && (
                        <>
                          <div 
                            style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 }} 
                            onClick={() => setIsCategoryOpen(false)}
                          />
                          <div className={styles.customSelectDropdown}>
                            <div 
                              className={`${styles.customSelectOption} ${category === "BRACELET" ? styles.customSelectOptionSelected : ""}`}
                              onClick={() => {
                                setCategory("BRACELET");
                                setIsCategoryOpen(false);
                              }}
                            >
                              Амулетный браслет
                            </div>
                            <div 
                              className={`${styles.customSelectOption} ${category === "COURSE" ? styles.customSelectOptionSelected : ""}`}
                              onClick={() => {
                                setCategory("COURSE");
                                setIsCategoryOpen(false);
                              }}
                            >
                              Обучающий курс
                            </div>
                            <div 
                              className={`${styles.customSelectOption} ${category === "CONSULTATION" ? styles.customSelectOptionSelected : ""}`}
                              onClick={() => {
                                setCategory("CONSULTATION");
                                setIsCategoryOpen(false);
                              }}
                            >
                              Услуга/Консультация
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {category === "CONSULTATION" ? (
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Подкатегория услуги</label>
                      <div className={styles.customSelectContainer}>
                        <div 
                          className={`${styles.customSelectTrigger} ${isSubCategoryOpen ? styles.customSelectTriggerActive : ""}`}
                          onClick={() => {
                            setIsSubCategoryOpen(!isSubCategoryOpen);
                            setIsCategoryOpen(false);
                          }}
                        >
                          <span>
                            {subCategory === "NUMEROLOGY" ? "Нумерология" :
                             subCategory === "TAROT" ? "Карты Таро" :
                             subCategory === "WAX" ? "Восковые отливки" :
                             subCategory === "LADING" ? "Энергетическое Ладование" :
                             "Без подкатегории"}
                          </span>
                          <span style={{ fontSize: "10px", color: "var(--color-primary)" }}>▼</span>
                        </div>

                        {isSubCategoryOpen && (
                          <>
                            <div 
                              style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 }} 
                              onClick={() => setIsSubCategoryOpen(false)}
                            />
                            <div className={styles.customSelectDropdown}>
                              <div 
                                className={`${styles.customSelectOption} ${subCategory === "" ? styles.customSelectOptionSelected : ""}`}
                                onClick={() => {
                                  setSubCategory("");
                                  setIsSubCategoryOpen(false);
                                }}
                              >
                                Без подкатегории
                              </div>
                              <div 
                                className={`${styles.customSelectOption} ${subCategory === "NUMEROLOGY" ? styles.customSelectOptionSelected : ""}`}
                                onClick={() => {
                                  setSubCategory("NUMEROLOGY");
                                  setIsSubCategoryOpen(false);
                                }}
                              >
                                Нумерология
                              </div>
                              <div 
                                className={`${styles.customSelectOption} ${subCategory === "TAROT" ? styles.customSelectOptionSelected : ""}`}
                                onClick={() => {
                                  setSubCategory("TAROT");
                                  setIsSubCategoryOpen(false);
                                }}
                              >
                                Карты Таро
                              </div>
                              <div 
                                className={`${styles.customSelectOption} ${subCategory === "WAX" ? styles.customSelectOptionSelected : ""}`}
                                onClick={() => {
                                  setSubCategory("WAX");
                                  setIsSubCategoryOpen(false);
                                }}
                              >
                                Восковые отливки
                              </div>
                              <div 
                                className={`${styles.customSelectOption} ${subCategory === "LADING" ? styles.customSelectOptionSelected : ""}`}
                                onClick={() => {
                                  setSubCategory("LADING");
                                  setIsSubCategoryOpen(false);
                                }}
                              >
                                Энергетическое Ладование
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Подкатегория (недоступно)</label>
                      <input type="text" className={styles.formInput} value="Только для услуг" disabled />
                    </div>
                  )}
                </div>

                {/* Выбор курса для категории COURSE */}
                {category === "COURSE" && (
                  <div className={styles.formGroup} style={{ marginBottom: "20px" }}>
                    <label className={styles.formLabel}>Привязанный онлайн-курс *</label>
                    <select
                      className={styles.formInput}
                      value={courseId}
                      onChange={(e) => setCourseId(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "12px",
                        border: "1px solid var(--color-gray-border)",
                        borderRadius: "8px",
                        backgroundColor: "#fff",
                        color: "var(--color-dark)",
                        fontSize: "14px",
                        outline: "none",
                        cursor: "pointer",
                      }}
                    >
                      <option value="">-- Выберите курс из списка --</option>
                      {courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.title}
                        </option>
                      ))}
                    </select>
                    <p style={{ fontSize: "11px", color: "var(--color-gray)", marginTop: "4px" }}>
                      При покупке этого товара пользователю автоматически откроется доступ к выбранному курсу.
                    </p>
                  </div>
                )}

                {/* Цены */}
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Текущая стоимость (€) *</label>
                    <input 
                      type="number" 
                      className={styles.formInput} 
                      placeholder="Стоимость в евро"
                      value={price || ""}
                      onChange={(e) => setPrice(Number(e.target.value))}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Старая стоимость (€) — для скидки</label>
                    <input 
                      type="number" 
                      className={styles.formInput} 
                      placeholder="Старая цена (зачеркнутая)"
                      value={oldPrice}
                      onChange={(e) => setOldPrice(e.target.value === "" ? "" : Number(e.target.value))}
                    />
                  </div>
                </div>

                {/* Загрузка картинки */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Изображение товара</label>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                  <div className={styles.imageUploadArea} onClick={() => fileInputRef.current?.click()}>
                    {isUploading && (
                      <div className={styles.progressBar} style={{ width: `${uploadProgress}%` }}></div>
                    )}
                    
                    {imageUrl ? (
                      <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center" }} onClick={(e) => e.stopPropagation()}>
                        <img src={imageUrl} alt="Превью" className={styles.uploadPreview} />
                        <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "12px" }}>
                          <span 
                            style={{ fontSize: "12px", color: "var(--color-primary)", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
                            onClick={() => fileInputRef.current?.click()}
                          >
                            Заменить
                          </span>
                          <span style={{ color: "var(--color-gray-border)", fontSize: "12px" }}>|</span>
                          <span 
                            style={{ fontSize: "12px", color: "#ef4444", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
                            onClick={() => setImageUrl("")}
                          >
                            Удалить
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className={styles.uploadPlaceholder}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                          <circle cx="8.5" cy="8.5" r="1.5"></circle>
                          <polyline points="21 15 16 10 5 21"></polyline>
                        </svg>
                        <span>Загрузить изображение товара</span>
                        <span style={{ fontSize: "11px", color: "var(--color-gray)" }}>
                          Рекомендуется формат JPEG/PNG, размер до 5 МБ
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Управление особенностями (Features) */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Особенности товара ({activeLang === "ru" ? "RU" : "DE"})
                  </label>
                  <div className={styles.featureInputRow}>
                    <input 
                      type="text" 
                      className={styles.formInput} 
                      placeholder={activeLang === "ru" ? "Например: Натуральный цитрин класса ААА" : "z.B. Natur-Citrin der Klasse AAA"}
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddFeature())}
                    />
                    <button type="button" className={styles.addBtn} style={{ padding: "10px 14px", flexShrink: 0 }} onClick={handleAddFeature}>
                      +
                    </button>
                  </div>

                  <div className={styles.featureList}>
                    {(activeLang === "ru" ? featuresRu : featuresDe).map((feat, idx) => (
                      <div key={idx} className={styles.featureItem}>
                        <span>{feat}</span>
                        <span className={styles.removeFeatureBtn} onClick={() => handleRemoveFeature(idx)}>
                          ✕
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={() => setIsModalOpen(false)}>
                  Отмена
                </button>
                <button type="submit" className={styles.submitBtn} disabled={isSubmitting || isUploading}>
                  {isSubmitting ? "Сохранение..." : editingProduct ? "Сохранить изменения" : "Создать товар"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Кастомный диалог подтверждения */}
      <ConfirmModal
        {...confirmModal}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
