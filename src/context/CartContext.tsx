"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
/**
 * Интерфейс, описывающий продукт (товар, услугу или курс)
 */
export interface IProduct {
  id: string;
  name: string | any; // Поддерживаем как строки, так и JSON-объекты из БД
  description: string | any;
  price: number;
  oldPrice?: number | null;
  imageUrl: string | null;
  category: "BRACELET" | "COURSE" | "CONSULTATION";
  isAvailable: boolean;
  subCategory?: string | null;
}
import {
  addItemToCartHelper,
  calculateCartCount,
  calculateCartTotal,
} from "src/lib/cartUtils";

/**
 * Интерфейс элемента корзины
 */
export interface ICartItem {
  product: IProduct;
  quantity: number;
}

/**
 * Интерфейс контекста корзины
 */
interface ICartContextType {
  items: ICartItem[];
  addToCart: (product: IProduct, openCart?: boolean) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  count: number;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
}

// Создаем контекст корзины со значением по умолчанию undefined
const CartContext = createContext<ICartContextType | undefined>(undefined);

/**
 * Провайдер контекста корзины для оборачивания приложения
 */
export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<ICartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  // 1. Загрузка корзины из localStorage при инициализации на клиенте
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("khavych_cart");
      if (savedCart) {
        setItems(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error("Ошибка при чтении корзины из localStorage:", error);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // 2. Сохранение корзины в localStorage при любых изменениях
  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem("khavych_cart", JSON.stringify(items));
      } catch (error) {
        console.error("Ошибка при сохранении корзины в localStorage:", error);
      }
    }
  }, [items, isInitialized]);

  /**
   * Добавление товара в корзину с использованием чистой функции хелпера.
   */
  const addToCart = (product: IProduct, openCart: boolean = true) => {
    setItems((prevItems) => addItemToCartHelper(prevItems, product));
    if (openCart) {
      setIsCartOpen(true);
    }
  };

  /**
   * Удаление товара из корзины целиком
   */
  const removeFromCart = (productId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.product.id !== productId));
  };

  /**
   * Изменение количества товара (актуально только для браслетов)
   */
  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.product.id === productId) {
          if (item.product.category !== "BRACELET") {
            return item;
          }
          return { ...item, quantity };
        }
        return item;
      })
    );
  };

  /**
   * Полная очистка корзины
   */
  const clearCart = () => {
    setItems([]);
  };

  // Вычисление общего количества товаров с помощью хелпера
  const count = calculateCartCount(items);

  // Вычисление общей стоимости с помощью хелпера
  const total = calculateCartTotal(items);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        total,
        count,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

/**
 * Пользовательский хук для удобного использования корзины в компонентах
 */
export const useCart = (): ICartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart должен использоваться внутри CartProvider");
  }
  return context;
};
