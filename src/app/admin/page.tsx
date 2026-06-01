import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "src/lib/auth";
import { db } from "src/lib/db";
import styles from "../cabinet/cabinet.module.css";
import { AdminClient, IAdminUser } from "src/components/AdminClient";
import { Header } from "src/components/Header";

// Принудительно устанавливаем динамический рендеринг, так как страница зависит от кук сессии
export const dynamic = "force-dynamic";

/**
 * Серверный компонент страницы Админ-панели Ольги (/admin).
 * Проверяет роль администратора (ADMIN), загружает всех пользователей и все курсы из БД
 * и передает их в клиентский интерактивный компонент AdminClient для управления доступами.
 */
export default async function AdminPage() {
  // 1. Проверяем сессию и права администратора
  const session = await getServerSession();

  if (!session || session.role !== "ADMIN") {
    // Если нет прав, перенаправляем на страницу входа
    redirect("/login");
  }

  // 2. Получаем список всех пользователей с их детальными доступами к курсам
  const usersFromDb = await db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      accesses: {
        select: {
          courseId: true,
          grantedAt: true,
          expiresAt: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Приведение типа к интерфейсу IAdminUser с сериализацией дат в ISO-строки
  const users = usersFromDb.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role as "USER" | "ADMIN",
    accesses: u.accesses.map((a) => ({
      courseId: a.courseId,
      grantedAt: a.grantedAt.toISOString(),
      expiresAt: a.expiresAt ? a.expiresAt.toISOString() : null,
    })),
  }));

  // 3. Получаем список всех доступных курсов в системе вместе с уроками
  const coursesFromDb = await db.course.findMany({
    include: {
      lessons: {
        orderBy: {
          order: "asc",
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // Сериализация дат курсов и их уроков в ISO-строки
  const courses = coursesFromDb.map((c) => ({
    id: c.id,
    title: c.title,
    titleDe: c.titleDe,
    description: c.description,
    descriptionDe: c.descriptionDe,
    imageUrl: c.imageUrl,
    imageUrlDe: c.imageUrlDe,
    isPublished: c.isPublished,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    lessons: c.lessons.map((l) => ({
      id: l.id,
      courseId: l.courseId,
      title: l.title,
      titleDe: l.titleDe,
      description: l.description,
      descriptionDe: l.descriptionDe,
      videoUrl: l.videoUrl,
      videoUrlDe: l.videoUrlDe,
      videoCoverUrl: l.videoCoverUrl,
      videoCoverUrlDe: l.videoCoverUrlDe,
      fileUrls: l.fileUrls,
      fileUrlsDe: l.fileUrlsDe,
      order: l.order,
      createdAt: l.createdAt.toISOString(),
      updatedAt: l.updatedAt.toISOString(),
    })),
  }));

  // 4. Получаем список всех товаров в магазине для управления ими
  const productsFromDb = await db.product.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  const products = productsFromDb.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    oldPrice: p.oldPrice,
    imageUrl: p.imageUrl,
    category: p.category,
    subCategory: p.subCategory,
    features: p.features,
    isAvailable: p.isAvailable,
    courseId: p.courseId,
    createdAt: p.createdAt.toISOString(),
  }));


  return (
    <div className={styles.cabinetPage}>
      {/* Подключаем глобальный Header */}
      <Header />

      {/* Шапка админ-панели */}
      <div className={styles.cabinetHeader}>
        <div className={`container ${styles.headerContainer}`}>
          <div className={styles.userInfo}>
            <h1 className="text-gold">Панель управления Ольги</h1>
            <p>Управление доступами учеников к обучающим материалам</p>
          </div>
          <div className={styles.headerActions}>
            <Link href="/cabinet" className="btn btn-secondary">
              В личный кабинет
            </Link>
            <a
              href="/api/auth/logout"
              className="btn btn-primary"
              style={{ backgroundColor: "#555", borderColor: "#555" }}
            >
              Выйти
            </a>
          </div>
        </div>
      </div>

      {/* Основной интерактивный контент управления доступами */}
      <main className="container">
        <section className={styles.coursesSection}>
          <h2 className={styles.sectionTitle}>База учеников и управление доступами</h2>
          
          <AdminClient 
            initialUsers={users} 
            courses={courses} 
            initialProducts={products}
          />
        </section>
      </main>
    </div>
  );
}
