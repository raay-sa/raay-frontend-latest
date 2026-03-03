// src/pages/dashboard/admin/Categories/Create.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CategoriesService } from "../../../../services/categoriesService";
import { toast } from "react-hot-toast";

export default function CategoryCreate() {
    const [title, setTitle] = useState({ ar: "", en: "" });
    const [imageAr, setImageAr] = useState(null);
    const [imageEn, setImageEn] = useState(null);
    const [previewAr, setPreviewAr] = useState("");
    const [previewEn, setPreviewEn] = useState("");
    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({}); // { title?: [..], image_ar?: [..], image_en?: [..], ... }
    const navigate = useNavigate();

    const handleChooseImageAr = (e) => {
        const file = e.target.files?.[0];
        setImageAr(file || null);
        if (file) {
            const url = URL.createObjectURL(file);
            setPreviewAr(url);
        } else {
            setPreviewAr("");
        }
        // clear server error for image_ar on change
        setFieldErrors((prev) => ({ ...prev, image_ar: undefined }));
    };

    const handleChooseImageEn = (e) => {
        const file = e.target.files?.[0];
        setImageEn(file || null);
        if (file) {
            const url = URL.createObjectURL(file);
            setPreviewEn(url);
        } else {
            setPreviewEn("");
        }
        // clear server error for image_en on change
        setFieldErrors((prev) => ({ ...prev, image_en: undefined }));
    };

    const extractErrors = (err) => {
        const data = err?.response?.data;
        const errors = data?.errors || {};
        const message = data?.message || "حدث خطأ أثناء الإضافة";
        return { errors, message };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFieldErrors({});
        if (!title.ar.trim()) {
            setFieldErrors({ "title.ar": ["يرجى إدخال اسم التخصص بالعربية"] });
            return toast.error("يرجى إدخال اسم التخصص بالعربية");
        }
        if (!title.en.trim()) {
            setFieldErrors({ "title.en": ["يرجى إدخال اسم التخصص بالإنجليزية"] });
            return toast.error("يرجى إدخال اسم التخصص بالإنجليزية");
        }
        setLoading(true);
        try {
            await CategoriesService.create({ 
                title: { ar: title.ar.trim(), en: title.en.trim() }, 
                image_ar: imageAr,
                image_en: imageEn
            });
            toast.success("تمت إضافة التخصص بنجاح");
            navigate("/admin/categories");
        } catch (err) {
            const { errors, message } = extractErrors(err);
            setFieldErrors(errors);
            // Prefer the first field error if present; otherwise use message.
            const firstError =
                (errors?.["title.ar"] && errors["title.ar"][0]) ||
                (errors?.["title.en"] && errors["title.en"][0]) ||
                (errors?.image_ar && errors.image_ar[0]) ||
                (errors?.image_en && errors.image_en[0]) ||
                message;
            toast.error(firstError);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const titleArHasError = Array.isArray(fieldErrors?.["title.ar"]) && fieldErrors["title.ar"].length > 0;
    const titleEnHasError = Array.isArray(fieldErrors?.["title.en"]) && fieldErrors["title.en"].length > 0;
    const imageArHasError = Array.isArray(fieldErrors?.image_ar) && fieldErrors.image_ar.length > 0;
    const imageEnHasError = Array.isArray(fieldErrors?.image_en) && fieldErrors.image_en.length > 0;

    return (
        <div className="p-6 space-y-6" dir="rtl">
            <h1 className="text-2xl font-bold">إضافة تخصص</h1>

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md max-w-2xl space-y-5">
                <div>
                    <label className="block font-medium mb-2">اسم التخصص (عربي)</label>
                    <input
                        type="text"
                        value={title.ar}
                        onChange={(e) => {
                            setTitle(prev => ({ ...prev, ar: e.target.value }));
                            // clear server error for title.ar on change
                            if (titleArHasError) {
                                setFieldErrors((prev) => ({ ...prev, "title.ar": undefined }));
                            }
                        }}
                        placeholder="أدخل اسم التخصص بالعربية"
                        className={`w-full border px-3 py-2 rounded ${titleArHasError ? "border-red-500" : "border-gray-300"}`}
                    />
                    {titleArHasError && (
                        <p className="text-red-600 text-sm mt-1">{fieldErrors["title.ar"][0]}</p>
                    )}
                </div>

                <div>
                    <label className="block font-medium mb-2">اسم التخصص (إنجليزي)</label>
                    <input
                        type="text"
                        value={title.en}
                        onChange={(e) => {
                            setTitle(prev => ({ ...prev, en: e.target.value }));
                            // clear server error for title.en on change
                            if (titleEnHasError) {
                                setFieldErrors((prev) => ({ ...prev, "title.en": undefined }));
                            }
                        }}
                        placeholder="أدخل اسم التخصص بالإنجليزية"
                        className={`w-full border px-3 py-2 rounded ${titleEnHasError ? "border-red-500" : "border-gray-300"}`}
                    />
                    {titleEnHasError && (
                        <p className="text-red-600 text-sm mt-1">{fieldErrors["title.en"][0]}</p>
                    )}
                </div>

                <div>
                    <label className="block font-medium mb-2">الصورة العربية (اختياري)</label>
                    {previewAr && (
                        <img src={previewAr} alt="preview ar" className="w-28 h-28 object-cover rounded mb-3" />
                    )}
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleChooseImageAr}
                        className={`${imageArHasError ? "border border-red-500 rounded" : ""}`}
                    />
                    {imageArHasError && (
                        <p className="text-red-600 text-sm mt-1">{fieldErrors.image_ar[0]}</p>
                    )}
                </div>

                <div>
                    <label className="block font-medium mb-2">الصورة الإنجليزية (اختياري)</label>
                    {previewEn && (
                        <img src={previewEn} alt="preview en" className="w-28 h-28 object-cover rounded mb-3" />
                    )}
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleChooseImageEn}
                        className={`${imageEnHasError ? "border border-red-500 rounded" : ""}`}
                    />
                    {imageEnHasError && (
                        <p className="text-red-600 text-sm mt-1">{fieldErrors.image_en[0]}</p>
                    )}
                </div>

                <div className="flex gap-3">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-primary text-white px-4 py-2 rounded disabled:opacity-60"
                    >
                        حفظ
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate("/admin/categories")}
                        className="px-4 py-2 border rounded"
                    >
                        إلغاء
                    </button>
                </div>
            </form>
        </div>
    );
}
