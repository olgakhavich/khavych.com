"use client";

import React, { useState } from "react";
import Link from "next/link";
import styles from "../app/cabinet/cabinet.module.css";
import { AdminProducts } from "./AdminProducts";
import { AdminSettings } from "./AdminSettings";
import { AdminOrders } from "./AdminOrders";
import { ConfirmModal } from "./ConfirmModal";

// --- ИНТЕРФЕЙСЫ ТИПИЗАЦИИ ---

export interface ILesson {
  id: string;
  courseId: string;
  title: string;
  titleDe?: string | null;
  description: string;
  descriptionDe?: string | null;
  videoUrl: string | null;
  videoUrlDe?: string | null;
  videoCoverUrl: string | null;
  videoCoverUrlDe?: string | null;
  fileUrls: string[];
  fileUrlsDe: string[];
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface IAdminCourse {
  id: string;
  title: string;
  titleDe?: string | null;
  description: string;
  descriptionDe?: string | null;
  imageUrl: string | null;
  imageUrlDe?: string | null;
  isPublished: boolean;
  lessons: ILesson[];
  createdAt: string;
  updatedAt: string;
}

export interface IAdminUserAccess {
  courseId: string;
  grantedAt: string;
  expiresAt: string | null;
}

export interface IAdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "USER" | "ADMIN";
  additionalInfo?: string | null;
  accesses: IAdminUserAccess[];
}

export interface IDBProduct {
  id: string;
  name: any;
  description: any;
  price: number;
  oldPrice: number | null;
  imageUrl: string | null;
  category: "BRACELET" | "COURSE" | "CONSULTATION";
  subCategory: string | null;
  features: any;
  isAvailable: boolean;
  createdAt: string;
}

interface IAdminClientProps {
  initialUsers: IAdminUser[];
  courses: IAdminCourse[];
  initialProducts: any[];
}

export const AdminClient: React.FC<IAdminClientProps> = ({ initialUsers, courses, initialProducts }) => {
  // --- СОСТОЯНИЕ (STATE) ---

  const [activeTab, setActiveTab] = useState<"users" | "courses" | "products" | "orders" | "settings">("users");

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
  const [users, setUsers] = useState<IAdminUser[]>(initialUsers);
  const [localCourses, setLocalCourses] = useState<IAdminCourse[]>(courses);

  // Поиск пользователей
  const [searchQuery, setSearchQuery] = useState<string>("");

  // --- МОДАЛЬНОЕ ОКНО РЕДАКТИРОВАНИЯ КУРСА ---
  const [courseModal, setCourseModal] = useState<{
    isOpen: boolean;
    mode: "create" | "edit";
    courseId: string;
    title: string;
    titleDe: string;
    description: string;
    descriptionDe: string;
    imageUrl: string;
    imageUrlDe: string;
  }>({
    isOpen: false,
    mode: "create",
    courseId: "",
    title: "",
    titleDe: "",
    description: "",
    descriptionDe: "",
    imageUrl: "",
    imageUrlDe: "",
  });
  const [courseImageUploading, setCourseImageUploading] = useState<boolean>(false);
  const [courseImageUploadProgress, setCourseImageUploadProgress] = useState<number>(0);
  const [courseImageDeUploading, setCourseImageDeUploading] = useState<boolean>(false);
  const [courseImageDeUploadProgress, setCourseImageDeUploadProgress] = useState<number>(0);
  
  const [lessonCoverUploading, setLessonCoverUploading] = useState<boolean>(false);
  const [lessonCoverUploadProgress, setLessonCoverUploadProgress] = useState<number>(0);
  const [lessonCoverDeUploading, setLessonCoverDeUploading] = useState<boolean>(false);
  const [lessonCoverDeUploadProgress, setLessonCoverDeUploadProgress] = useState<number>(0);

  const [lessonFileUploading, setLessonFileUploading] = useState<Record<number, boolean>>({});
  const [lessonFileProgress, setLessonFileProgress] = useState<Record<number, number>>({});
  const [lessonFileDeUploading, setLessonFileDeUploading] = useState<Record<number, boolean>>({});
  const [lessonFileDeProgress, setLessonFileDeProgress] = useState<Record<number, number>>({});

  // Состояния активных языковых вкладок в модальных окнах
  const [courseActiveTab, setCourseActiveTab] = useState<"ru" | "de">("ru");
  const [lessonActiveTab, setLessonActiveTab] = useState<"ru" | "de">("ru");

  // --- МОДАЛЬНОЕ ОКНО УПРАВЛЕНИЯ УЧЕНИКОМ ---
  const [userModal, setUserModal] = useState<{
    isOpen: boolean;
    mode: "create" | "edit";
    userId: string;
    name: string;
    email: string;
    phone: string;
    role: "USER" | "ADMIN";
    additionalInfo: string;
  }>({
    isOpen: false,
    mode: "create",
    userId: "",
    name: "",
    email: "",
    phone: "",
    role: "USER",
    additionalInfo: "",
  });

  // Состояния для всплывающих уведомлений
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // --- МОДАЛЬНОЕ ОКНО ДОСТУПОВ ---
  const [accessModalUser, setAccessModalUser] = useState<IAdminUser | null>(null);
  const [searchCourseQuery, setSearchCourseQuery] = useState<string>("");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [isCourseDropdownOpen, setIsCourseDropdownOpen] = useState<boolean>(false);
  const [accessDuration, setAccessDuration] = useState<"lifetime" | "30" | "90" | "180" | "custom">("lifetime");
  const [customDate, setCustomDate] = useState<string>("");

  // --- МОДАЛЬНОЕ ОКНО УРОКОВ ---
  const [lessonModal, setLessonModal] = useState<{
    isOpen: boolean;
    mode: "create" | "edit";
    courseId: string;
    lesson?: ILesson;
  }>({
    isOpen: false,
    mode: "create",
    courseId: "",
  });

  const [lessonForm, setLessonForm] = useState<{
    title: string;
    titleDe: string;
    description: string;
    descriptionDe: string;
    videoUrl: string;
    videoUrlDe: string;
    videoCoverUrl: string;
    videoCoverUrlDe: string;
    fileUrls: string[];
    fileUrlsDe: string[];
    order: number;
  }>({
    title: "",
    titleDe: "",
    description: "",
    descriptionDe: "",
    videoUrl: "",
    videoUrlDe: "",
    videoCoverUrl: "",
    videoCoverUrlDe: "",
    fileUrls: [""],
    fileUrlsDe: [""],
    order: 0,
  });

  // Состояние раскрытых курсов во вкладке уроков
  const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>({});

  const toggleCourseExpand = (courseId: string) => {
    setExpandedCourses((prev) => ({ ...prev, [courseId]: !prev[courseId] }));
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

  const showNotification = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  // --- УПРАВЛЕНИЕ ДОСТУПАМИ (API) ---

  const handleGrantAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessModalUser || !selectedCourseId) return;

    setActionLoading(true);
    setMessage(null);

    // Вычисляем expiresAt
    let expiresAt: string | null = null;
    if (accessDuration !== "lifetime") {
      const date = new Date();
      if (accessDuration === "30") {
        date.setDate(date.getDate() + 30);
        expiresAt = date.toISOString();
      } else if (accessDuration === "90") {
        date.setDate(date.getDate() + 90);
        expiresAt = date.toISOString();
      } else if (accessDuration === "180") {
        date.setDate(date.getDate() + 180);
        expiresAt = date.toISOString();
      } else if (accessDuration === "custom" && customDate) {
        expiresAt = new Date(customDate).toISOString();
      }
    }

    try {
      const response = await fetch("/api/admin/grant-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: accessModalUser.id,
          courseId: selectedCourseId,
          grant: true,
          expiresAt,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Ошибка при выдаче доступа");

      // Обновляем состояние на клиенте
      const newAccess: IAdminUserAccess = {
        courseId: selectedCourseId,
        grantedAt: new Date().toISOString(),
        expiresAt,
      };

      setUsers((prevUsers) =>
        prevUsers.map((u) => {
          if (u.id === accessModalUser.id) {
            // Если доступ к этому курсу уже был, заменяем его (upsert)
            const filtered = u.accesses.filter((a) => a.courseId !== selectedCourseId);
            return { ...u, accesses: [...filtered, newAccess] };
          }
          return u;
        })
      );

      // Обновляем текущего пользователя в модалке
      setAccessModalUser((prev) => {
        if (!prev) return null;
        const filtered = prev.accesses.filter((a) => a.courseId !== selectedCourseId);
        return { ...prev, accesses: [...filtered, newAccess] };
      });

      setSelectedCourseId("");
      setSearchCourseQuery("");
      setIsCourseDropdownOpen(false);
      setAccessDuration("lifetime");
      setCustomDate("");
      showNotification("Доступ успешно предоставлен!", "success");
    } catch (err: unknown) {
      showNotification(err instanceof Error ? err.message : "Произошла ошибка", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokeAccess = (courseId: string) => {
    if (!accessModalUser) return;
    setConfirmModal({
      isOpen: true,
      title: "Отозвать доступ к курсу",
      message: "Вы действительно хотите отозвать доступ к этому курсу?",
      danger: true,
      confirmText: "Отозвать",
      onConfirm: async () => {
        setActionLoading(true);
        setMessage(null);

        try {
          const response = await fetch("/api/admin/grant-access", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: accessModalUser.id,
              courseId,
              grant: false,
            }),
          });

          const result = await response.json();
          if (!response.ok) throw new Error(result.message || "Ошибка при отзыве доступа");

          // Обновляем состояние на клиенте
          setUsers((prevUsers) =>
            prevUsers.map((u) => {
              if (u.id === accessModalUser.id) {
                return { ...u, accesses: u.accesses.filter((a) => a.courseId !== courseId) };
              }
              return u;
            })
          );

          // Обновляем текущего пользователя в модалке
          setAccessModalUser((prev) => {
            if (!prev) return null;
            return { ...prev, accesses: prev.accesses.filter((a) => a.courseId !== courseId) };
          });

          showNotification("Доступ успешно отозван", "success");
        } catch (err: unknown) {
          showNotification(err instanceof Error ? err.message : "Произошла ошибка", "error");
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  // --- CRUD УРОКОВ (API) ---

  const handleOpenLessonModal = (mode: "create" | "edit", courseId: string, lesson?: ILesson) => {
    if (mode === "create") {
      const course = localCourses.find((c) => c.id === courseId);
      const nextOrder = course ? course.lessons.length + 1 : 1;
      setLessonForm({
        title: "",
        titleDe: "",
        description: "",
        descriptionDe: "",
        videoUrl: "",
        videoUrlDe: "",
        videoCoverUrl: "",
        videoCoverUrlDe: "",
        fileUrls: [""],
        fileUrlsDe: [""],
        order: nextOrder,
      });
      setLessonActiveTab("ru");
      setLessonModal({ isOpen: true, mode: "create", courseId });
    } else if (mode === "edit" && lesson) {
      setLessonForm({
        title: lesson.title,
        titleDe: lesson.titleDe || "",
        description: lesson.description,
        descriptionDe: lesson.descriptionDe || "",
        videoUrl: lesson.videoUrl || "",
        videoUrlDe: lesson.videoUrlDe || "",
        videoCoverUrl: lesson.videoCoverUrl || "",
        videoCoverUrlDe: lesson.videoCoverUrlDe || "",
        fileUrls: lesson.fileUrls.length > 0 ? [...lesson.fileUrls] : [""],
        fileUrlsDe: lesson.fileUrlsDe && lesson.fileUrlsDe.length > 0 ? [...lesson.fileUrlsDe] : [""],
        order: lesson.order,
      });
      setLessonActiveTab("ru");
      setLessonModal({ isOpen: true, mode: "edit", courseId, lesson });
    }
  };

  const handleAddFileUrlInput = () => {
    setLessonForm((prev) => ({ ...prev, fileUrls: [...prev.fileUrls, ""] }));
  };

  const handleRemoveFileUrlInput = (index: number) => {
    setLessonForm((prev) => ({
      ...prev,
      fileUrls: prev.fileUrls.filter((_, idx) => idx !== index),
    }));
  };

  const handleFileTitleChange = (index: number, newTitle: string) => {
    setLessonForm((prev) => {
      const updated = [...prev.fileUrls];
      const current = updated[index] || "";
      const parts = current.split(":::");
      const currentUrl = parts.length > 1 ? parts[1] : parts[0];
      updated[index] = newTitle.trim() ? `${newTitle.trim()}:::${currentUrl}` : currentUrl;
      return { ...prev, fileUrls: updated };
    });
  };

  const handleFileUrlChange = (index: number, newUrl: string) => {
    setLessonForm((prev) => {
      const updated = [...prev.fileUrls];
      const current = updated[index] || "";
      const parts = current.split(":::");
      const currentTitle = parts.length > 1 ? parts[0] : "";
      updated[index] = currentTitle ? `${currentTitle}:::${newUrl}` : newUrl;
      return { ...prev, fileUrls: updated };
    });
  };

  const handleAddFileUrlDeInput = () => {
    setLessonForm((prev) => ({ ...prev, fileUrlsDe: [...prev.fileUrlsDe, ""] }));
  };

  const handleRemoveFileUrlDeInput = (index: number) => {
    setLessonForm((prev) => ({
      ...prev,
      fileUrlsDe: prev.fileUrlsDe.filter((_, idx) => idx !== index),
    }));
  };

  const handleFileTitleDeChange = (index: number, newTitle: string) => {
    setLessonForm((prev) => {
      const updated = [...prev.fileUrlsDe];
      const current = updated[index] || "";
      const parts = current.split(":::");
      const currentUrl = parts.length > 1 ? parts[1] : parts[0];
      updated[index] = newTitle.trim() ? `${newTitle.trim()}:::${currentUrl}` : currentUrl;
      return { ...prev, fileUrlsDe: updated };
    });
  };

  const handleFileUrlDeChange = (index: number, newUrl: string) => {
    setLessonForm((prev) => {
      const updated = [...prev.fileUrlsDe];
      const current = updated[index] || "";
      const parts = current.split(":::");
      const currentTitle = parts.length > 1 ? parts[0] : "";
      updated[index] = currentTitle ? `${currentTitle}:::${newUrl}` : newUrl;
      return { ...prev, fileUrlsDe: updated };
    });
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setMessage(null);

    const cleanFileUrls = lessonForm.fileUrls.filter((url) => url.trim() !== "");
    const cleanFileUrlsDe = lessonForm.fileUrlsDe.filter((url) => url.trim() !== "");

    try {
      if (lessonModal.mode === "create") {
        const response = await fetch("/api/admin/lessons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseId: lessonModal.courseId,
            title: lessonForm.title,
            titleDe: lessonForm.titleDe || null,
            description: lessonForm.description,
            descriptionDe: lessonForm.descriptionDe || null,
            videoUrl: lessonForm.videoUrl || null,
            videoUrlDe: lessonForm.videoUrlDe || null,
            videoCoverUrl: lessonForm.videoCoverUrl || null,
            videoCoverUrlDe: lessonForm.videoCoverUrlDe || null,
            fileUrls: cleanFileUrls,
            fileUrlsDe: cleanFileUrlsDe,
            order: Number(lessonForm.order),
          }),
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Ошибка при создании урока");

        // Обновляем локальное состояние курсов
        setLocalCourses((prevCourses) =>
          prevCourses.map((c) => {
            if (c.id === lessonModal.courseId) {
              const updatedLessons = [...c.lessons, result.lesson].sort((a, b) => a.order - b.order);
              return { ...c, lessons: updatedLessons };
            }
            return c;
          })
        );

        showNotification("Урок успешно добавлен!", "success");
      } else {
        // Режим Редактирования (PUT)
        const lessonId = lessonModal.lesson?.id;
        const oldLesson = lessonModal.lesson;

        const response = await fetch(`/api/admin/lessons/${lessonId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: lessonForm.title,
            titleDe: lessonForm.titleDe || null,
            description: lessonForm.description,
            descriptionDe: lessonForm.descriptionDe || null,
            videoUrl: lessonForm.videoUrl || null,
            videoUrlDe: lessonForm.videoUrlDe || null,
            videoCoverUrl: lessonForm.videoCoverUrl || null,
            videoCoverUrlDe: lessonForm.videoCoverUrlDe || null,
            fileUrls: cleanFileUrls,
            fileUrlsDe: cleanFileUrlsDe,
            order: Number(lessonForm.order),
          }),
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Ошибка при сохранении урока");

        // Обновляем локальное состояние курсов
        setLocalCourses((prevCourses) =>
          prevCourses.map((c) => {
            if (c.id === lessonModal.courseId) {
              const updatedLessons = c.lessons
                  .map((l) => (l.id === lessonId ? result.lesson : l))
                  .sort((a, b) => a.order - b.order);
              return { ...c, lessons: updatedLessons };
            }
            return c;
          })
        );

        showNotification("Урок успешно обновлен!", "success");

        // Фоновое удаление замененных или удаленных файлов из Vercel Blob
        if (oldLesson) {
          // 1. Проверяем обложку видео (RU)
          if (oldLesson.videoCoverUrl && oldLesson.videoCoverUrl !== lessonForm.videoCoverUrl && oldLesson.videoCoverUrl.includes(".public.blob.vercel-storage.com")) {
            deleteBlobFile(oldLesson.videoCoverUrl);
          }
          // Обложка видео (DE)
          if (oldLesson.videoCoverUrlDe && oldLesson.videoCoverUrlDe !== lessonForm.videoCoverUrlDe && oldLesson.videoCoverUrlDe.includes(".public.blob.vercel-storage.com")) {
            deleteBlobFile(oldLesson.videoCoverUrlDe);
          }

          // 2. Проверяем удаленные файлы (материалы урока RU)
          const oldUrls = oldLesson.fileUrls.map((fu) => {
            const parts = fu.split(":::");
            return parts.length > 1 ? parts[1] : parts[0];
          });
          const newUrls = cleanFileUrls.map((fu) => {
            const parts = fu.split(":::");
            return parts.length > 1 ? parts[1] : parts[0];
          });
          for (const oldUrl of oldUrls) {
            if (oldUrl && !newUrls.includes(oldUrl) && oldUrl.includes(".public.blob.vercel-storage.com")) {
              deleteBlobFile(oldUrl);
            }
          }

          // Проверяем удаленные файлы (материалы урока DE)
          const oldUrlsDe = (oldLesson.fileUrlsDe || []).map((fu) => {
            const parts = fu.split(":::");
            return parts.length > 1 ? parts[1] : parts[0];
          });
          const newUrlsDe = cleanFileUrlsDe.map((fu) => {
            const parts = fu.split(":::");
            return parts.length > 1 ? parts[1] : parts[0];
          });
          for (const oldUrlDe of oldUrlsDe) {
            if (oldUrlDe && !newUrlsDe.includes(oldUrlDe) && oldUrlDe.includes(".public.blob.vercel-storage.com")) {
              deleteBlobFile(oldUrlDe);
            }
          }
        }
      }
      setLessonModal({ isOpen: false, mode: "create", courseId: "" });
    } catch (err: unknown) {
      showNotification(err instanceof Error ? err.message : "Произошла ошибка", "error");
    } finally {
      setLessonForm({
        title: "",
        titleDe: "",
        description: "",
        descriptionDe: "",
        videoUrl: "",
        videoUrlDe: "",
        videoCoverUrl: "",
        videoCoverUrlDe: "",
        fileUrls: [""],
        fileUrlsDe: [""],
        order: 1,
      });
      setActionLoading(false);
    }
  };

  const handleDeleteLesson = (courseId: string, lessonId: string) => {
    const course = localCourses.find((c) => c.id === courseId);
    const lessonToDelete = course?.lessons.find((l) => l.id === lessonId);
    setConfirmModal({
      isOpen: true,
      title: "Удаление урока",
      message: "Вы действительно хотите удалить этот урок? Восстановление будет невозможно.",
      danger: true,
      confirmText: "Удалить",
      onConfirm: async () => {
        setActionLoading(true);
        setMessage(null);

        try {
          const response = await fetch(`/api/admin/lessons/${lessonId}`, {
            method: "DELETE",
          });

          const result = await response.json();
          if (!response.ok) throw new Error(result.message || "Ошибка при удалении урока");

          // Обновляем состояние на клиенте
          setLocalCourses((prevCourses) =>
            prevCourses.map((c) => {
              if (c.id === courseId) {
                return { ...c, lessons: c.lessons.filter((l) => l.id !== lessonId) };
              }
              return c;
            })
          );

          showNotification("Урок успешно удален!", "success");

          // Фоновое удаление файлов урока из Vercel Blob
          if (lessonToDelete) {
            const urlsToDelete: string[] = [];
            if (lessonToDelete.videoCoverUrl && lessonToDelete.videoCoverUrl.includes(".public.blob.vercel-storage.com")) {
              urlsToDelete.push(lessonToDelete.videoCoverUrl);
            }
            if (lessonToDelete.videoCoverUrlDe && lessonToDelete.videoCoverUrlDe.includes(".public.blob.vercel-storage.com")) {
              urlsToDelete.push(lessonToDelete.videoCoverUrlDe);
            }
            for (const fileUrlItem of lessonToDelete.fileUrls) {
              const parts = fileUrlItem.split(":::");
              const url = parts.length > 1 ? parts[1] : parts[0];
              if (url && url.includes(".public.blob.vercel-storage.com")) {
                urlsToDelete.push(url);
              }
            }
            for (const fileUrlItem of (lessonToDelete.fileUrlsDe || [])) {
              const parts = fileUrlItem.split(":::");
              const url = parts.length > 1 ? parts[1] : parts[0];
              if (url && url.includes(".public.blob.vercel-storage.com")) {
                urlsToDelete.push(url);
              }
            }

            for (const fileUrl of urlsToDelete) {
              deleteBlobFile(fileUrl);
            }
          }
        } catch (err: unknown) {
          showNotification(err instanceof Error ? err.message : "Произошла ошибка", "error");
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  // Изменение порядка уроков кнопочками Вверх/Вниз
  const handleMoveLesson = async (courseId: string, lessonId: string, direction: "up" | "down") => {
    const course = localCourses.find((c) => c.id === courseId);
    if (!course) return;

    const lessons = [...course.lessons];
    const index = lessons.findIndex((l) => l.id === lessonId);
    if (index === -1) return;

    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= lessons.length) return;

    setActionLoading(true);

    const lessonA = lessons[index];
    const lessonB = lessons[swapIndex];

    const tempOrder = lessonA.order;
    lessonA.order = lessonB.order;
    lessonB.order = tempOrder;

    try {
      // Обновляем оба урока в БД
      await Promise.all([
        fetch(`/api/admin/lessons/${lessonA.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: lessonA.order }),
        }),
        fetch(`/api/admin/lessons/${lessonB.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: lessonB.order }),
        }),
      ]);

      // Обновляем локально и сортируем
      setLocalCourses((prevCourses) =>
        prevCourses.map((c) => {
          if (c.id === courseId) {
            const updated = c.lessons.map((l) => {
              if (l.id === lessonA.id) return { ...l, order: lessonA.order };
              if (l.id === lessonB.id) return { ...l, order: lessonB.order };
              return l;
            });
            return { ...c, lessons: updated.sort((a, b) => a.order - b.order) };
          }
          return c;
        })
      );

      showNotification("Порядок уроков изменен", "success");
    } catch (err: unknown) {
      showNotification("Не удалось обновить порядок уроков в базе данных", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // --- УПРАВЛЕНИЕ КУРСАМИ (API) ---

  const handleCreateCourseClick = () => {
    setCourseActiveTab("ru");
    setCourseModal({
      isOpen: true,
      mode: "create",
      courseId: "",
      title: "",
      titleDe: "",
      description: "",
      descriptionDe: "",
      imageUrl: "",
      imageUrlDe: "",
    });
  };

  const handleOpenCourseModal = (course: IAdminCourse) => {
    setCourseActiveTab("ru");
    setCourseModal({
      isOpen: true,
      mode: "edit",
      courseId: course.id,
      title: course.title,
      titleDe: course.titleDe || "",
      description: course.description || "",
      descriptionDe: course.descriptionDe || "",
      imageUrl: course.imageUrl || "",
      imageUrlDe: course.imageUrlDe || "",
    });
  };

  const handleCourseImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith("image/")) {
      showNotification("Пожалуйста, выберите графический файл (изображение)", "error");
      return;
    }

    setCourseImageUploading(true);
    setCourseImageUploadProgress(20);

    try {
      const formData = new FormData();
      formData.append("file", file);

      setCourseImageUploadProgress(50);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      setCourseImageUploadProgress(90);

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Ошибка при загрузке картинки");
      }

      setCourseModal((prev) => ({ ...prev, imageUrl: data.url }));
      setCourseImageUploadProgress(100);
    } catch (err: unknown) {
      showNotification(err instanceof Error ? err.message : "Не удалось загрузить изображение", "error");
    } finally {
      setCourseImageUploading(false);
      setTimeout(() => setCourseImageUploadProgress(0), 1000);
    }
  };

  const handleCourseImageDeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith("image/")) {
      showNotification("Пожалуйста, выберите графический файл (изображение)", "error");
      return;
    }

    setCourseImageDeUploading(true);
    setCourseImageDeUploadProgress(20);

    try {
      const formData = new FormData();
      formData.append("file", file);

      setCourseImageDeUploadProgress(50);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      setCourseImageDeUploadProgress(90);

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Ошибка при загрузке картинки");
      }

      setCourseModal((prev) => ({ ...prev, imageUrlDe: data.url }));
      setCourseImageDeUploadProgress(100);
    } catch (err: unknown) {
      showNotification(err instanceof Error ? err.message : "Не удалось загрузить изображение", "error");
    } finally {
      setCourseImageDeUploading(false);
      setTimeout(() => setCourseImageDeUploadProgress(0), 1000);
    }
  };

  const handleLessonCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith("image/")) {
      showNotification("Пожалуйста, выберите графический файл (изображение)", "error");
      return;
    }

    setLessonCoverUploading(true);
    setLessonCoverUploadProgress(20);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("uploadType", "lesson-cover");

      setLessonCoverUploadProgress(50);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      setLessonCoverUploadProgress(90);

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Ошибка при загрузке картинки");
      }

      setLessonForm((prev) => ({ ...prev, videoCoverUrl: data.url }));
      setLessonCoverUploadProgress(100);
    } catch (err: unknown) {
      showNotification(err instanceof Error ? err.message : "Не удалось загрузить изображение", "error");
    } finally {
      setLessonCoverUploading(false);
      setTimeout(() => setLessonCoverUploadProgress(0), 1000);
    }
  };

  const handleLessonCoverDeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith("image/")) {
      showNotification("Пожалуйста, выберите графический файл (изображение)", "error");
      return;
    }

    setLessonCoverDeUploading(true);
    setLessonCoverDeUploadProgress(20);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("uploadType", "lesson-cover");

      setLessonCoverDeUploadProgress(50);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      setLessonCoverDeUploadProgress(90);

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Ошибка при загрузке картинки");
      }

      setLessonForm((prev) => ({ ...prev, videoCoverUrlDe: data.url }));
      setLessonCoverDeUploadProgress(100);
    } catch (err: unknown) {
      showNotification(err instanceof Error ? err.message : "Не удалось загрузить изображение", "error");
    } finally {
      setLessonCoverDeUploading(false);
      setTimeout(() => setLessonCoverDeUploadProgress(0), 1000);
    }
  };

  const handleLessonFileUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Проверка размера файла перед отправкой (макс. 4.5 МБ для Vercel Serverless Function payload limit)
    const MAX_SIZE = 4.5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      showNotification("Размер файла превышает 4.5 МБ. Для больших файлов рекомендуется использовать внешние ссылки или сжать его перед загрузкой.", "error");
      e.target.value = "";
      return;
    }

    // Проверка на потенциально опасные расширения
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const dangerousExtensions = ["exe", "bat", "cmd", "sh", "js", "ts", "html", "htm", "lnk", "vbs", "com", "scr"];
    if (dangerousExtensions.includes(fileExtension || "")) {
      showNotification("Загрузка исполняемых файлов и веб-страниц запрещена в целях безопасности.", "error");
      e.target.value = "";
      return;
    }

    setLessonFileUploading((prev) => ({ ...prev, [index]: true }));
    setLessonFileProgress((prev) => ({ ...prev, [index]: 20 }));

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("uploadType", "document");

      setLessonFileProgress((prev) => ({ ...prev, [index]: 50 }));

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      setLessonFileProgress((prev) => ({ ...prev, [index]: 90 }));

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Ошибка при загрузке файла");
      }

      // Обновляем URL в форме урока
      handleFileUrlChange(index, data.url);
      setLessonFileProgress((prev) => ({ ...prev, [index]: 100 }));
    } catch (err: unknown) {
      showNotification(err instanceof Error ? err.message : "Не удалось загрузить файл", "error");
    } finally {
      setLessonFileUploading((prev) => ({ ...prev, [index]: false }));
      setTimeout(() => {
        setLessonFileProgress((prev) => {
          const updated = { ...prev };
          delete updated[index];
          return updated;
        });
      }, 1000);
      e.target.value = "";
    }
  };

  const handleLessonFileDeUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Проверка размера файла перед отправкой (макс. 4.5 МБ для Vercel Serverless Function payload limit)
    const MAX_SIZE = 4.5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      showNotification("Размер файла превышает 4.5 МБ. Для больших файлов рекомендуется использовать внешние ссылки или сжать его перед загрузкой.", "error");
      e.target.value = "";
      return;
    }

    // Проверка на потенциально опасные расширения
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const dangerousExtensions = ["exe", "bat", "cmd", "sh", "js", "ts", "html", "htm", "lnk", "vbs", "com", "scr"];
    if (dangerousExtensions.includes(fileExtension || "")) {
      showNotification("Загрузка исполняемых файлов и веб-страниц запрещена в целях безопасности.", "error");
      e.target.value = "";
      return;
    }

    setLessonFileDeUploading((prev) => ({ ...prev, [index]: true }));
    setLessonFileDeProgress((prev) => ({ ...prev, [index]: 20 }));

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("uploadType", "document");

      setLessonFileDeProgress((prev) => ({ ...prev, [index]: 50 }));

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      setLessonFileDeProgress((prev) => ({ ...prev, [index]: 90 }));

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Ошибка при загрузке файла");
      }

      // Обновляем URL в форме урока
      handleFileUrlDeChange(index, data.url);
      setLessonFileDeProgress((prev) => ({ ...prev, [index]: 100 }));
    } catch (err: unknown) {
      showNotification(err instanceof Error ? err.message : "Не удалось загрузить файл", "error");
    } finally {
      setLessonFileDeUploading((prev) => ({ ...prev, [index]: false }));
      setTimeout(() => {
        setLessonFileDeProgress((prev) => {
          const updated = { ...prev };
          delete updated[index];
          return updated;
        });
      }, 1000);
      e.target.value = "";
    }
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setMessage(null);

    try {
      const isCreate = courseModal.mode === "create";
      const url = isCreate
        ? "/api/admin/courses"
        : `/api/admin/courses/${courseModal.courseId}`;
      const method = isCreate ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: courseModal.title,
          titleDe: courseModal.titleDe || null,
          description: courseModal.description,
          descriptionDe: courseModal.descriptionDe || null,
          imageUrl: courseModal.imageUrl || null,
          imageUrlDe: courseModal.imageUrlDe || null,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Ошибка при сохранении курса");

      // Обновляем локальное состояние курсов
      if (isCreate) {
        setLocalCourses((prevCourses) => [...prevCourses, result.course]);
        showNotification("Курс успешно создан!", "success");
      } else {
        const oldCourse = localCourses.find((c) => c.id === courseModal.courseId);
        const oldImg = oldCourse?.imageUrl;
        if (oldImg && oldImg !== courseModal.imageUrl && oldImg.includes(".public.blob.vercel-storage.com")) {
          await deleteBlobFile(oldImg);
        }
        const oldImgDe = oldCourse?.imageUrlDe;
        if (oldImgDe && oldImgDe !== courseModal.imageUrlDe && oldImgDe.includes(".public.blob.vercel-storage.com")) {
          await deleteBlobFile(oldImgDe);
        }

        setLocalCourses((prevCourses) =>
          prevCourses.map((c) => {
            if (c.id === courseModal.courseId) {
              return {
                ...c,
                title: result.course.title,
                titleDe: result.course.titleDe,
                description: result.course.description,
                descriptionDe: result.course.descriptionDe,
                imageUrl: result.course.imageUrl,
                imageUrlDe: result.course.imageUrlDe,
              };
            }
            return c;
          })
        );
        showNotification("Параметры курса успешно сохранены!", "success");
      }

      setCourseModal({ isOpen: false, mode: "create", courseId: "", title: "", titleDe: "", description: "", descriptionDe: "", imageUrl: "", imageUrlDe: "" });
    } catch (err: unknown) {
      showNotification(err instanceof Error ? err.message : "Произошла ошибка", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCourse = (courseId: string, title: string) => {
    const courseToDelete = localCourses.find((c) => c.id === courseId);
    setConfirmModal({
      isOpen: true,
      title: "Удаление курса",
      message: `Вы действительно хотите безвозвратно удалить курс «${title}»?\nВсе уроки этого курса будут удалены автоматически!`,
      danger: true,
      confirmText: "Удалить курс",
      onConfirm: async () => {
        setActionLoading(true);
        setMessage(null);

        try {
          const response = await fetch(`/api/admin/courses/${courseId}`, {
            method: "DELETE",
          });

          const result = await response.json();
          if (!response.ok) throw new Error(result.message || "Ошибка при удалении курса");

          // Обновляем локальное состояние курсов
          setLocalCourses((prevCourses) => prevCourses.filter((c) => c.id !== courseId));
          showNotification("Курс успешно удален!", "success");

          // Каскадное фоновое удаление файлов курса из Vercel Blob
          if (courseToDelete) {
            const urlsToDelete: string[] = [];

            if (courseToDelete.imageUrl && courseToDelete.imageUrl.includes(".public.blob.vercel-storage.com")) {
              urlsToDelete.push(courseToDelete.imageUrl);
            }

            for (const lesson of courseToDelete.lessons) {
              if (lesson.videoCoverUrl && lesson.videoCoverUrl.includes(".public.blob.vercel-storage.com")) {
                urlsToDelete.push(lesson.videoCoverUrl);
              }
              for (const fileUrlItem of lesson.fileUrls) {
                const parts = fileUrlItem.split(":::");
                const url = parts.length > 1 ? parts[1] : parts[0];
                if (url && url.includes(".public.blob.vercel-storage.com")) {
                  urlsToDelete.push(url);
                }
              }
            }

            for (const fileUrl of urlsToDelete) {
              deleteBlobFile(fileUrl);
            }
          }
        } catch (err: unknown) {
          showNotification(err instanceof Error ? err.message : "Не удалось удалить курс", "error");
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  // --- УПРАВЛЕНИЕ УЧЕНИКАМИ (API) ---

  const handleOpenUserAddModal = () => {
    setUserModal({
      isOpen: true,
      mode: "create",
      userId: "",
      name: "",
      email: "",
      phone: "",
      role: "USER",
      additionalInfo: "",
    });
  };

  const handleOpenUserEditModal = (user: IAdminUser) => {
    setUserModal({
      isOpen: true,
      mode: "edit",
      userId: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role || "USER",
      additionalInfo: user.additionalInfo || "",
    });
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setMessage(null);

    try {
      if (userModal.mode === "create") {
        const response = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: userModal.name,
            email: userModal.email,
            phone: userModal.phone,
            additionalInfo: userModal.additionalInfo || null,
          }),
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Ошибка при создании ученика");

        // Обновляем локальное состояние пользователей
        setUsers((prevUsers) => [result.user, ...prevUsers]);

        // Показываем алерт с временным паролем
        // Показываем красивый диалог с паролем и возможностью скопировать его в 1 клик
        setConfirmModal({
          isOpen: true,
          title: "🎉 Ученик успешно добавлен!",
          message: `🔑 Временный пароль для входа: ${result.defaultPassword}\n\nПожалуйста, передайте этот пароль ученику.`,
          confirmText: "📋 Скопировать пароль",
          cancelText: "Закрыть",
          danger: false,
          onConfirm: () => {
            if (navigator.clipboard) {
              navigator.clipboard.writeText(result.defaultPassword);
              showNotification("Пароль успешно скопирован в буфер обмена!", "success");
            } else {
              showNotification(`Пароль ученика: ${result.defaultPassword}`, "success");
            }
          }
        });

        showNotification("Ученик успешно создан", "success");
      } else {
        // Режим редактирования (PUT)
        const response = await fetch(`/api/admin/users/${userModal.userId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: userModal.name,
            email: userModal.email,
            phone: userModal.phone,
            role: userModal.role,
            additionalInfo: userModal.additionalInfo || null,
          }),
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Ошибка при сохранении данных ученика");

        // Обновляем локальное состояние пользователей
        setUsers((prevUsers) =>
          prevUsers.map((u) => (u.id === userModal.userId ? { ...u, ...result.user } : u))
        );

        showNotification("Данные ученика обновлены", "success");
      }

      setUserModal({ isOpen: false, mode: "create", userId: "", name: "", email: "", phone: "", role: "USER", additionalInfo: "" });
    } catch (err: unknown) {
      showNotification(err instanceof Error ? err.message : "Произошла ошибка", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Удаление ученика",
      message: "Вы действительно хотите удалить этого ученика? Все его доступы и заказы будут безвозвратно удалены.",
      danger: true,
      confirmText: "Удалить",
      onConfirm: async () => {
        setActionLoading(true);
        setMessage(null);

        try {
          const response = await fetch(`/api/admin/users/${id}`, {
            method: "DELETE",
          });

          const result = await response.json();
          if (!response.ok) throw new Error(result.message || "Ошибка при удалении ученика");

          // Обновляем состояние на клиенте
          setUsers((prevUsers) => prevUsers.filter((u) => u.id !== id));

          showNotification("Ученик успешно удален из базы данных", "success");
        } catch (err: unknown) {
          showNotification(err instanceof Error ? err.message : "Произошла ошибка", "error");
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  // --- ФИЛЬТРАЦИЯ ДАННЫХ УЧЕНИКОВ ---
  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.phone.toLowerCase().includes(query)
    );
  });

  // Фильтрация курсов для быстрого выбора в модалке доступов Ольги
  const filteredCoursesForGrant = localCourses.filter((c) =>
    c.title.toLowerCase().includes(searchCourseQuery.toLowerCase())
  );

  return (
    <div style={{ padding: "10px 0" }}>
      {/* Навигационные табы в стиле Gold/Burgundy */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "25px",
          borderBottom: "2px solid #eae0db",
          paddingBottom: "10px",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => setActiveTab("users")}
          style={{
            padding: "10px 20px",
            fontSize: "15px",
            fontWeight: 700,
            cursor: "pointer",
            border: "none",
            borderRadius: "6px",
            backgroundColor: activeTab === "users" ? "var(--color-primary)" : "transparent",
            color: activeTab === "users" ? "#fff" : "var(--color-dark)",
            transition: "all 0.3s ease",
          }}
        >
          👤 Ученики
        </button>
        <button
          onClick={() => setActiveTab("courses")}
          style={{
            padding: "10px 20px",
            fontSize: "15px",
            fontWeight: 700,
            cursor: "pointer",
            border: "none",
            borderRadius: "6px",
            backgroundColor: activeTab === "courses" ? "var(--color-primary)" : "transparent",
            color: activeTab === "courses" ? "#fff" : "var(--color-dark)",
            transition: "all 0.3s ease",
          }}
        >
          📚 Курсы
        </button>
        <button
          onClick={() => setActiveTab("products")}
          style={{
            padding: "10px 20px",
            fontSize: "15px",
            fontWeight: 700,
            cursor: "pointer",
            border: "none",
            borderRadius: "6px",
            backgroundColor: activeTab === "products" ? "var(--color-primary)" : "transparent",
            color: activeTab === "products" ? "#fff" : "var(--color-dark)",
            transition: "all 0.3s ease",
          }}
        >
          🛒 Товары
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          style={{
            padding: "10px 20px",
            fontSize: "15px",
            fontWeight: 700,
            cursor: "pointer",
            border: "none",
            borderRadius: "6px",
            backgroundColor: activeTab === "orders" ? "var(--color-primary)" : "transparent",
            color: activeTab === "orders" ? "#fff" : "var(--color-dark)",
            transition: "all 0.3s ease",
          }}
        >
          📦 Заказы
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          style={{
            padding: "10px 20px",
            fontSize: "15px",
            fontWeight: 700,
            cursor: "pointer",
            border: "none",
            borderRadius: "6px",
            backgroundColor: activeTab === "settings" ? "var(--color-primary)" : "transparent",
            color: activeTab === "settings" ? "#fff" : "var(--color-dark)",
            transition: "all 0.3s ease",
          }}
        >
          ⚙️ Настройки
        </button>
      </div>

      {/* Оповещения */}
      {message && (
        <div
          style={{
            color: message.type === "success" ? "#1e4620" : "#5c0e12",
            backgroundColor: message.type === "success" ? "#edf7ed" : "#fdf2f2",
            padding: "14px 20px",
            borderRadius: "var(--radius-md)",
            marginBottom: "20px",
            textAlign: "left",
            fontSize: "14px",
            fontWeight: 600,
            border: `1px solid ${message.type === "success" ? "#c3e6cb" : "#f5c6cb"}`,
            boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
          }}
        >
          {message.type === "success" ? "✅ " : "⚠️ "} {message.text}
        </div>
      )}

      {/* --- ТАБ 1: УЧЕНИКИ И ДОСТУПЫ --- */}
      {activeTab === "users" && (
        <div>
          {/* Поиск */}
          <div
            style={{
              backgroundColor: "var(--color-light)",
              padding: "20px",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--color-gray-border)",
              marginBottom: "25px",
              boxShadow: "var(--shadow-premium)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              gap: "20px",
              flexWrap: "wrap",
            }}
          >
            <div className={styles.formGroup} style={{ margin: 0, flexGrow: 1, minWidth: "280px" }}>
              <label htmlFor="admin-search" style={{ fontSize: "14px", fontWeight: 600, marginBottom: "8px", display: "block" }}>
                Быстрый поиск ученика (введите Имя, Email или Телефон)
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  id="admin-search"
                  className={styles.input}
                  placeholder="Поиск по базе клиентов..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: "42px", height: "45px" }}
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="#888"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                  style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }}
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </div>
            </div>

            <button
              onClick={handleOpenUserAddModal}
              className="btn btn-primary"
              style={{
                height: "45px",
                padding: "0 24px",
                fontSize: "14px",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: "#2e7d32",
                borderColor: "#2e7d32",
              }}
            >
              ➕ Добавить ученика
            </button>
          </div>

          {/* Таблица */}
          <div
            style={{
              backgroundColor: "var(--color-light)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--color-gray-border)",
              boxShadow: "var(--shadow-premium)",
              overflowX: "auto",
            }}
          >
            {filteredUsers.length === 0 ? (
              <div style={{ padding: "50px 20px", textAlign: "center", color: "var(--color-gray)", fontSize: "15px" }}>
                Ученики не найдены по вашему запросу.
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#fbf7f5", borderBottom: "1px solid var(--color-gray-border)" }}>
                    <th style={{ padding: "16px 24px", fontWeight: 700, color: "var(--color-dark)" }}>Ученик</th>
                    <th style={{ padding: "16px 24px", fontWeight: 700, color: "var(--color-dark)" }}>Контакты</th>
                    <th style={{ padding: "16px 24px", fontWeight: 700, color: "var(--color-dark)" }}>Активные доступы</th>
                    <th style={{ padding: "16px 24px", fontWeight: 700, color: "var(--color-dark)", textAlign: "center" }}>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => {
                    const activeAccessesCount = user.accesses.filter((a) => {
                      if (!a.expiresAt) return true;
                      return new Date(a.expiresAt) > new Date();
                    }).length;

                    return (
                      <tr
                        key={user.id}
                        style={{ borderBottom: "1px solid #fbf7f5", transition: "background-color 0.2s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#fcf9f7")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      >
                        <td style={{ padding: "20px 24px" }}>
                          <div style={{ fontWeight: 700, color: "var(--color-dark)" }}>{user.name}</div>
                          {user.role === "ADMIN" && (
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: 700,
                                padding: "2px 6px",
                                borderRadius: "4px",
                                backgroundColor: "#ffebee",
                                color: "var(--color-primary)",
                                display: "inline-block",
                                marginTop: "4px",
                              }}
                            >
                              Администратор
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "20px 24px" }}>
                          <div style={{ fontWeight: 500 }}>{user.email}</div>
                          <div style={{ fontSize: "12px", color: "var(--color-gray)", marginTop: "4px" }}>
                            {user.phone}
                          </div>
                          {user.additionalInfo && (
                            <div style={{ fontSize: "11px", color: "#b45309", backgroundColor: "#fffbeb", padding: "4px 8px", borderRadius: "4px", marginTop: "6px", display: "inline-block", border: "1px solid #fef3c7" }}>
                              📝 {user.additionalInfo}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: "20px 24px" }}>
                          {user.role === "ADMIN" ? (
                            <span style={{ fontStyle: "italic", color: "var(--color-gray)" }}>Полный доступ (Админ)</span>
                          ) : (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                              {user.accesses.length === 0 ? (
                                <span style={{ color: "#888", fontSize: "13px" }}>Нет доступов</span>
                              ) : (
                                user.accesses.map((acc) => {
                                  const course = localCourses.find((c) => c.id === acc.courseId);
                                  const isExpired = acc.expiresAt && new Date(acc.expiresAt) < new Date();
                                  if (!course) return null;
                                  return (
                                    <span
                                      key={acc.courseId}
                                      style={{
                                        fontSize: "11px",
                                        fontWeight: 600,
                                        padding: "3px 8px",
                                        borderRadius: "12px",
                                        backgroundColor: isExpired ? "#f5f5f5" : "#fdf6f2",
                                        color: isExpired ? "#888" : "var(--color-primary)",
                                        border: `1px solid ${isExpired ? "#e0e0e0" : "#f5dcd3"}`,
                                        textDecoration: isExpired ? "line-through" : "none",
                                      }}
                                      title={
                                        acc.expiresAt
                                          ? `Доступ до: ${new Date(acc.expiresAt).toLocaleDateString("ru-RU")}`
                                          : "Доступ бессрочный"
                                      }
                                    >
                                      {course.title}
                                      {acc.expiresAt && !isExpired && ` (До ${new Date(acc.expiresAt).toLocaleDateString("ru-RU")})`}
                                      {isExpired && " (Истек)"}
                                    </span>
                                  );
                                })
                              )}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: "20px 24px", textAlign: "center" }}>
                          <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                            <button
                              onClick={() => {
                                setSelectedCourseId("");
                                setSearchCourseQuery("");
                                setIsCourseDropdownOpen(false);
                                setAccessModalUser(user);
                              }}
                              disabled={user.role === "ADMIN"}
                              className="btn btn-secondary"
                              style={{
                                padding: "6px 12px",
                                fontSize: "12px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                borderColor: user.role === "ADMIN" ? "#ccc" : "var(--color-primary)",
                                color: user.role === "ADMIN" ? "#999" : "var(--color-primary)",
                                cursor: user.role === "ADMIN" ? "not-allowed" : "pointer",
                              }}
                              title="Управление доступами к курсам"
                            >
                              🔑 Доступы
                            </button>

                            <button
                              onClick={() => handleOpenUserEditModal(user)}
                              className="btn btn-secondary"
                              style={{
                                padding: "6px 12px",
                                fontSize: "12px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                borderColor: "var(--color-primary)",
                                color: "var(--color-primary)",
                              }}
                              title="Редактировать личные данные ученика"
                            >
                              ✏️ Ред.
                            </button>

                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              disabled={user.role === "ADMIN"}
                              className="btn btn-primary"
                              style={{
                                padding: "6px 12px",
                                fontSize: "12px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                backgroundColor: user.role === "ADMIN" ? "#ccc" : "#c62828",
                                borderColor: user.role === "ADMIN" ? "#ccc" : "#c62828",
                                cursor: user.role === "ADMIN" ? "not-allowed" : "pointer",
                              }}
                              title="Удалить ученика"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* --- ТАБ 2: КУРСЫ И УРОКИ --- */}
      {activeTab === "courses" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-dark)", margin: 0 }}>
              Список обучающих курсов ({localCourses.length})
            </h2>
            <button
              onClick={handleCreateCourseClick}
              className="btn btn-primary"
              style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 20px" }}
            >
              Добавить курс
            </button>
          </div>
          {localCourses.map((course) => {
            const isExpanded = !!expandedCourses[course.id];
            return (
              <div
                key={course.id}
                style={{
                  backgroundColor: "var(--color-light)",
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--color-gray-border)",
                  boxShadow: "var(--shadow-premium)",
                  overflow: "hidden",
                }}
              >
                {/* Заголовок курса (кликабельный для открытия) */}
                <div
                  onClick={() => toggleCourseExpand(course.id)}
                  className={`${styles.courseHeader} ${isExpanded ? styles.courseHeaderExpanded : ""}`}
                >
                  <div className={styles.courseHeaderLeft}>
                    <div
                      className={styles.courseStatusDot}
                      style={{
                        backgroundColor: course.isPublished ? "#2e7d32" : "#c62828",
                      }}
                      title={course.isPublished ? "Опубликован" : "Черновик"}
                    />
                    <h3 className={styles.courseTitleText}>
                      {course.title}
                    </h3>
                    <span className={styles.lessonsBadge}>
                      Уроков: {course.lessons.length}
                    </span>
                  </div>

                  <div className={styles.courseHeaderActions} onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleOpenCourseModal(course)}
                      className="btn btn-secondary"
                      style={{ padding: "6px 12px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                    >
                      ✏️ Редактировать
                    </button>
                    <button
                      onClick={() => handleOpenLessonModal("create", course.id)}
                      className="btn btn-primary"
                      style={{ padding: "6px 12px", fontSize: "12px", backgroundColor: "#2e7d32", borderColor: "#2e7d32" }}
                    >
                      ➕ Добавить урок
                    </button>
                    <button
                      onClick={() => handleDeleteCourse(course.id, course.title)}
                      className="btn btn-secondary"
                      style={{
                        padding: "6px 12px",
                        fontSize: "12px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        color: "#c62828",
                        borderColor: "#c62828",
                        backgroundColor: "#fff"
                      }}
                    >
                      🗑️ Удалить
                    </button>
                    <span
                      className={styles.arrowIcon}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCourseExpand(course.id);
                      }}
                    >
                      {isExpanded ? "▲" : "▼"}
                    </span>
                  </div>
                </div>

                {/* Список уроков */}
                {isExpanded && (
                  <div style={{ borderTop: "1px solid var(--color-gray-border)", padding: "10px 24px 24px 24px" }}>
                    {course.lessons.length === 0 ? (
                      <div style={{ padding: "30px", textAlign: "center", color: "#888", fontStyle: "italic" }}>
                        В этом курсе пока нет уроков. Нажмите «Добавить урок» выше.
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "15px" }}>
                        {course.lessons.map((lesson, idx) => (
                          <div
                            key={lesson.id}
                            className={styles.lessonRow}
                          >
                            <div className={styles.lessonInfo}>
                              {/* Порядковый номер */}
                              <span
                                style={{
                                  fontSize: "12px",
                                  fontWeight: 700,
                                  color: "var(--color-primary)",
                                  backgroundColor: "#fbeee8",
                                  width: "24px",
                                  height: "24px",
                                  borderRadius: "50%",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                {lesson.order}
                              </span>

                              <div className={styles.lessonMetaInfo}>
                                <div className={styles.lessonMetaInfoTitle}>
                                  {lesson.title}
                                </div>
                                <div
                                  style={{
                                    fontSize: "12px",
                                    color: "var(--color-gray)",
                                    marginTop: "2px",
                                    maxWidth: "500px",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  {lesson.fileUrls && lesson.fileUrls.length > 0
                                    ? `📁 Файлов: ${lesson.fileUrls.length}`
                                    : "📁 Без файлов"}
                                </div>
                                {lesson.videoUrl ? (
                                  <div style={{ fontSize: "11px", color: "#2e7d32", marginTop: "4px", fontWeight: 600 }}>
                                    🎥 Видео прикреплено
                                  </div>
                                ) : (
                                  <div style={{ fontSize: "11px", color: "#757575", marginTop: "4px", fontWeight: 600 }}>
                                    📹 Без видео
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Управление уроком */}
                            <div className={styles.lessonActions}>
                              {/* Кнопочки изменения порядка */}
                              <button
                                onClick={() => handleMoveLesson(course.id, lesson.id, "up")}
                                disabled={idx === 0}
                                style={{
                                  border: "1px solid #ddd",
                                  backgroundColor: "#fff",
                                  borderRadius: "4px",
                                  width: "28px",
                                  height: "28px",
                                  cursor: idx === 0 ? "not-allowed" : "pointer",
                                  opacity: idx === 0 ? 0.3 : 1,
                                }}
                                title="Переместить вверх"
                              >
                                ▲
                              </button>
                              <button
                                onClick={() => handleMoveLesson(course.id, lesson.id, "down")}
                                disabled={idx === course.lessons.length - 1}
                                style={{
                                  border: "1px solid #ddd",
                                  backgroundColor: "#fff",
                                  borderRadius: "4px",
                                  width: "28px",
                                  height: "28px",
                                  cursor: idx === course.lessons.length - 1 ? "not-allowed" : "pointer",
                                  opacity: idx === course.lessons.length - 1 ? 0.3 : 1,
                                }}
                                title="Переместить вниз"
                              >
                                ▼
                              </button>

                              {/* Редактировать / Удалить */}
                              <button
                                onClick={() => handleOpenLessonModal("edit", course.id, lesson)}
                                className="btn btn-secondary"
                                style={{ padding: "6px 12px", fontSize: "12px", marginLeft: "10px" }}
                              >
                                ✏️ Редактировать
                              </button>
                              <button
                                onClick={() => handleDeleteLesson(course.id, lesson.id)}
                                className="btn btn-primary"
                                style={{
                                  padding: "6px 12px",
                                  fontSize: "12px",
                                  backgroundColor: "#c62828",
                                  borderColor: "#c62828",
                                }}
                              >
                                🗑️ Удалить
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* --- ТАБ 3: ТОВАРЫ МАГАЗИНА --- */}
      {activeTab === "products" && (
        <AdminProducts initialProducts={initialProducts} courses={localCourses} showNotification={showNotification} />
      )}

      {/* --- ТАБ 3.5: УПРАВЛЕНИЕ ЗАКАЗАМИ --- */}
      {activeTab === "orders" && (
        <AdminOrders showNotification={showNotification} />
      )}

      {/* --- ТАБ 4: НАСТРОЙКИ --- */}
      {activeTab === "settings" && (
        <AdminSettings showNotification={showNotification} />
      )}

      {/* --- МОДАЛЬНОЕ ОКНО: УПРАВЛЕНИЕ ДОСТУПАМИ УЧЕНИКА --- */}
      {accessModalUser && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "var(--radius-lg)",
              width: "100%",
              maxWidth: "650px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
              border: "1px solid var(--color-gray-border)",
            }}
          >
            {/* Хедер модалки */}
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid var(--color-gray-border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "#fbf7f5",
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "var(--color-dark)" }}>
                  🔑 Управление доступами
                </h3>
                <span style={{ fontSize: "13px", color: "var(--color-gray)" }}>
                  для ученика: <strong>{accessModalUser.name}</strong> ({accessModalUser.email})
                </span>
              </div>
              <button
                onClick={() => {
                  setAccessModalUser(null);
                  setSelectedCourseId("");
                  setSearchCourseQuery("");
                  setIsCourseDropdownOpen(false);
                }}
                style={{
                  border: "none",
                  background: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#888",
                }}
              >
                &times;
              </button>
            </div>

            <div style={{ padding: "24px" }}>
              {/* Текущие доступы */}
              <div style={{ marginBottom: "25px" }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: "15px", fontWeight: 700 }}>Текущие доступы:</h4>
                {accessModalUser.accesses.length === 0 ? (
                  <p style={{ color: "#888", fontStyle: "italic", fontSize: "13px", margin: 0 }}>
                    Доступы к курсам отсутствуют.
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {accessModalUser.accesses.map((acc) => {
                      const course = localCourses.find((c) => c.id === acc.courseId);
                      const isExpired = acc.expiresAt && new Date(acc.expiresAt) < new Date();
                      if (!course) return null;

                      return (
                        <div
                          key={acc.courseId}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "10px 14px",
                            backgroundColor: isExpired ? "#fcfcfc" : "#faf6f4",
                            border: `1px solid ${isExpired ? "#eee" : "#f2e6e1"}`,
                            borderRadius: "6px",
                          }}
                        >
                          <div>
                            <span style={{ fontWeight: 700, fontSize: "14px", color: isExpired ? "#888" : "var(--color-dark)" }}>
                              {course.title}
                            </span>
                            <div style={{ fontSize: "11px", color: "var(--color-gray)", marginTop: "2px" }}>
                              Выдан: {new Date(acc.grantedAt).toLocaleDateString("ru-RU")}
                              {acc.expiresAt && (
                                <span style={{ marginLeft: "10px", color: isExpired ? "#c62828" : "var(--color-primary)", fontWeight: 600 }}>
                                  Действует до: {new Date(acc.expiresAt).toLocaleDateString("ru-RU")} {isExpired && "(Истек)"}
                                </span>
                              )}
                              {!acc.expiresAt && (
                                <span style={{ marginLeft: "10px", color: "#2e7d32", fontWeight: 600 }}>
                                  Бессрочно
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => handleRevokeAccess(acc.courseId)}
                            style={{
                              border: "none",
                              background: "none",
                              color: "#c62828",
                              fontSize: "12px",
                              fontWeight: 700,
                              cursor: "pointer",
                              padding: "4px 8px",
                            }}
                          >
                            🗑️ Отозвать
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <hr style={{ border: "none", borderTop: "1px solid var(--color-gray-border)", margin: "25px 0" }} />

              {/* Форма выдачи нового доступа */}
              <form onSubmit={handleGrantAccess}>
                <h4 style={{ margin: "0 0 15px 0", fontSize: "15px", fontWeight: 700 }}>Предоставить новый доступ:</h4>

                {/* Кастомный выпадающий список курсов (Dropdown с живым поиском) */}
                <div style={{ marginBottom: "15px", position: "relative" }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>
                    Выберите курс (из {localCourses.length} доступных):
                  </label>

                  {/* Кнопка-триггер кастомного селектора */}
                  <div
                    onClick={() => setIsCourseDropdownOpen(!isCourseDropdownOpen)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      fontSize: "14px",
                      borderRadius: "6px",
                      border: "1px solid var(--color-gray-border)",
                      backgroundColor: "#fff",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      userSelect: "none",
                      transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                      borderColor: isCourseDropdownOpen ? "var(--color-primary)" : "var(--color-gray-border)",
                      boxShadow: isCourseDropdownOpen ? "0 0 0 3px rgba(197, 23, 34, 0.1)" : "none",
                    }}
                  >
                    <span style={{ color: selectedCourseId ? "var(--color-dark)" : "#888", fontWeight: selectedCourseId ? 600 : 400 }}>
                      {selectedCourseId
                        ? localCourses.find(c => c.id === selectedCourseId)?.title
                        : "-- Выберите курс --"}
                    </span>
                    <span style={{
                      fontSize: "12px",
                      transition: "transform 0.2s ease",
                      transform: isCourseDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                      color: "var(--color-primary)"
                    }}>
                      ▼
                    </span>
                  </div>

                  {/* Скрытый селектор для валидации формы HTML5 (required) */}
                  <select
                    required
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    style={{
                      position: "absolute",
                      width: "0px",
                      height: "0px",
                      opacity: 0,
                      pointerEvents: "none",
                    }}
                  >
                    <option value="">-- Выберите курс --</option>
                    {localCourses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>

                  {/* Кастомное выпадающее меню */}
                  {isCourseDropdownOpen && (
                    <>
                      {/* Прозрачная подложка для закрытия по клику вне меню */}
                      <div
                        onClick={() => {
                          setIsCourseDropdownOpen(false);
                          setSearchCourseQuery("");
                        }}
                        style={{
                          position: "fixed",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          zIndex: 998,
                          background: "none",
                        }}
                      />

                      <div style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        marginTop: "6px",
                        backgroundColor: "#fff",
                        border: "1px solid rgba(197, 23, 34, 0.15)",
                        borderRadius: "8px",
                        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
                        zIndex: 999,
                        overflow: "hidden",
                        animation: "fadeInUp 0.15s ease-out",
                      }}>
                        {/* Поле живого поиска внутри меню */}
                        <div style={{ padding: "8px", borderBottom: "1px solid #f2e6e1", backgroundColor: "#faf6f4" }}>
                          <input
                            type="text"
                            placeholder="🔍 Быстрый поиск курса..."
                            value={searchCourseQuery}
                            onChange={(e) => setSearchCourseQuery(e.target.value)}
                            onClick={(e) => e.stopPropagation()} // предотвращаем закрытие
                            autoFocus
                            style={{
                              width: "100%",
                              padding: "8px 10px",
                              fontSize: "13px",
                              borderRadius: "4px",
                              border: "1px solid var(--color-gray-border)",
                              outline: "none",
                              backgroundColor: "#fff",
                            }}
                          />
                        </div>

                        {/* Список курсов */}
                        <div style={{
                          maxHeight: "220px",
                          overflowY: "auto",
                          padding: "4px 0"
                        }}>
                          {filteredCoursesForGrant.length === 0 ? (
                            <div style={{ padding: "12px", fontSize: "12px", color: "#888", textAlign: "center" }}>
                              Курсы не найдены
                            </div>
                          ) : (
                            filteredCoursesForGrant.map((c) => {
                              const isSelected = c.id === selectedCourseId;
                              return (
                                <div
                                  key={c.id}
                                  onClick={() => {
                                    setSelectedCourseId(c.id);
                                    setIsCourseDropdownOpen(false);
                                    setSearchCourseQuery("");
                                  }}
                                  style={{
                                    padding: "10px 14px",
                                    fontSize: "13px",
                                    cursor: "pointer",
                                    transition: "background-color 0.15s ease",
                                    backgroundColor: isSelected ? "var(--color-primary-light)" : "transparent",
                                    color: isSelected ? "var(--color-primary)" : "var(--color-dark)",
                                    fontWeight: isSelected ? 600 : 400,
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center"
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!isSelected) {
                                      e.currentTarget.style.backgroundColor = "#faf0ec";
                                      e.currentTarget.style.color = "var(--color-primary)";
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!isSelected) {
                                      e.currentTarget.style.backgroundColor = "transparent";
                                      e.currentTarget.style.color = "var(--color-dark)";
                                    }
                                  }}
                                >
                                  <span style={{ paddingRight: "10px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                    {c.title}
                                  </span>
                                  <span style={{
                                    fontSize: "11px",
                                    color: isSelected ? "var(--color-primary)" : "#9a7c56",
                                    backgroundColor: isSelected ? "rgba(197, 23, 34, 0.1)" : "#fbf7f4",
                                    padding: "2px 6px",
                                    borderRadius: "4px",
                                    fontWeight: 600,
                                    flexShrink: 0
                                  }}>
                                    🔑 {c.lessons.length} ур.
                                  </span>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Срок действия доступов */}
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "8px" }}>
                    Срок действия доступа:
                  </label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "12px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "13px" }}>
                      <input
                        type="radio"
                        name="duration"
                        checked={accessDuration === "lifetime"}
                        onChange={() => setAccessDuration("lifetime")}
                      />
                      ♾️ Бессрочно
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "13px" }}>
                      <input
                        type="radio"
                        name="duration"
                        checked={accessDuration === "30"}
                        onChange={() => setAccessDuration("30")}
                      />
                      📅 30 дней
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "13px" }}>
                      <input
                        type="radio"
                        name="duration"
                        checked={accessDuration === "90"}
                        onChange={() => setAccessDuration("90")}
                      />
                      📅 90 дней
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "13px" }}>
                      <input
                        type="radio"
                        name="duration"
                        checked={accessDuration === "180"}
                        onChange={() => setAccessDuration("180")}
                      />
                      📅 180 дней
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "13px" }}>
                      <input
                        type="radio"
                        name="duration"
                        checked={accessDuration === "custom"}
                        onChange={() => setAccessDuration("custom")}
                      />
                      ✍️ Точная дата...
                    </label>
                  </div>

                  {accessDuration === "custom" && (
                    <input
                      type="date"
                      required
                      value={customDate}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setCustomDate(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        fontSize: "14px",
                        borderRadius: "6px",
                        border: "1px solid var(--color-gray-border)",
                      }}
                    />
                  )}
                </div>

                {/* Действия */}
                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setAccessModalUser(null);
                      setSelectedCourseId("");
                      setSearchCourseQuery("");
                      setIsCourseDropdownOpen(false);
                    }}
                    className="btn btn-secondary"
                    style={{ padding: "10px 20px" }}
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="btn btn-primary"
                    style={{ padding: "10px 20px", display: "inline-flex", alignItems: "center", gap: "8px" }}
                  >
                    {actionLoading && <span className="spinner" />}
                    Выдать доступ
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* --- МОДАЛЬНОЕ ОКНО: СОЗДАНИЕ ИЛИ РЕДАКТИРОВАНИЕ УРОКА --- */}
      {lessonModal.isOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "var(--radius-lg)",
              width: "100%",
              maxWidth: "600px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
              border: "1px solid var(--color-gray-border)",
            }}
          >
            {/* Хедер модалки */}
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid var(--color-gray-border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "#fbf7f5",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "var(--color-dark)" }}>
                {lessonModal.mode === "create" ? "➕ Добавление нового урока" : "✏️ Редактирование урока"}
              </h3>
              <button
                onClick={() => setLessonModal({ isOpen: false, mode: "create", courseId: "" })}
                style={{
                  border: "none",
                  background: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#888",
                }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveLesson} style={{ padding: "24px" }}>
              {/* Переключатель вкладок "Русский" / "Немецкий" */}
              <div style={{ display: "flex", gap: "10px", borderBottom: "2px solid #eae0db", paddingBottom: "10px", marginBottom: "20px" }}>
                <button
                  type="button"
                  onClick={() => setLessonActiveTab("ru")}
                  style={{
                    padding: "8px 16px",
                    fontSize: "14px",
                    fontWeight: 700,
                    cursor: "pointer",
                    border: "none",
                    borderRadius: "6px",
                    backgroundColor: lessonActiveTab === "ru" ? "var(--color-primary)" : "transparent",
                    color: lessonActiveTab === "ru" ? "#fff" : "var(--color-dark)",
                    transition: "all 0.3s ease",
                  }}
                >
                  🇷🇺 Русский
                </button>
                <button
                  type="button"
                  onClick={() => setLessonActiveTab("de")}
                  style={{
                    padding: "8px 16px",
                    fontSize: "14px",
                    fontWeight: 700,
                    cursor: "pointer",
                    border: "none",
                    borderRadius: "6px",
                    backgroundColor: lessonActiveTab === "de" ? "var(--color-primary)" : "transparent",
                    color: lessonActiveTab === "de" ? "#fff" : "var(--color-dark)",
                    transition: "all 0.3s ease",
                  }}
                >
                  🇩🇪 Немецкий (DE)
                </button>
              </div>

              {/* Поля формы */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>

                {lessonActiveTab === "ru" && (
                  <>
                    {/* Название */}
                    <div>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px" }}>
                        Название урока (RU) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Например: Занятие 1. Введение в тему"
                        value={lessonForm.title}
                        onChange={(e) => setLessonForm((prev) => ({ ...prev, title: e.target.value }))}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          fontSize: "14px",
                          borderRadius: "6px",
                          border: "1px solid var(--color-gray-border)",
                        }}
                      />
                    </div>

                    {/* Описание */}
                    <div>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px" }}>
                        Описание урока (RU) (что будут изучать, домашнее задание)
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Подробный план урока или комментарий Ольги..."
                        value={lessonForm.description}
                        onChange={(e) => setLessonForm((prev) => ({ ...prev, description: e.target.value }))}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          fontSize: "14px",
                          borderRadius: "6px",
                          border: "1px solid var(--color-gray-border)",
                          resize: "vertical",
                          fontFamily: "inherit",
                        }}
                      />
                    </div>

                {/* Ссылка на видео */}
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px" }}>
                    Ссылка на видео (YouTube, OK.ru, Kinescope, Vercel Blob или MP4)
                  </label>
                  <input
                    type="text"
                    placeholder="Например: https://www.youtube.com/watch?v=... или https://ok.ru/video/..."
                    value={lessonForm.videoUrl}
                    onChange={(e) => setLessonForm((prev) => ({ ...prev, videoUrl: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      fontSize: "14px",
                      borderRadius: "6px",
                      border: "1px solid var(--color-gray-border)",
                    }}
                  />
                  <span style={{ fontSize: "11px", color: "var(--color-gray)", marginTop: "4px", display: "block", lineHeight: "1.4" }}>
                    Поддерживаются ссылки на <strong>YouTube</strong>, <strong>Одноклассники (ok.ru)</strong>, <strong>Kinescope</strong>, а также прямые ссылки на видеофайлы (<strong>MP4/WebM</strong>) с любых хостингов или облачных хранилищ.
                  </span>
                </div>

                {/* Обложка для видео */}
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px" }}>
                    Обложка для видео (необязательно)
                  </label>
                  
                  {/* Загрузка файла в виде красивой плашки */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLessonCoverUpload}
                      style={{ display: "none" }}
                      id="lesson-cover-file-input"
                    />

                    <div
                      className={styles.imageUploadArea}
                      onClick={() => document.getElementById("lesson-cover-file-input")?.click()}
                      style={{ marginTop: "4px" }}
                    >
                      {lessonCoverUploading && (
                        <div className={styles.progressBar} style={{ width: `${lessonCoverUploadProgress}%` }}></div>
                      )}

                      {lessonForm.videoCoverUrl ? (
                        <div
                          style={{
                            position: "relative",
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <img src={lessonForm.videoCoverUrl} alt="Превью обложки" className={styles.uploadPreview} />
                          <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "12px" }}>
                            <span
                              style={{ fontSize: "12px", color: "var(--color-primary)", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
                              onClick={() => document.getElementById("lesson-cover-file-input")?.click()}
                            >
                              Заменить
                            </span>
                            <span style={{ color: "var(--color-gray-border)", fontSize: "12px" }}>|</span>
                            <span
                              style={{ fontSize: "12px", color: "#ef4444", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
                              onClick={() => setLessonForm((prev) => ({ ...prev, videoCoverUrl: "" }))}
                            >
                              Удалить
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className={styles.uploadPlaceholder}>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="32"
                            height="32"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            viewBox="0 0 24 24"
                          >
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                            <polyline points="21 15 16 10 5 21"></polyline>
                          </svg>
                          <span>Загрузить обложку видео</span>
                          <span style={{ fontSize: "11px", color: "var(--color-gray)" }}>
                            Рекомендуется формат JPEG/PNG, размер до 5 МБ
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>


                {/* Прикрепленные материалы (PDF и др) */}
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px" }}>
                    Ссылки на дополнительные материалы (PDF методички, рабочие тетради)
                  </label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {lessonForm.fileUrls.map((url, idx) => {
                      const isUploading = !!lessonFileUploading[idx];
                      const progress = lessonFileProgress[idx] || 0;
                      const parts = url.split(":::");
                      const fileTitle = parts.length > 1 ? parts[0] : "";
                      const fileUrl = parts.length > 1 ? parts[1] : parts[0];

                      return (
                        <div key={idx} style={{ position: "relative", borderBottom: "1px solid #f0f0f0", paddingBottom: isUploading ? "16px" : "12px", marginBottom: "6px" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
                            <input
                              type="text"
                              placeholder="Название материала (например: Рабочая тетрадь, Методичка)"
                              value={fileTitle}
                              onChange={(e) => handleFileTitleChange(idx, e.target.value)}
                              disabled={isUploading}
                              style={{
                                width: "100%",
                                padding: "8px 12px",
                                fontSize: "13px",
                                borderRadius: "6px",
                                border: "1px solid var(--color-gray-border)",
                                backgroundColor: "#fffaf7",
                                fontWeight: 600,
                              }}
                            />

                            <div style={{ display: "flex", gap: "8px", width: "100%" }}>
                              <input
                                type="text"
                                placeholder="Ссылка на файл (или загрузите с компьютера)..."
                                value={fileUrl}
                                onChange={(e) => handleFileUrlChange(idx, e.target.value)}
                                disabled={isUploading}
                                style={{
                                  flexGrow: 1,
                                  padding: "8px 12px",
                                  fontSize: "13px",
                                  borderRadius: "6px",
                                  border: "1px solid var(--color-gray-border)",
                                }}
                              />

                              <input
                                type="file"
                                id={`lesson-file-input-${idx}`}
                                style={{ display: "none" }}
                                onChange={(e) => handleLessonFileUpload(idx, e)}
                                disabled={isUploading}
                              />

                              <button
                                type="button"
                                onClick={() => document.getElementById(`lesson-file-input-${idx}`)?.click()}
                                disabled={isUploading}
                                style={{
                                  padding: "0 12px",
                                  backgroundColor: "#fbfbf9",
                                  border: "1px solid var(--color-gray-border)",
                                  color: "var(--color-primary)",
                                  borderRadius: "6px",
                                  cursor: isUploading ? "not-allowed" : "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "13px",
                                  fontWeight: 600,
                                  transition: "all 0.2s"
                                }}
                                title="Загрузить файл"
                              >
                                {isUploading ? "⏳ Загрузка..." : "📤 Загрузить файл"}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleRemoveFileUrlInput(idx)}
                                disabled={lessonForm.fileUrls.length === 1 || isUploading}
                                style={{
                                  padding: "0 10px",
                                  backgroundColor: "#fff",
                                  border: "1px solid #c62828",
                                  color: "#c62828",
                                  borderRadius: "6px",
                                  cursor: (lessonForm.fileUrls.length === 1 || isUploading) ? "not-allowed" : "pointer",
                                  opacity: (lessonForm.fileUrls.length === 1 || isUploading) ? 0.3 : 1,
                                }}
                              >
                                &times;
                              </button>
                            </div>
                          </div>

                          {isUploading && (
                            <div style={{
                              position: "absolute",
                              bottom: 0,
                              left: 0,
                              width: `${progress}%`,
                              height: "3px",
                              backgroundColor: "var(--color-primary)",
                              borderRadius: "3px",
                              transition: "width 0.2s"
                            }} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={handleAddFileUrlInput}
                    disabled={Object.values(lessonFileUploading).some(Boolean)}
                    style={{
                      background: "none",
                      border: "none",
                      color: Object.values(lessonFileUploading).some(Boolean) ? "var(--color-gray-border)" : "var(--color-primary)",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: Object.values(lessonFileUploading).some(Boolean) ? "not-allowed" : "pointer",
                      marginTop: "8px",
                      padding: 0,
                    }}
                  >
                    ➕ Добавить еще файл
                  </button>
                </div>
              </>
            )}

                {/* ВКЛАДКА: НЕМЕЦКИЙ */}
                {lessonActiveTab === "de" && (
                  <>
                    {/* Название на немецком */}
                    <div>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px", color: "#785c12" }}>
                        Название урока (DE)
                      </label>
                      <input
                        type="text"
                        placeholder="Например: Lektion 1. Einführung"
                        value={lessonForm.titleDe}
                        onChange={(e) => setLessonForm((prev) => ({ ...prev, titleDe: e.target.value }))}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          fontSize: "14px",
                          borderRadius: "6px",
                          border: "1px solid #e2d2bb",
                          backgroundColor: "#fffdf9",
                        }}
                      />
                    </div>

                    {/* Описание на немецком */}
                    <div>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px", color: "#785c12" }}>
                        Описание урока (DE) (что будут изучать, домашнее задание)
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Подробный план урока на немецком..."
                        value={lessonForm.descriptionDe}
                        onChange={(e) => setLessonForm((prev) => ({ ...prev, descriptionDe: e.target.value }))}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          fontSize: "14px",
                          borderRadius: "6px",
                          border: "1px solid #e2d2bb",
                          resize: "vertical",
                          fontFamily: "inherit",
                          backgroundColor: "#fffdf9",
                        }}
                      />
                    </div>

                    {/* Ссылка на видео на немецком */}
                    <div>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px", color: "#785c12" }}>
                        Ссылка на видео (DE)
                      </label>
                      <input
                        type="text"
                        placeholder="Ссылка на немецкое видео..."
                        value={lessonForm.videoUrlDe}
                        onChange={(e) => setLessonForm((prev) => ({ ...prev, videoUrlDe: e.target.value }))}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          fontSize: "14px",
                          borderRadius: "6px",
                          border: "1px solid #e2d2bb",
                          backgroundColor: "#fffdf9",
                        }}
                      />
                    </div>

                    {/* Обложка для видео на немецком */}
                    <div>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px", color: "#785c12" }}>
                        Обложка для видео (DE) (необязательно)
                      </label>
                      
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLessonCoverDeUpload}
                          style={{ display: "none" }}
                          id="lesson-cover-de-file-input"
                        />

                        <div
                          className={styles.imageUploadArea}
                          onClick={() => document.getElementById("lesson-cover-de-file-input")?.click()}
                          style={{ marginTop: "4px", border: "1px dashed #e2d2bb", backgroundColor: "#fffdf9" }}
                        >
                          {lessonCoverDeUploading && (
                            <div className={styles.progressBar} style={{ width: `${lessonCoverDeUploadProgress}%` }}></div>
                          )}

                          {lessonForm.videoCoverUrlDe ? (
                            <div
                              style={{
                                position: "relative",
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <img src={lessonForm.videoCoverUrlDe} alt="Превью обложки" className={styles.uploadPreview} />
                              <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "12px" }}>
                                <span
                                  style={{ fontSize: "12px", color: "var(--color-primary)", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
                                  onClick={() => document.getElementById("lesson-cover-de-file-input")?.click()}
                                >
                                  Заменить
                                </span>
                                <span style={{ color: "var(--color-gray-border)", fontSize: "12px" }}>|</span>
                                <span
                                  style={{ fontSize: "12px", color: "#ef4444", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
                                  onClick={() => setLessonForm((prev) => ({ ...prev, videoCoverUrlDe: "" }))}
                                >
                                  Удалить
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className={styles.uploadPlaceholder}>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="32"
                                height="32"
                                fill="none"
                                stroke="#785c12"
                                strokeWidth="1.5"
                                viewBox="0 0 24 24"
                              >
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                <polyline points="21 15 16 10 5 21"></polyline>
                              </svg>
                              <span style={{ color: "#785c12" }}>Загрузить обложку видео (DE)</span>
                              <span style={{ fontSize: "11px", color: "var(--color-gray)" }}>
                                Рекомендуется формат JPEG/PNG, размер до 5 МБ
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Прикрепленные материалы (PDF и др) на немецком */}
                    <div>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px", color: "#785c12" }}>
                        Ссылки на немецкие дополнительные материалы
                      </label>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {lessonForm.fileUrlsDe.map((url, idx) => {
                          const isUploading = !!lessonFileDeUploading[idx];
                          const progress = lessonFileDeProgress[idx] || 0;
                          const parts = url.split(":::");
                          const fileTitle = parts.length > 1 ? parts[0] : "";
                          const fileUrl = parts.length > 1 ? parts[1] : parts[0];

                          return (
                            <div key={idx} style={{ position: "relative", borderBottom: "1px solid #f2e6e1", paddingBottom: isUploading ? "16px" : "12px", marginBottom: "6px" }}>
                              <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
                                <input
                                  type="text"
                                  placeholder="Название материала на немецком (например: Arbeitsblatt, Handout)"
                                  value={fileTitle}
                                  onChange={(e) => handleFileTitleDeChange(idx, e.target.value)}
                                  disabled={isUploading}
                                  style={{
                                    width: "100%",
                                    padding: "8px 12px",
                                    fontSize: "13px",
                                    borderRadius: "6px",
                                    border: "1px solid #e2d2bb",
                                    backgroundColor: "#fffdf9",
                                    fontWeight: 600,
                                  }}
                                />

                                <div style={{ display: "flex", gap: "8px", width: "100%" }}>
                                  <input
                                    type="text"
                                    placeholder="Ссылка на файл..."
                                    value={fileUrl}
                                    onChange={(e) => handleFileUrlDeChange(idx, e.target.value)}
                                    disabled={isUploading}
                                    style={{
                                      flexGrow: 1,
                                      padding: "8px 12px",
                                      fontSize: "13px",
                                      borderRadius: "6px",
                                      border: "1px solid #e2d2bb",
                                      backgroundColor: "#fffdf9",
                                    }}
                                  />

                                  <input
                                    type="file"
                                    id={`lesson-file-de-input-${idx}`}
                                    style={{ display: "none" }}
                                    onChange={(e) => handleLessonFileDeUpload(idx, e)}
                                    disabled={isUploading}
                                  />

                                  <button
                                    type="button"
                                    onClick={() => document.getElementById(`lesson-file-de-input-${idx}`)?.click()}
                                    disabled={isUploading}
                                    style={{
                                      padding: "0 12px",
                                      backgroundColor: "#fffdf9",
                                      border: "1px solid #e2d2bb",
                                      color: "#785c12",
                                      borderRadius: "6px",
                                      cursor: isUploading ? "not-allowed" : "pointer",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      fontSize: "13px",
                                      fontWeight: 600,
                                      transition: "all 0.2s"
                                    }}
                                    title="Загрузить файл"
                                  >
                                    {isUploading ? "⏳ Загрузка..." : "📤 Загрузить файл"}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleRemoveFileUrlDeInput(idx)}
                                    disabled={lessonForm.fileUrlsDe.length === 1 || isUploading}
                                    style={{
                                      padding: "0 10px",
                                      backgroundColor: "#fff",
                                      border: "1px solid #c62828",
                                      color: "#c62828",
                                      borderRadius: "6px",
                                      cursor: (lessonForm.fileUrlsDe.length === 1 || isUploading) ? "not-allowed" : "pointer",
                                      opacity: (lessonForm.fileUrlsDe.length === 1 || isUploading) ? 0.3 : 1,
                                    }}
                                  >
                                    &times;
                                  </button>
                                </div>
                              </div>

                              {isUploading && (
                                <div style={{
                                  position: "absolute",
                                  bottom: 0,
                                  left: 0,
                                  width: `${progress}%`,
                                  height: "3px",
                                  backgroundColor: "var(--color-primary)",
                                  borderRadius: "3px",
                                  transition: "width 0.2s"
                                }} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <button
                        type="button"
                        onClick={handleAddFileUrlDeInput}
                        disabled={Object.values(lessonFileDeUploading).some(Boolean)}
                        style={{
                          background: "none",
                          border: "none",
                          color: Object.values(lessonFileDeUploading).some(Boolean) ? "var(--color-gray-border)" : "#785c12",
                          fontSize: "12px",
                          fontWeight: 700,
                          cursor: Object.values(lessonFileDeUploading).some(Boolean) ? "not-allowed" : "pointer",
                          marginTop: "8px",
                          padding: 0,
                        }}
                      >
                        ➕ Добавить еще файл (DE)
                      </button>
                    </div>
                  </>
                )}

                <hr style={{ border: "none", borderTop: "1px solid #eae0db", margin: "10px 0" }} />

                {/* Порядковый номер в курсе (глобальный) */}
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px" }}>
                    Порядковый номер в курсе *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={lessonForm.order}
                    onChange={(e) => setLessonForm((prev) => ({ ...prev, order: Number(e.target.value) }))}
                    style={{
                      width: "120px",
                      padding: "10px 12px",
                      fontSize: "14px",
                      borderRadius: "6px",
                      border: "1px solid var(--color-gray-border)",
                    }}
                  />
                </div>

              </div>

              {/* Действия */}
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setLessonModal({ isOpen: false, mode: "create", courseId: "" })}
                  className="btn btn-secondary"
                  style={{ padding: "10px 20px" }}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || Object.values(lessonFileUploading).some(Boolean)}
                  className="btn btn-primary"
                  style={{ padding: "10px 20px", display: "inline-flex", alignItems: "center", gap: "8px" }}
                >
                  {actionLoading && <span className="spinner" />}
                  {lessonModal.mode === "create" ? "Создать урок" : "Сохранить"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- МОДАЛЬНОЕ ОКНО: РЕДАКТИРОВАНИЕ КУРСА --- */}
      {courseModal.isOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "var(--radius-lg)",
              width: "100%",
              maxWidth: "500px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
              border: "1px solid var(--color-gray-border)",
            }}
          >
            {/* Хедер модалки */}
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid var(--color-gray-border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "#fbf7f5",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "var(--color-dark)" }}>
                {courseModal.mode === "create" ? "➕ Создание нового курса" : "✏️ Редактирование курса"}
              </h3>
              <button
                onClick={() => setCourseModal({ isOpen: false, mode: "create", courseId: "", title: "", titleDe: "", description: "", descriptionDe: "", imageUrl: "", imageUrlDe: "" })}
                style={{
                  border: "none",
                  background: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#888",
                }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveCourse} style={{ padding: "24px" }}>
              {/* Переключатель вкладок "Русский" / "Немецкий" */}
              <div style={{ display: "flex", gap: "10px", borderBottom: "2px solid #eae0db", paddingBottom: "10px", marginBottom: "20px" }}>
                <button
                  type="button"
                  onClick={() => setCourseActiveTab("ru")}
                  style={{
                    padding: "8px 16px",
                    fontSize: "14px",
                    fontWeight: 700,
                    cursor: "pointer",
                    border: "none",
                    borderRadius: "6px",
                    backgroundColor: courseActiveTab === "ru" ? "var(--color-primary)" : "transparent",
                    color: courseActiveTab === "ru" ? "#fff" : "var(--color-dark)",
                    transition: "all 0.3s ease",
                  }}
                >
                  🇷🇺 Русский
                </button>
                <button
                  type="button"
                  onClick={() => setCourseActiveTab("de")}
                  style={{
                    padding: "8px 16px",
                    fontSize: "14px",
                    fontWeight: 700,
                    cursor: "pointer",
                    border: "none",
                    borderRadius: "6px",
                    backgroundColor: courseActiveTab === "de" ? "var(--color-primary)" : "transparent",
                    color: courseActiveTab === "de" ? "#fff" : "var(--color-dark)",
                    transition: "all 0.3s ease",
                  }}
                >
                  🇩🇪 Немецкий (DE)
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>

                {/* ВКЛАДКА: РУССКИЙ */}
                {courseActiveTab === "ru" && (
                  <>
                    {/* Название */}
                    <div>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px" }}>
                        Название курса (RU) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Например: Обучение Таро"
                        value={courseModal.title}
                        onChange={(e) => setCourseModal((prev) => ({ ...prev, title: e.target.value }))}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          fontSize: "14px",
                          borderRadius: "6px",
                          border: "1px solid var(--color-gray-border)",
                        }}
                      />
                    </div>

                    {/* Описание курса */}
                    <div>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px" }}>
                        Описание курса (RU) *
                      </label>
                      <textarea
                        required
                        placeholder="Введите описание программы обучения, ключевые темы и результаты курса..."
                        rows={3}
                        value={courseModal.description}
                        onChange={(e) => setCourseModal((prev) => ({ ...prev, description: e.target.value }))}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          fontSize: "14px",
                          borderRadius: "6px",
                          border: "1px solid var(--color-gray-border)",
                          resize: "vertical",
                          fontFamily: "inherit"
                        }}
                      />
                    </div>

                    {/* Ссылка на изображение */}
                    <div>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px" }}>
                        Изображение для карточки магазина (URL)
                      </label>
                      <input
                        type="text"
                        placeholder="Например: /public/tarot.png"
                        value={courseModal.imageUrl}
                        onChange={(e) => setCourseModal((prev) => ({ ...prev, imageUrl: e.target.value }))}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          fontSize: "14px",
                          borderRadius: "6px",
                          border: "1px solid var(--color-gray-border)",
                          marginBottom: "10px",
                        }}
                      />

                      {/* Загрузка файла в виде красивой плашки */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCourseImageUpload}
                          style={{ display: "none" }}
                          id="course-image-file-input"
                        />

                        <div
                          className={styles.imageUploadArea}
                          onClick={() => document.getElementById("course-image-file-input")?.click()}
                          style={{ marginTop: "4px" }}
                        >
                          {courseImageUploading && (
                            <div className={styles.progressBar} style={{ width: `${courseImageUploadProgress}%` }}></div>
                          )}

                          {courseModal.imageUrl ? (
                            <div
                              style={{
                                position: "relative",
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <img src={courseModal.imageUrl} alt="Превью" className={styles.uploadPreview} />
                              <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "12px" }}>
                                <span
                                  style={{ fontSize: "12px", color: "var(--color-primary)", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
                                  onClick={() => document.getElementById("course-image-file-input")?.click()}
                                >
                                  Заменить
                                </span>
                                <span style={{ color: "var(--color-gray-border)", fontSize: "12px" }}>|</span>
                                <span
                                  style={{ fontSize: "12px", color: "#ef4444", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
                                  onClick={() => setCourseModal((prev) => ({ ...prev, imageUrl: "" }))}
                                >
                                  Удалить
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className={styles.uploadPlaceholder}>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="32"
                                height="32"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                viewBox="0 0 24 24"
                              >
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                <polyline points="21 15 16 10 5 21"></polyline>
                              </svg>
                              <span>Загрузить изображение курса</span>
                              <span style={{ fontSize: "11px", color: "var(--color-gray)" }}>
                                Рекомендуется формат JPEG/PNG, размер до 5 МБ
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* ВКЛАДКА: НЕМЕЦКИЙ */}
                {courseActiveTab === "de" && (
                  <>
                    {/* Название на немецком */}
                    <div>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px", color: "#785c12" }}>
                        Название курса (DE)
                      </label>
                      <input
                        type="text"
                        placeholder="Например: Tarot-Ausbildung"
                        value={courseModal.titleDe}
                        onChange={(e) => setCourseModal((prev) => ({ ...prev, titleDe: e.target.value }))}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          fontSize: "14px",
                          borderRadius: "6px",
                          border: "1px solid #e2d2bb",
                          backgroundColor: "#fffdf9",
                        }}
                      />
                    </div>

                    {/* Описание на немецком */}
                    <div>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px", color: "#785c12" }}>
                        Описание курса (DE)
                      </label>
                      <textarea
                        placeholder="Описание программы обучения на немецком..."
                        rows={3}
                        value={courseModal.descriptionDe}
                        onChange={(e) => setCourseModal((prev) => ({ ...prev, descriptionDe: e.target.value }))}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          fontSize: "14px",
                          borderRadius: "6px",
                          border: "1px solid #e2d2bb",
                          resize: "vertical",
                          fontFamily: "inherit",
                          backgroundColor: "#fffdf9",
                        }}
                      />
                    </div>

                    {/* Ссылка на немецкое изображение */}
                    <div>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px", color: "#785c12" }}>
                        Изображение для карточки магазина (DE) (URL)
                      </label>
                      <input
                        type="text"
                        placeholder="Например: /public/tarot_de.png"
                        value={courseModal.imageUrlDe}
                        onChange={(e) => setCourseModal((prev) => ({ ...prev, imageUrlDe: e.target.value }))}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          fontSize: "14px",
                          borderRadius: "6px",
                          border: "1px solid #e2d2bb",
                          marginBottom: "10px",
                          backgroundColor: "#fffdf9",
                        }}
                      />

                      {/* Загрузка немецкого файла в виде красивой плашки */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCourseImageDeUpload}
                          style={{ display: "none" }}
                          id="course-image-de-file-input"
                        />

                        <div
                          className={styles.imageUploadArea}
                          onClick={() => document.getElementById("course-image-de-file-input")?.click()}
                          style={{ marginTop: "4px", border: "1px dashed #e2d2bb", backgroundColor: "#fffdf9" }}
                        >
                          {courseImageDeUploading && (
                            <div className={styles.progressBar} style={{ width: `${courseImageDeUploadProgress}%` }}></div>
                          )}

                          {courseModal.imageUrlDe ? (
                            <div
                              style={{
                                position: "relative",
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <img src={courseModal.imageUrlDe} alt="Превью" className={styles.uploadPreview} />
                              <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "12px" }}>
                                <span
                                  style={{ fontSize: "12px", color: "var(--color-primary)", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
                                  onClick={() => document.getElementById("course-image-de-file-input")?.click()}
                                >
                                  Заменить
                                </span>
                                <span style={{ color: "var(--color-gray-border)", fontSize: "12px" }}>|</span>
                                <span
                                  style={{ fontSize: "12px", color: "#ef4444", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
                                  onClick={() => setCourseModal((prev) => ({ ...prev, imageUrlDe: "" }))}
                                >
                                  Удалить
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className={styles.uploadPlaceholder}>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="32"
                                height="32"
                                fill="none"
                                stroke="#785c12"
                                strokeWidth="1.5"
                                viewBox="0 0 24 24"
                              >
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                <polyline points="21 15 16 10 5 21"></polyline>
                              </svg>
                              <span style={{ color: "#785c12" }}>Загрузить изображение курса (DE)</span>
                              <span style={{ fontSize: "11px", color: "var(--color-gray)" }}>
                                Рекомендуется формат JPEG/PNG, размер до 5 МБ
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}

              </div>

              {/* Действия */}
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setCourseModal({ isOpen: false, mode: "create", courseId: "", title: "", titleDe: "", description: "", descriptionDe: "", imageUrl: "", imageUrlDe: "" })}
                  className="btn btn-secondary"
                  style={{ padding: "10px 20px" }}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || courseImageUploading || courseImageDeUploading}
                  className="btn btn-primary"
                  style={{ padding: "10px 20px", display: "inline-flex", alignItems: "center", gap: "8px" }}
                >
                  {actionLoading && <span className="spinner" />}
                  {courseModal.mode === "create" ? "Создать курс" : "Сохранить изменения"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- МОДАЛЬНОЕ ОКНО: ДОБАВЛЕНИЕ/РЕДАКТИРОВАНИЕ УЧЕНИКА --- */}
      {userModal.isOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "var(--radius-lg)",
              width: "100%",
              maxWidth: "500px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
              border: "1px solid var(--color-gray-border)",
            }}
          >
            {/* Хедер модалки */}
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid var(--color-gray-border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "#fbf7f5",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "var(--color-dark)" }}>
                {userModal.mode === "create" ? "➕ Добавление ученика" : "✏️ Редактирование личных данных"}
              </h3>
              <button
                onClick={() => setUserModal({ isOpen: false, mode: "create", userId: "", name: "", email: "", phone: "", role: "USER", additionalInfo: "" })}
                style={{
                  border: "none",
                  background: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#888",
                }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveUser} style={{ padding: "24px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>

                {/* Имя */}
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px" }}>
                    ФИО ученика *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Например: Иван Иванов"
                    value={userModal.name}
                    onChange={(e) => setUserModal((prev) => ({ ...prev, name: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      fontSize: "14px",
                      borderRadius: "6px",
                      border: "1px solid var(--color-gray-border)",
                    }}
                  />
                </div>

                {/* Email */}
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px" }}>
                    Email (уникальный) *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="Например: ivan@example.com"
                    value={userModal.email}
                    onChange={(e) => setUserModal((prev) => ({ ...prev, email: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      fontSize: "14px",
                      borderRadius: "6px",
                      border: "1px solid var(--color-gray-border)",
                    }}
                  />
                </div>

                {/* Телефон */}
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px" }}>
                    Телефон *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Например: +79991234567"
                    value={userModal.phone}
                    onChange={(e) => setUserModal((prev) => ({ ...prev, phone: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      fontSize: "14px",
                      borderRadius: "6px",
                      border: "1px solid var(--color-gray-border)",
                    }}
                  />
                </div>

                {/* Временный пароль (показываем только при создании) */}
                {userModal.mode === "create" && (
                  <div style={{ padding: "10px 12px", backgroundColor: "#fff9e6", borderRadius: "6px", border: "1px solid #f5e6cc", fontSize: "12px", color: "#785c12" }}>
                    💡 Временный пароль для входа по умолчанию: <b>khavich2026</b> (ученик сможет войти с ним и изменить его в любой момент).
                  </div>
                )}

                {/* Роль в системе */}
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px" }}>
                    Роль в системе *
                  </label>
                  <select
                    value={userModal.role}
                    onChange={(e) => setUserModal((prev) => ({ ...prev, role: e.target.value as "USER" | "ADMIN" }))}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      fontSize: "14px",
                      borderRadius: "6px",
                      border: "1px solid var(--color-gray-border)",
                      backgroundColor: "#fff",
                      cursor: "pointer",
                      outline: "none"
                    }}
                  >
                    <option value="USER">Ученик (USER)</option>
                    <option value="ADMIN">Администратор (ADMIN)</option>
                  </select>
                  <p style={{ fontSize: "11px", color: "var(--color-gray)", marginTop: "4px", margin: 0 }}>
                    Предоставление роли администратора дает полный доступ к админ-панели и управлению сайтом.
                  </p>
                </div>

                {/* Дополнительная информация */}
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px" }}>
                    Дополнительная информация (заметки о клиенте)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Например: Покупатель амулетов, интересуется Таро..."
                    value={userModal.additionalInfo}
                    onChange={(e) => setUserModal((prev) => ({ ...prev, additionalInfo: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      fontSize: "14px",
                      borderRadius: "6px",
                      border: "1px solid var(--color-gray-border)",
                      resize: "vertical",
                      fontFamily: "inherit",
                    }}
                  />
                </div>

              </div>

              {/* Действия */}
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setUserModal({ isOpen: false, mode: "create", userId: "", name: "", email: "", phone: "", role: "USER", additionalInfo: "" })}
                  className="btn btn-secondary"
                  style={{ padding: "10px 20px" }}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn btn-primary"
                  style={{ padding: "10px 20px", display: "inline-flex", alignItems: "center", gap: "8px" }}
                >
                  {actionLoading && <span className="spinner" />}
                  {userModal.mode === "create" ? "Создать ученика" : "Сохранить"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Кастомный диалог подтверждения */}
      <ConfirmModal
        {...confirmModal}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* --- ГЛОБАЛЬНЫЕ СТИЛИ (CSS) ДЛЯ АНИМАЦИЙ И СПИННЕРОВ --- */}
      <style jsx global>{`
        .spinner {
          width: 14px;
          height: 14px;
          border: 2px solid #fff;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
          display: inline-block;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};
