import React from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { db } from "src/lib/db";
import ProductDetailClient from "./ProductDetailClient";

interface IProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

// Вспомогательная функция для парсинга локализованных полей
function getTranslation(fieldObj: any, lang: string = "ru") {
  if (!fieldObj) return "";
  try {
    const parsed = typeof fieldObj === "string" ? JSON.parse(fieldObj) : fieldObj;
    return parsed[lang] || parsed["ru"] || "";
  } catch (e) {
    return typeof fieldObj === "string" ? fieldObj : "";
  }
}

/**
 * Генерация динамических SEO метаданных для конкретного товара
 */
export async function generateMetadata({ params }: IProductPageProps): Promise<Metadata> {
  const { id } = await params;
  
  // Считываем язык из кук на сервере
  const cookieStore = await cookies();
  const language = cookieStore.get("khavich_language")?.value === "de" ? "de" : "ru";

  const product = await db.product.findUnique({
    where: { id, isAvailable: true },
  });

  if (!product) {
    return {
      title: language === "ru" ? "Товар не найден | Магазин" : "Produkt nicht gefunden | Shop",
    };
  }

  const name = getTranslation(product.name, language);
  const description = getTranslation(product.description, language).substring(0, 160);

  return {
    title: `${name} | Магазин Ольги Хавич`,
    description: description,
    openGraph: {
      title: `${name} | Магазин Ольги Хавич`,
      description: description,
      images: product.imageUrl ? [{ url: product.imageUrl }] : [],
    },
  };
}

/**
 * Серверный компонент детальной страницы товара (/shop/[id])
 */
export default async function ProductDetailPage({ params }: IProductPageProps) {
  const { id } = await params;

  // Считываем язык на сервере
  const cookieStore = await cookies();
  const language = cookieStore.get("khavich_language")?.value === "de" ? "de" : "ru";

  // Загружаем товар из базы данных
  const product = await db.product.findUnique({
    where: { id, isAvailable: true },
  });

  if (!product) {
    redirect("/shop");
  }

  // Преобразуем decimal/даты из Prisma в простые типы для безопасной сериализации
  const plainProduct = {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    oldPrice: product.oldPrice,
    imageUrl: product.imageUrl,
    category: product.category,
    subCategory: product.subCategory,
    features: product.features,
    isAvailable: product.isAvailable,
  };

  return <ProductDetailClient product={plainProduct} serverLanguage={language} />;
}
