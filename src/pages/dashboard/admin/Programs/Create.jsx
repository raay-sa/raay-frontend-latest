import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Form from "../../../../components/Form";
import { ProgramsService } from "../../../../services/programsService";
import toast from "react-hot-toast";


export default function AdminCreateProgram() {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [selectedTeacherId, setSelectedTeacherId] = useState("");

    useEffect(() => {
        (async () => {
            try {
                // Load teachers only
                const tRes = await ProgramsService.getTeacherList();
                const teachersList = tRes?.data?.data || tRes?.data || [];
                setTeachers(Array.isArray(teachersList) ? teachersList : []);
            } catch (e) {
                console.error("Failed to load teachers", e);
                toast.error("تعذر تحميل قائمة المدربين");
            }
        })();
    }, []);

    const loadTeacherCategories = useCallback(async (teacherId) => {
        if (!teacherId) {
            setCategories([]);
            return;
        }

        try {
            setLoadingCategories(true);
            const response = await ProgramsService.getTeacherCategories(teacherId);
            const responseData = response.data;
            
            if (responseData.success && Array.isArray(responseData.data)) {
                const processedCategories = responseData.data.map(category => ({
                    id: category.id,
                    title: category.translations?.find(t => t.locale === 'ar')?.title || 
                           category.translations?.find(t => t.locale === 'en')?.title || 
                           'بدون عنوان'
                }));
                setCategories(processedCategories);
            } else {
                setCategories([]);
            }
        } catch (e) {
            console.error("Failed to load teacher categories", e);
            toast.error("تعذر تحميل تخصصات المدرب");
            setCategories([]);
        } finally {
            setLoadingCategories(false);
        }
    }, []);

    const handleFormValuesChange = useCallback((values) => {
        const currentTeacherId = values.teacher_id || "";
        setSelectedTeacherId(currentTeacherId);
        
        // Load categories when teacher changes
        if (currentTeacherId && currentTeacherId !== selectedTeacherId) {
            loadTeacherCategories(currentTeacherId);
        } else if (!currentTeacherId) {
            setCategories([]);
        }
    }, [selectedTeacherId, loadTeacherCategories]);

    const fields = useMemo(
        () => [
            { name: "image", type: "file", label: "صورة البرنامج", validation: { required: "الصورة مطلوبة" }, fullWidth: true },
            {
                name: "teacher_id",
                label: "المعلم",
                type: "select",
                options: [{ value: "", label: "اختر المعلم" }, ...teachers.map((t) => ({ value: String(t.id), label: t.name }))],
                validation: { required: "اختر المعلم" },
            },
            {
                name: "category_id",
                label: "التخصص",
                type: "select",
                options: [
                    { 
                        value: "", 
                        label: loadingCategories 
                            ? "جاري التحميل..." 
                            : !selectedTeacherId 
                                ? "اختر المعلم أولاً" 
                                : categories.length === 0 
                                    ? "لا توجد تخصصات متاحة لهذا المدرب" 
                                    : "اختر التخصص" 
                    }, 
                    ...categories.map((c) => ({ value: String(c.id), label: c.title }))
                ],
                validation: { required: "اختر التخصص" },
                disabled: !selectedTeacherId || categories.length === 0 || loadingCategories,
            },
            { name: "title_ar", label: "اسم البرنامج (عربي)", placeholder: "أدخل اسم البرنامج بالعربية", validation: { required: "أدخل الاسم بالعربية" } },
            { name: "title_en", label: "اسم البرنامج (إنجليزي)", placeholder: "أدخل اسم البرنامج بالإنجليزية" },
            { name: "price", label: "السعر", type: "number", placeholder: "أدخل السعر", validation: { required: "أدخل السعر" } },
            { name: "description_ar", label: "الوصف (عربي)", type: "textarea", placeholder: "أدخل الوصف بالعربية", rows: 3 },
            { name: "description_en", label: "الوصف (إنجليزي)", type: "textarea", placeholder: "أدخل الوصف بالإنجليزية", rows: 3 },

            // تعلم/متطلبات
            { name: "main_axes", label: "المحاور الرئيسية في البرنامج", type: "translation-repeater", fullWidth: true },
            { name: "learning", label: "ما سيتعلمه في هذا البرنامج", type: "translation-repeater", fullWidth: true },
            { name: "requirement", label: "الفئه المستهدفه", type: "translation-repeater", fullWidth: true },

            // نوع البرنامج
            {
                name: "type",
                label: "البرنامج",
                options: [
                    { value: "live", label: "برنامج مباشر" },
                    { value: "registered", label: "برنامج مسجل" },
                    { value: "onsite", label: "برنامج حضوري" },
                ],
                validation: { required: "اختر نوع البرنامج" },
            },

            // تظهر فقط للنوع المباشر
            { name: "live_date_from", label: "تاريخ البداية", type: "date", showWhen: (v) => (v?.type || "").toLowerCase() === "live" },
            { name: "live_date_to", label: "تاريخ النهاية", type: "date", showWhen: (v) => (v?.type || "").toLowerCase() === "live" },
            { name: "time", label: "وقت البرنامج", type: "time", placeholder: "07:00", showWhen: (v) => (v?.type || "").toLowerCase() === "live" },

            // تظهر فقط للنوع المسجل
            { name: "registered_date_from", label: "تاريخ بداية التسجيل", type: "date", showWhen: (v) => (v?.type || "").toLowerCase() === "registered" },
            { name: "duration", label: "مدة البرنامج (بالأيام)", type: "number", placeholder: "أدخل عدد الأيام" },

            // تظهر فقط للنوع الحضوري
            { name: "onsite_date_from", label: "تاريخ البداية", type: "date", showWhen: (v) => (v?.type || "").toLowerCase() === "onsite" },
            { name: "onsite_date_to", label: "تاريخ النهاية", type: "date", showWhen: (v) => (v?.type || "").toLowerCase() === "onsite" },
            { name: "address", label: "العنوان", type: "text", placeholder: "أدخل عنوان المكان", showWhen: (v) => (v?.type || "").toLowerCase() === "onsite" },
            { name: "url", label: "رابط الموقع", type: "url", placeholder: "https://maps.google.com/...", showWhen: (v) => (v?.type || "").toLowerCase() === "onsite" },

            // الأقسام مرئية في النوع المسجل والمباشر
            { name: "sections", label: "أقسام البرنامج (عناوين)", type: "translation-repeater", fullWidth: true, showWhen: (v) => (v?.type || "").toLowerCase() === "registered" || (v?.type || "").toLowerCase() === "live" },

            { name: "have_certificate", label: "شهادة حضور؟", type: "checkbox" },
            {
                name: "status", label: "حالة البرنامج", type: "select",
                options: [
                    { value: "", label: "اختر الحالة" },
                    { value: "active", label: "نشط" },
                    { value: "inactive", label: "غير نشط" }
                ],
            },
            {
                name: "level",
                label: "المستوى",
                options: [
                    { value: "", label: "اختر المستوى" },
                    { value: "مبتدئ", label: "مبتدئ" },
                    { value: "متوسط", label: "متوسط" },
                    { value: "متقدم", label: "متقدم" },
                    { value: "خبير", label: "خبير" },
                ],
            },

            // نوع المستخدم المستهدف
            {
                name: "user_type",
                label: "المستخدم المستهدف",
                type: "select",
                options: [
                    { value: "student", label: "طالب" },
                ],
                validation: { required: "اختر نوع المستخدم" },
                disabled: true,
            },
            { name: "notes", label: "ملاحظات البرنامج", type: "textarea", placeholder: "أدخل الملاحظات الخاصة بالبرنامج", rows: 4, fullWidth: true },
        ],
        [categories, teachers, loadingCategories, selectedTeacherId]
    );

    const handleSubmit = async (data) => {
        try {
            setSubmitting(true);

            const payload = {
                title: {
                    ar: data.title_ar || "",
                    en: data.title_en || ""
                },
                price: data.price,
                type: data.type,
                description: {
                    ar: data.description_ar || "",
                    en: data.description_en || ""
                },
                category_id: data.category_id,
                teacher_id: data.teacher_id,
                have_certificate: data.have_certificate ? 1 : 0,
                status: data.status === "active" ? 1 : 0,
                level: data.level || "",
                image: data.image?.[0] || null,
                learning: Array.isArray(data.learning) && data.learning.length > 0
                    ? data.learning.filter(item => item.ar?.trim() || item.en?.trim())
                    : [{ ar: "", en: "" }],
                requirement: Array.isArray(data.requirement) && data.requirement.length > 0
                    ? data.requirement.filter(item => item.ar?.trim() || item.en?.trim())
                    : [{ ar: "", en: "" }],
                main_axes: Array.isArray(data.main_axes) && data.main_axes.length > 0
                    ? data.main_axes.filter(item => item.ar?.trim() || item.en?.trim())
                    : [],
                notes: data.notes || "",
                sections: Array.isArray(data.sections) && data.sections.length > 0
                    ? data.sections.filter(section => section.ar?.trim() || section.en?.trim()).map(section => ({
                        title: {
                            ar: section.ar || "",
                            en: section.en || ""
                        }
                    }))
                    : [{ title: { ar: "", en: "" } }],
                user_type: data.user_type || "",
            };

            // For live programs, ensure date/time exist and send them
            if ((data.type || "").toLowerCase() === "live") {
                if (!data.live_date_from) throw new Error("يجب إدخال تاريخ البداية للبرنامج المباشر");
                if (!data.live_date_to) throw new Error("يجب إدخال تاريخ النهاية للبرنامج المباشر");
                if (!data.time) throw new Error("يجب إدخال وقت البرنامج المباشر");

                payload.date_from = data.live_date_from;
                payload.date_to = data.live_date_to;
                payload.time = (data.time || "").length === 5 ? `${data.time}:00` : data.time;
            }

            // For registered programs, ensure duration exists (it will be sent in the general block below)
            if ((data.type || "").toLowerCase() === "registered") {
                if (!data.duration || data.duration <= 0) throw new Error("يجب إدخال مدة البرنامج بالأيام");
                payload.date_from = data.registered_date_from;
            }

            // Duration can be set for all program types - send if it exists and is a valid number > 0
            // For registered programs, duration is already validated above, but we send it here for all types
            if (data.duration) {
                const durationNum = Number(data.duration);
                if (!isNaN(durationNum) && durationNum > 0) {
                    payload.duration = durationNum;
                }
            }

            // For onsite programs, ensure date fields and address exist and send them
            if ((data.type || "").toLowerCase() === "onsite") {
                if (!data.onsite_date_from) throw new Error("يجب إدخال تاريخ البداية للبرنامج الحضوري");
                if (!data.onsite_date_to) throw new Error("يجب إدخال تاريخ النهاية للبرنامج الحضوري");
                if (!data.address?.trim()) throw new Error("يجب إدخال عنوان المكان للبرنامج الحضوري");

                payload.date_from = data.onsite_date_from;
                payload.date_to = data.onsite_date_to;
                payload.address = data.address;
                payload.url = data.url || "";
            }

            const res = await ProgramsService.create(payload);

            const newId =
                res?.data?.data?.id ??
                res?.data?.id ??
                res?.id;
            if (!newId) {
                toast.success("تم إنشاء البرنامج بنجاح");
                navigate("/admin/programs");
                return;
            }
            toast.success("تم إنشاء البرنامج بنجاح");
            navigate(`/admin/programs`);

        } catch (err) {
            console.error("Create program failed", err);

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
                toast.error("حدث خطأ أثناء إنشاء البرنامج");
            }

            // Re-throw the error so Form component can handle it too
            throw err;
        } finally {
            setSubmitting(false);
        }
    };

    const initialValues = useMemo(
        () => ({
            category_id: "",
            teacher_id: "",
            type: "live", // default live (so date/time initially visible)
            date_from: "",
            date_to: "",
            time: "",
            start_date: "",
            duration: "",
            have_certificate: true,
            status: "",
            level: "",
            learning: [],
            requirement: [],
            main_axes: [],
            sections: [],
            user_type: "student",
            notes: "",
        }),
        []
    );

    return (
        <div dir="rtl" className="p-6">
            <h1 className="text-2xl font-bold mb-6">إدارة البرامج التدريبية</h1>
            <div className="bg-white p-8 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-6">إضافة برنامج</h2>
                <Form
                    fields={fields}
                    initialValues={initialValues}
                    statusOptions={[
                        { value: "", label: "اختر الحالة" },
                        { value: "active", label: "نشط" },
                        { value: "inactive", label: "غير نشط" }
                    ]}
                    onSubmit={handleSubmit}
                    onCancel={() => navigate(-1)}
                    submitLabel={submitting ? "جاري الإرسال..." : "إضافة برنامج"}
                    onValuesChange={handleFormValuesChange}
                />
            </div>
        </div>
    );
}
