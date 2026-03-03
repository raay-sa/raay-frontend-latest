// src/pages/dashboard/expert/Program/EditProgramPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Form from "../../../../components/Form";
import ProgramsService from "../../../../services/teacher/programsService";
import assignmentsService from "../../../../services/teacher/assignmentsService";
import { processProgram } from "../../../../utils/translations";
import toast from "react-hot-toast";

/* ============================ config ============================ */
const RAW_BASE = import.meta.env.VITE_BASE_URL || "";
// If RAW_BASE is an API root like https://…/api, strip /api for asset URLs:
const ASSET_BASE = RAW_BASE.replace(/\/api\/?$/i, "") || window.location.origin;

/* ============================ helpers =========================== */
const joinUrl = (base, path) => {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    return `${base.replace(/\/+$/, "")}/${String(path).replace(/^\/+/, "")}`;
};

const toTime = (s) => {
    if (!s) return "";
    const m = String(s).match(/^(\d{2}):(\d{2})(?::\d{2})?$/);
    if (m) return `${m[1]}:${m[2]}`;
    const d = new Date(String(s).replace(" ", "T"));
    return Number.isNaN(d.getTime()) ? "" : d.toTimeString().slice(0, 5);
};

const toDate = (s) => {
    if (!s) return "";
    const d = new Date(String(s).replace(" ", "T"));
    return Number.isNaN(d.getTime()) ? String(s).slice(0, 10) : d.toISOString().slice(0, 10);
};


/* ============================ page ============================== */
export default function EditProgramPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [categories, setCategories] = useState([]);
    const [initial, setInitial] = useState(null);
    const [imagePreview, setImagePreview] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const [catsRes, progRes] = await Promise.all([
                    assignmentsService.getCategories(),
                    ProgramsService.getOne(id),
                ]);

                const cats = catsRes?.data?.data ?? catsRes?.data ?? [];
                // Process categories to extract titles from translations
                const processedCategories = (Array.isArray(cats) ? cats : []).map(category => {
                    if (category.translations && Array.isArray(category.translations)) {
                        const arTranslation = category.translations.find(t => t.locale === 'ar');
                        return {
                            ...category,
                            title: arTranslation?.title || category.title || ''
                        };
                    }
                    return category;
                });
                setCategories(processedCategories);

                const p = progRes?.data?.data || {};

                // Process the program data with translations
                processProgram(p);

                // Build a preview URL for display
                setImagePreview(joinUrl(ASSET_BASE, p.image));

                // normalize "type" to UI values: live | recorded | onsite
                // Priority: use p.type directly from API, only fallback if type is missing
                let uiType = p.type;
                // Normalize 'registered' to 'recorded' for UI consistency
                if (uiType === 'registered') {
                    uiType = 'recorded';
                }
                // Only use fallback if type is missing or invalid
                if (!uiType || !['live', 'recorded', 'onsite'].includes(uiType)) {
                    // Fallback: try to infer from is_live flag if type is missing
                    if (typeof p.is_live === "number" || typeof p.is_live === "boolean") {
                        uiType = p.is_live ? "live" : "recorded";
                    } else {
                        uiType = "live"; // default
                    }
                }

                // Extract translations for form
                const translations = p.translations || [];
                const arTranslation = translations.find(t => t.locale === 'ar') || {};
                const enTranslation = translations.find(t => t.locale === 'en') || {};

                // Extract dates - ensure we always get empty string, never null/undefined
                const dateFrom = (p.date_from ? toDate(p.date_from) : "") || "";
                const dateTo = (p.date_to ? toDate(p.date_to) : "") || "";
                
                setInitial({
                    title: {
                        ar: arTranslation.title || "",
                        en: enTranslation.title || ""
                    },
                    category_id: String(p.category_id ?? p?.category?.id ?? ""),
                    price: p.price ?? "",
                    description: {
                        ar: arTranslation.description || "",
                        en: enTranslation.description || ""
                    },
                    learning: (arTranslation.learning || []).map((item, i) => ({
                        ar: item,
                        en: (enTranslation.learning || [])[i] || ""
                    })),
                    requirement: (arTranslation.requirement || []).map((item, i) => ({
                        ar: item,
                        en: (enTranslation.requirement || [])[i] || ""
                    })),
                    main_axes: (arTranslation.main_axes || []).map((item, i) => ({
                        ar: item,
                        en: (enTranslation.main_axes || [])[i] || ""
                    })),
                    notes: p.notes || "",
                    type: uiType,
                    // ALWAYS initialize ALL date fields to empty strings, then populate based on type
                    // This ensures fields always exist in form state, even when null
                    live_date_from: uiType === 'live' ? (dateFrom || '') : '',
                    live_date_to: uiType === 'live' ? (dateTo || '') : '',
                    recorded_date_from: uiType === 'recorded' ? (dateFrom || '') : '',
                    onsite_date_from: uiType === 'onsite' ? (dateFrom || '') : '',
                    onsite_date_to: uiType === 'onsite' ? (dateTo || '') : '',
                    duration: (p.duration || '').toString(),
                    time: uiType === 'live' ? (p.time ? toTime(p.time) : '') : '',
                    have_certificate: Boolean(p.have_certificate),
                    status: p.status === 1 ? 'active' : 'inactive',
                    level: p.level || "",
                    sections: Array.isArray(p.sections) ? p.sections.map((s) => {
                        const sectionTranslations = s.translations || [];
                        const sectionAr = sectionTranslations.find(t => t.locale === 'ar') || {};
                        const sectionEn = sectionTranslations.find(t => t.locale === 'en') || {};
                        return {
                            title: {
                                ar: sectionAr.title || "",
                                en: sectionEn.title || ""
                            }
                        };
                    }) : [],
                    user_type: "student", // Always student 
                    address: p.address || "",
                    url: p.url || "",
                });
            } catch (e) {
                console.error("Failed to load program or categories", e);
            }
        })();
    }, [id]);

    const [form, setForm] = useState({
        title: { ar: '', en: '' },
        description: { ar: '', en: '' },
        learning: [{ ar: '', en: '' }],
        requirement: [{ ar: '', en: '' }],
        main_axes: [],
        notes: '',
        sections: [{ title: { ar: '', en: '' } }],
        category_id: '',
        price: '',
        type: 'live',
        // Separate date fields for each type (matching create form structure)
        live_date_from: '',
        live_date_to: '',
        recorded_date_from: '',
        onsite_date_from: '',
        onsite_date_to: '',
        duration: '',
        time: '',
        have_certificate: false,
        status: 'active',
        level: '',
        user_type: 'student',
        address: '',            // for onsite programs
        url: '',               // for onsite programs
        image: null
    });

    // Update form when initial data loads
    useEffect(() => {
        if (initial) {
            setForm({
                title: initial.title || { ar: '', en: '' },
                description: initial.description || { ar: '', en: '' },
                learning: initial.learning?.length > 0 ? initial.learning : [{ ar: '', en: '' }],
                requirement: initial.requirement?.length > 0 ? initial.requirement : [{ ar: '', en: '' }],
                main_axes: initial.main_axes || [],
                notes: initial.notes || '',
                sections: Array.isArray(initial.sections) && initial.sections.length > 0 
                    ? initial.sections 
                    : [{ title: { ar: '', en: '' } }],
                category_id: initial.category_id || '',
                price: initial.price || '',
                type: initial.type || 'live',
                // ALWAYS set ALL date fields to ensure they exist in form state
                // Use empty string if not present or null/undefined
                live_date_from: (initial.live_date_from ?? '').toString(),
                live_date_to: (initial.live_date_to ?? '').toString(),
                recorded_date_from: (initial.recorded_date_from ?? '').toString(),
                onsite_date_from: (initial.onsite_date_from ?? '').toString(),
                onsite_date_to: (initial.onsite_date_to ?? '').toString(),
                duration: (initial.duration ?? '').toString(),
                time: (initial.time ?? '').toString(),
                have_certificate: initial.have_certificate || false,
                status: initial.status || 'active',
                level: initial.level || '',
                user_type: initial.user_type || 'student',
                address: (initial.address ?? '').toString(),
                url: (initial.url ?? '').toString(),
                image: null
            });
        }
    }, [initial]);

    const setField = (patch) => setForm((prev) => ({ ...prev, ...patch }));

    const updateItem = (key, idx, value, lang = null) => {
        const copy = [...form[key]];
        if (key === 'sections') {
            if (lang) {
                copy[idx] = { ...copy[idx], title: { ...copy[idx].title, [lang]: value } };
            } else {
                copy[idx] = { title: value };
            }
        } else if (lang) {
            copy[idx] = { ...copy[idx], [lang]: value };
        } else {
            copy[idx] = value;
        }
        setField({ [key]: copy });
    };

    const addItem = (key) => {
        if (key === 'sections') {
            setField({ [key]: [...form[key], { title: { ar: '', en: '' } }] });
        } else {
            setField({ [key]: [...form[key], { ar: '', en: '' }] });
        }
    };

    const removeItem = (key, idx) =>
        setField({ [key]: form[key].filter((_, i) => i !== idx) });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);

            // Only send image if user picked a new one (same as admin edit)
            // Don't try to fetch existing image - backend will keep it if no new one is provided
            const payload = {
                title: form.title,
                price: form.price,
                type: form.type, // service maps "recorded" -> "registered"
                description: form.description,
                category_id: form.category_id,
                have_certificate: form.have_certificate ? 1 : 0,
                status: form.status === 'active' ? 1 : 0,
                level: form.level || "",
                // Only include image if user selected a new file
                ...(form.image instanceof File && { image: form.image }),
                learning: Array.isArray(form.learning) ? form.learning : [],
                requirement: Array.isArray(form.requirement) ? form.requirement : [],
                main_axes: Array.isArray(form.main_axes) ? form.main_axes : [],
                notes: form.notes || "",
                sections: Array.isArray(form.sections) ? form.sections : [],
                user_type: form.user_type || "",
            };

            // For live programs, ensure date/time exist and send them
            if ((form.type || "").toLowerCase() === "live") {
                if (!form.live_date_from) throw new Error("يجب إدخال تاريخ البداية للبرنامج المباشر");
                if (!form.live_date_to) throw new Error("يجب إدخال تاريخ النهاية للبرنامج المباشر");
                if (!form.time) throw new Error("يجب إدخال وقت البرنامج المباشر");

                payload.date_from = form.live_date_from;
                payload.date_to = form.live_date_to;
                payload.time = (form.time || "").length === 5 ? `${form.time}:00` : form.time;
            }
            
            // For recorded programs, ensure duration exists (it will be sent in the general block below)
            if ((form.type || "").toLowerCase() === "recorded") {
                if (!form.duration || form.duration <= 0) throw new Error("يجب إدخال مدة البرنامج بالأيام");
                payload.date_from = form.recorded_date_from;
            }

            // Duration can be set for all program types - send if it exists and is a valid number > 0
            // For recorded programs, duration is already validated above, but we send it here for all types
            if (form.duration) {
                const durationNum = Number(form.duration);
                if (!isNaN(durationNum) && durationNum > 0) {
                    payload.duration = durationNum;
                }
            }
            
            // For onsite programs, ensure date fields and address exist and send them
            if ((form.type || "").toLowerCase() === "onsite") {
                if (!form.onsite_date_from) throw new Error("يجب إدخال تاريخ البداية للبرنامج الحضوري");
                if (!form.onsite_date_to) throw new Error("يجب إدخال تاريخ النهاية للبرنامج الحضوري");
                if (!form.address?.trim()) throw new Error("يجب إدخال عنوان المكان للبرنامج الحضوري");

                payload.date_from = form.onsite_date_from;
                payload.date_to = form.onsite_date_to;
                payload.address = form.address;
                payload.url = form.url || "";
            }

            await ProgramsService.update(id, payload);
            toast.success("تم تحديث البرنامج بنجاح");
            navigate("/teacher/courses");
        } catch (err) {
            console.error("Update program failed", err);
            
            // Handle validation errors
            if (err?.response?.data?.errors) {
                const errors = err.response.data.errors;
                const message = err.response.data.message || "Validation errors";
                
                // Show main error message
                toast.error(message);
                
                // Show individual field errors
                Object.entries(errors).forEach(([field, messages]) => {
                    if (Array.isArray(messages)) {
                        messages.forEach(msg => toast.error(`${field}: ${msg}`));
                    }
                });
            } else if (err?.response?.data?.message) {
                toast.error(err.response.data.message);
            } else if (err instanceof Error && err.message) {
                toast.error(err.message);
            } else {
                toast.error("حدث خطأ أثناء تحديث البرنامج");
            }
            
            // Re-throw the error so Form component can handle it too
            throw err;
        } finally {
            setSubmitting(false);
        }
    };

    if (!initial) return <div className="p-6">جاري التحميل…</div>;

    return (
        <div dir="rtl" className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">تعديل بيانات البرنامج</h1>
                {/* Show sections button only for program types that have sections (live and registered) */}
                {(form.type === 'live' || form.type === 'recorded' || form.type === 'registered') && (
                    <button
                        onClick={() => navigate(`/teacher/courses/${id}/sections`)}
                        className="px-4 py-2 bg-primary text-white rounded-lg"
                    >
                        إدارة الأقسام والجلسات
                    </button>
                )}
            </div>

            <div className="bg-white p-8 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-6">تعديل بيانات البرنامج</h2>
                
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Image */}
                    <div>
                        <label className="block text-sm font-medium mb-1">صورة البرنامج</label>
                        {imagePreview && (
                            <img src={imagePreview} alt="preview" className="w-28 h-28 object-cover rounded mb-3" />
                        )}
                        <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => setField({ image: e.target.files?.[0] || null })}
                        />
                    </div>

                    {/* Category */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">التخصص</label>
                            <select
                                value={form.category_id}
                                onChange={(e) => setField({ category_id: e.target.value })}
                                className="w-full border rounded px-3 py-2 border-gray-300"
                            >
                                <option value="">اختر التخصص</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.title}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Title */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">اسم البرنامج (عربي)</label>
                            <input
                                type="text"
                                value={form.title.ar}
                                onChange={(e) => setField({ title: { ...form.title, ar: e.target.value } })}
                                className="w-full border rounded px-3 py-2 border-gray-300"
                                placeholder="أدخل اسم البرنامج بالعربية"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">اسم البرنامج (إنجليزي)</label>
                            <input
                                type="text"
                                value={form.title.en}
                                onChange={(e) => setField({ title: { ...form.title, en: e.target.value } })}
                                className="w-full border rounded px-3 py-2 border-gray-300"
                                placeholder="أدخل اسم البرنامج بالإنجليزية"
                            />
                        </div>
                    </div>

                    {/* Price */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">السعر</label>
                            <input
                                type="number"
                                value={form.price}
                                onChange={(e) => setField({ price: e.target.value })}
                                className="w-full border rounded px-3 py-2 border-gray-300"
                                placeholder="أدخل السعر"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium mb-1">الوصف (عربي)</label>
                        <textarea
                            rows={3}
                            value={form.description.ar}
                            onChange={(e) => setField({ description: { ...form.description, ar: e.target.value } })}
                            className="w-full border rounded px-3 py-2 border-gray-300"
                            placeholder="أدخل الوصف بالعربية"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">الوصف (إنجليزي)</label>
                        <textarea
                            rows={3}
                            value={form.description.en}
                            onChange={(e) => setField({ description: { ...form.description, en: e.target.value } })}
                            className="w-full border rounded px-3 py-2 border-gray-300"
                            placeholder="أدخل الوصف بالإنجليزية"
                        />
                    </div>

                    {/* Main Axes */}
                    <div>
                        <div className="flex items-center justify-between">
                            <label className="block text-sm font-medium mb-2">المحاور الرئيسية في البرنامج</label>
                            <button type="button" onClick={() => addItem('main_axes')} className="text-primary text-sm">
                                + إضافة
                            </button>
                        </div>
                        {form.main_axes.map((item, i) => (
                            <div key={`axis-${i}`} className="space-y-2 mb-4 p-3 border border-gray-200 rounded">
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <label className="block text-xs text-gray-600 mb-1">العربية</label>
                                        <input
                                            type="text"
                                            value={item.ar}
                                            onChange={(e) => updateItem('main_axes', i, e.target.value, 'ar')}
                                            className="w-full border rounded px-3 py-2 border-gray-300"
                                            placeholder="أدخل المحور بالعربية"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs text-gray-600 mb-1">English</label>
                                        <input
                                            type="text"
                                            value={item.en}
                                            onChange={(e) => updateItem('main_axes', i, e.target.value, 'en')}
                                            className="w-full border rounded px-3 py-2 border-gray-300"
                                            placeholder="Enter main axis in English"
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <button type="button" onClick={() => removeItem('main_axes', i)} className="px-3 py-2 border rounded text-sm text-red-600 hover:bg-red-50">
                                            حذف
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Learning */}
                    <div>
                        <div className="flex items-center justify-between">
                            <label className="block text-sm font-medium mb-2">ما سيتعلمه في هذا البرنامج</label>
                            <button type="button" onClick={() => addItem('learning')} className="text-primary text-sm">
                                + إضافة
                            </button>
                        </div>
                        {form.learning.map((item, i) => (
                            <div key={`learn-${i}`} className="space-y-2 mb-4 p-3 border border-gray-200 rounded">
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <label className="block text-xs text-gray-600 mb-1">العربية</label>
                                        <input
                                            type="text"
                                            value={item.ar}
                                            onChange={(e) => updateItem('learning', i, e.target.value, 'ar')}
                                            className="w-full border rounded px-3 py-2 border-gray-300"
                                            placeholder="أدخل ما سيتعلمه بالعربية"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs text-gray-600 mb-1">English</label>
                                        <input
                                            type="text"
                                            value={item.en}
                                            onChange={(e) => updateItem('learning', i, e.target.value, 'en')}
                                            className="w-full border rounded px-3 py-2 border-gray-300"
                                            placeholder="Enter what will be learned in English"
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <button type="button" onClick={() => removeItem('learning', i)} className="px-3 py-2 border rounded text-sm text-red-600 hover:bg-red-50">
                                            حذف
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Requirements */}
                    <div>
                        <div className="flex items-center justify-between">
                            <label className="block text-sm font-medium mb-2">الفئه المستهدفه</label>
                            <button type="button" onClick={() => addItem('requirement')} className="text-primary text-sm">
                                + إضافة
                            </button>
                        </div>
                        {form.requirement.map((item, i) => (
                            <div key={`req-${i}`} className="space-y-2 mb-4 p-3 border border-gray-200 rounded">
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <label className="block text-xs text-gray-600 mb-1">العربية</label>
                                        <input
                                            type="text"
                                            value={item.ar}
                                            onChange={(e) => updateItem('requirement', i, e.target.value, 'ar')}
                                            className="w-full border rounded px-3 py-2 border-gray-300"
                                            placeholder="أدخل المتطلب بالعربية"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs text-gray-600 mb-1">English</label>
                                        <input
                                            type="text"
                                            value={item.en}
                                            onChange={(e) => updateItem('requirement', i, e.target.value, 'en')}
                                            className="w-full border rounded px-3 py-2 border-gray-300"
                                            placeholder="Enter requirement in English"
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <button type="button" onClick={() => removeItem('requirement', i)} className="px-3 py-2 border rounded text-sm text-red-600 hover:bg-red-50">
                                            حذف
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Type */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">البرنامج</label>
                            <select
                                value={form.type}
                                onChange={(e) => setField({ type: e.target.value })}
                                className="w-full border rounded px-3 py-2 border-gray-300"
                            >
                                <option value="live">برنامج مباشر</option>
                                <option value="recorded">برنامج مسجل</option>
                                <option value="onsite">برنامج حضوري</option>
                            </select>
                        </div>
                    </div>

                    {/* Live program fields */}
                    {form.type === 'live' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">تاريخ البداية</label>
                                <input
                                    type="date"
                                    value={form.live_date_from || ''}
                                    onChange={(e) => setField({ live_date_from: e.target.value })}
                                    className="w-full border rounded px-3 py-2 border-gray-300"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">تاريخ النهاية</label>
                                <input
                                    type="date"
                                    value={form.live_date_to || ''}
                                    onChange={(e) => setField({ live_date_to: e.target.value })}
                                    className="w-full border rounded px-3 py-2 border-gray-300"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">وقت البرنامج</label>
                                <input
                                    type="time"
                                    value={form.time || ''}
                                    onChange={(e) => setField({ time: e.target.value })}
                                    className="w-full border rounded px-3 py-2 border-gray-300"
                                    placeholder="07:00"
                                />
                            </div>
                        </div>
                    )}

                    {/* Recorded program fields */}
                    {form.type === 'recorded' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">تاريخ بداية التسجيل</label>
                                <input
                                    type="date"
                                    value={form.recorded_date_from || ''}
                                    onChange={(e) => setField({ recorded_date_from: e.target.value })}
                                    className="w-full border rounded px-3 py-2 border-gray-300"
                                />
                            </div>
                        </div>
                    )}

                    {/* Duration - appears for all program types */}
                    <div>
                        <label className="block text-sm font-medium mb-1">مدة البرنامج (بالأيام)</label>
                        <input
                            type="number"
                            min="1"
                            placeholder="أدخل عدد الأيام"
                            value={form.duration || ''}
                            onChange={(e) => setField({ duration: e.target.value })}
                            className="w-full border rounded px-3 py-2 border-gray-300"
                        />
                    </div>

                    {/* Onsite program fields */}
                    {form.type === 'onsite' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">تاريخ البداية</label>
                                <input
                                    type="date"
                                    value={form.onsite_date_from || ''}
                                    onChange={(e) => setField({ onsite_date_from: e.target.value })}
                                    className="w-full border rounded px-3 py-2 border-gray-300"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">تاريخ النهاية</label>
                                <input
                                    type="date"
                                    value={form.onsite_date_to || ''}
                                    onChange={(e) => setField({ onsite_date_to: e.target.value })}
                                    className="w-full border rounded px-3 py-2 border-gray-300"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">العنوان</label>
                                <input
                                    type="text"
                                    value={form.address || ''}
                                    onChange={(e) => setField({ address: e.target.value })}
                                    className="w-full border rounded px-3 py-2 border-gray-300"
                                    placeholder="أدخل عنوان المكان"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">رابط الموقع</label>
                                <input
                                    type="url"
                                    value={form.url || ''}
                                    onChange={(e) => setField({ url: e.target.value })}
                                    className="w-full border rounded px-3 py-2 border-gray-300"
                                    placeholder="https://maps.google.com/..."
                                />
                            </div>
                        </div>
                    )}

                    {/* Sections - For registered and live programs */}
                    {(form.type === 'recorded' || form.type === 'registered' || form.type === 'live') && (
                    <div>
                        <div className="flex items-center justify-between">
                            <label className="block text-sm font-medium mb-2">أقسام البرنامج (عناوين)</label>
                            <button type="button" onClick={() => addItem('sections')} className="text-primary text-sm">
                                + إضافة
                            </button>
                        </div>
                        {form.sections.map((s, i) => (
                            <div key={`sec-${i}`} className="space-y-2 mb-4 p-3 border border-gray-200 rounded">
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <label className="block text-xs text-gray-600 mb-1">العربية</label>
                                        <input
                                            type="text"
                                            value={s.title.ar}
                                            onChange={(e) => updateItem('sections', i, e.target.value, 'ar')}
                                            className="w-full border rounded px-3 py-2 border-gray-300"
                                            placeholder={`عنوان القسم #${i + 1} بالعربية`}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs text-gray-600 mb-1">English</label>
                                        <input
                                            type="text"
                                            value={s.title.en}
                                            onChange={(e) => updateItem('sections', i, e.target.value, 'en')}
                                            className="w-full border rounded px-3 py-2 border-gray-300"
                                            placeholder={`Section #${i + 1} title in English`}
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <button type="button" onClick={() => removeItem('sections', i)} className="px-3 py-2 border rounded text-sm text-red-600 hover:bg-red-50">
                                            حذف
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    )}

                    {/* Certificate */}
                    <div className="flex items-center gap-2">
                        <input
                            id="have_certificate"
                            type="checkbox"
                            checked={form.have_certificate}
                            onChange={(e) => setField({ have_certificate: e.target.checked })}
                        />
                        <label htmlFor="have_certificate">شهادة حضور؟</label>
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium mb-1">حالة البرنامج</label>
                        <select
                            value={form.status || 'active'}
                            onChange={(e) => setField({ status: e.target.value })}
                            className="w-full border rounded px-3 py-2 border-gray-300"
                        >
                            <option value="">اختر الحالة</option>
                            <option value="active">نشط</option>
                            <option value="inactive">غير نشط</option>
                        </select>
                    </div>

                    {/* Level */}
                    <div>
                        <label className="block text-sm font-medium mb-1">المستوى</label>
                        <select
                            value={form.level}
                            onChange={(e) => setField({ level: e.target.value })}
                            className="w-full border rounded px-3 py-2 border-gray-300"
                        >
                            <option value="">اختر المستوى</option>
                            <option value="مبتدئ">مبتدئ</option>
                            <option value="خبير">خبير</option>
                            <option value="متوسط">متوسط</option>
                            <option value="متقدم">متقدم</option>
                        </select>
                    </div>

                    {/* User Type */}
                    <div>
                        <label className="block text-sm font-medium mb-1">المستخدم المستهدف</label>
                        <select
                            value={form.user_type || 'student'}
                            onChange={(e) => setField({ user_type: e.target.value })}
                            className="w-full border rounded px-3 py-2 border-gray-300 bg-gray-100 cursor-not-allowed"
                            disabled={true}
                        >
                            <option value="student">طالب</option>
                        </select>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium mb-1">ملاحظات البرنامج</label>
                        <textarea
                            rows={4}
                            value={form.notes || ''}
                            onChange={(e) => setField({ notes: e.target.value })}
                            className="w-full border rounded px-3 py-2 border-gray-300"
                            placeholder="أدخل الملاحظات الخاصة بالبرنامج"
                        />
                    </div>

                    {/* Submit buttons */}
                    <div className="flex justify-end gap-3 pt-2">
                        <button 
                            type="button" 
                            onClick={() => navigate(-1)} 
                            className="px-4 py-2 border rounded"
                        >
                            إلغاء
                        </button>
                        <button 
                            type="submit" 
                            disabled={submitting} 
                            className="px-4 py-2 bg-primary text-white rounded disabled:opacity-60"
                        >
                            {submitting ? "جاري الإرسال..." : "إضافة برنامج"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
