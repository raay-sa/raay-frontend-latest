// src/components/CourseCard.jsx
import React, { useMemo, useState } from "react";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";
import {
  PencilIcon,
  TrashIcon,
  VideoCameraIcon,
  VideoCameraSlashIcon,
  ArrowPathIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import "@abdulrysr/saudi-riyal-new-symbol-font/style.css";
import DeleteProgramModal from "./Modals/DeleteProgramModal";

export default function CourseCard({
  className = "",
  role = "student", // "teacher" | "student"

  // program data
  id,
  imageSrc,
  badgeLabel,
  title,
  description,
  reviewsCount = 0,
  rating = 0,
  price = 0,
  instructorName = "",
  instructorAvatar,
  isLive = false,          // program type is live
  isBroadcasting = false,  // there is an active live session now

  // student-only
  isSubscribed = false,
  onPrimary = () => { },

  // teacher-only
  status,                 // optional: "published" | "draft" | ...
  onDetails = () => { },
  onEdit = () => { },
  onStudents = () => { },  // called to view students list
  onStart = () => { },     // called for live courses ("بدء البرنامج")
  onDelete = async () => { },
  startLoading = false,
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isTeacher = role === "teacher";

  // guard empty src to avoid broken img requests
  const safeImage = useMemo(() => (imageSrc || "").trim() || undefined, [imageSrc]);
  const safeAvatar = useMemo(
    () => (instructorAvatar || "").trim() || undefined,
    [instructorAvatar]
  );

  // Student primary button label
  // Join only if: live + broadcasting + subscribed
  const canJoin = isLive && isBroadcasting && isSubscribed;
  const studentPrimaryLabel = canJoin ? "انضم" : isSubscribed ? "التفاصيل" : "سجل الآن";

  const handleDelete = async () => {
    try {
      await onDelete(id);
    } finally {
      setConfirmOpen(false);
    }
  };

  return (
    <div className={`relative bg-white rounded-xl shadow-md overflow-hidden ${className}`}>
      {/* Thumbnail */}
      <div className="relative">
        {safeImage ? (
          <img
            src={safeImage}
            alt={title || "صورة البرنامج"}
            className="w-full h-32 sm:h-40 lg:h-48 object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-32 sm:h-40 lg:h-48 bg-gray-100" />
        )}

        {/* Category badge */}
        {badgeLabel ? (
          <span
            className="absolute bottom-0 transform ms-3 px-3 py-1 text-xs font-semibold text-white rounded-t-lg"
            style={{ backgroundColor: "#bb9b6b" }}
          >
            {badgeLabel}
          </span>
        ) : null}

        {/* LIVE chip */}
        {isLive && (
          <div
            className={`absolute top-2 right-2 ${isBroadcasting ? "bg-red-100" : "bg-gray-100"
              } px-1 py-1 rounded-xl`}
          >
            <div
              className={`flex items-center gap-1 text-xs font-bold ${isBroadcasting ? "text-red-600" : "text-gray-600"
                }`}
            >
              {isBroadcasting ? (
                <VideoCameraIcon className="w-4 h-4" />
              ) : (
                <VideoCameraSlashIcon className="w-4 h-4" />
              )}
              <span
                className={`rounded-full px-2 text-[10px] leading-4 border ${isBroadcasting ? "border-red-600" : "border-gray-400"
                  }`}
              >
                مباشر
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-2 sm:p-3 lg:p-4 flex flex-col gap-2 sm:gap-3">
        {/* Rating */}
        <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-600">
          <span>{Number.isFinite(+rating) ? (+rating).toFixed(1) : 0}</span>
          <StarSolid className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
          <span>({reviewsCount || 0})</span>
        </div>

        {/* Title + description */}
        <h3 className="font-semibold text-sm sm:text-base lg:text-lg text-gray-900 line-clamp-2">{title}</h3>
        <p className="text-xs sm:text-sm text-gray-500 line-clamp-2 truncate">{description}</p>

        {/* Instructor + price */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            {safeAvatar ? (
              <img
                src={safeAvatar}
                alt={instructorName || "المدرب"}
                className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gray-200" />
            )}
            <span className="text-xs sm:text-sm text-gray-800 truncate">{instructorName || "—"}</span>
          </div>

          <div className="flex items-center gap-1 text-base sm:text-lg lg:text-xl font-bold text-secondary">
            <span>{price ?? 0}</span>
            <span className="icon-saudi_riyal">&#xea;</span>
          </div>
        </div>

        {/* Actions */}
        {isTeacher ? (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-3 sm:mt-4">
            {/* icon actions (left) */}
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <button
                type="button"
                title="حذف"
                onClick={() => setConfirmOpen(true)}
                className="p-2 bg-gray-100 rounded hover:bg-gray-200 flex items-center justify-center"
              >
                <TrashIcon className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
              </button>
              <button
                type="button"
                title="تعديل"
                onClick={onEdit}
                className="p-2 bg-gray-100 rounded hover:bg-gray-200 flex items-center justify-center"
              >
                <PencilIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              </button>
              <button
                type="button"
                title="قائمة الطلاب"
                onClick={onStudents}
                className="p-2 bg-gray-100 rounded hover:bg-gray-200 flex items-center justify-center"
              >
                <UserGroupIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              </button>
            </div>

            {/* primary action (fills space) */}
            <button
              type="button"
              onClick={isLive ? onStart : onDetails}
              disabled={isLive && startLoading}
              aria-busy={isLive && startLoading}
              className="flex-1 py-2 bg-primary text-white rounded-lg text-xs sm:text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
            >
              {isLive ? (
                <>
                  {startLoading && <ArrowPathIcon className="w-4 h-4 animate-spin" />}
                  {startLoading ? "جاري البدء..." : "بدء البرنامج"}
                </>
              ) : (
                "تفاصيل البرنامج"
              )}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onPrimary}
            className="mt-3 sm:mt-4 w-full py-2 bg-primary text-white rounded-lg text-xs sm:text-sm font-medium"
          >
            {studentPrimaryLabel}
          </button>
        )}
      </div>

      {/* Confirm delete */}
      <DeleteProgramModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}test category
      />
    </div>
  );
}
