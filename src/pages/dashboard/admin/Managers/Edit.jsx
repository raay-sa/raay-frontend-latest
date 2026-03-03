// src/pages/dashboard/admin/Managers/Edit.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ManagersService } from "../../../../services/managersService";
import { toast } from "react-hot-toast";
import PageSkeleton from "../../../../components/Loaders/PageSkeleton";

export default function ManagerEdit() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
        password_confirmation: "",
    });
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [fieldErrors, setFieldErrors] = useState({});

    // Fetch manager data on mount
    useEffect(() => {
        const fetchManager = async () => {
            try {
                setFetching(true);
                const res = await ManagersService.get(id);
                const manager = res?.data?.row || res?.data?.data || res?.data;

                if (manager) {
                    setForm({
                        name: manager.name || manager.full_name || "",
                        email: manager.email || "",
                        phone: manager.phone || "",
                        password: "",
                        password_confirmation: "",
                    });
                }
            } catch (err) {
                console.error("Failed to fetch manager", err);
                toast.error("تعذر تحميل بيانات المدير");
                navigate("/admin/managers");
            } finally {
                setFetching(false);
            }
        };

        if (id) {
            fetchManager();
        }
    }, [id, navigate]);

    const extractErrors = (err) => {
        const data = err?.response?.data;
        const errors = data?.errors || {};
        const message = data?.message || "حدث خطأ أثناء التحديث";
        return { errors, message };
    };

    const handleChange = (field) => (e) => {
        const value = e.target.value;
        setForm(prev => ({ ...prev, [field]: value }));
        // Clear server error for this field on change
        if (fieldErrors[field]) {
            setFieldErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFieldErrors({});

        // Basic validation
        if (!form.name?.trim()) {
            setFieldErrors({ name: ["يرجى إدخال الاسم"] });
            return toast.error("يرجى إدخال الاسم");
        }
        if (!form.email?.trim()) {
            setFieldErrors({ email: ["يرجى إدخال البريد الإلكتروني"] });
            return toast.error("يرجى إدخال البريد الإلكتروني");
        }
        // Password is optional on update, but if provided, must match confirmation
        if (form.password && form.password !== form.password_confirmation) {
            setFieldErrors({ password_confirmation: ["كلمة المرور غير متطابقة"] });
            return toast.error("كلمة المرور غير متطابقة");
        }

        setLoading(true);
        try {
            // Only include password fields if password is provided
            const updateData = {
                name: form.name.trim(),
                email: form.email.trim(),
                phone: form.phone?.trim() || "",
            };
            
            if (form.password?.trim()) {
                updateData.password = form.password.trim();
                updateData.password_confirmation = form.password_confirmation.trim();
            }

            await ManagersService.update(id, updateData);
            toast.success("تم تحديث المدير بنجاح");
            navigate("/admin/managers");
        } catch (err) {
            const { errors, message } = extractErrors(err);
            setFieldErrors(errors);
            const firstError = 
                (errors?.name && errors.name[0]) ||
                (errors?.email && errors.email[0]) ||
                (errors?.phone && errors.phone[0]) ||
                (errors?.password && errors.password[0]) ||
                message;
            toast.error(firstError);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const hasError = (field) => Array.isArray(fieldErrors?.[field]) && fieldErrors[field].length > 0;

    if (fetching) {
        return <PageSkeleton />;
    }

    return (
        <div className="p-6 space-y-6" dir="rtl">
            <h1 className="text-2xl font-bold">تعديل مدير</h1>

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md max-w-2xl space-y-5">
                <div>
                    <label className="block font-medium mb-2">الاسم *</label>
                    <input
                        type="text"
                        value={form.name}
                        onChange={handleChange("name")}
                        placeholder="أدخل الاسم"
                        className={`w-full border px-3 py-2 rounded ${hasError("name") ? "border-red-500" : "border-gray-300"}`}
                        required
                    />
                    {hasError("name") && (
                        <p className="text-red-600 text-sm mt-1">{fieldErrors.name[0]}</p>
                    )}
                </div>

                <div>
                    <label className="block font-medium mb-2">البريد الإلكتروني *</label>
                    <input
                        type="email"
                        value={form.email}
                        onChange={handleChange("email")}
                        placeholder="أدخل البريد الإلكتروني"
                        className={`w-full border px-3 py-2 rounded ${hasError("email") ? "border-red-500" : "border-gray-300"}`}
                        required
                    />
                    {hasError("email") && (
                        <p className="text-red-600 text-sm mt-1">{fieldErrors.email[0]}</p>
                    )}
                </div>

                <div>
                    <label className="block font-medium mb-2">الهاتف</label>
                    <input
                        type="tel"
                        value={form.phone}
                        onChange={handleChange("phone")}
                        placeholder="أدخل رقم الهاتف"
                        className={`w-full border px-3 py-2 rounded ${hasError("phone") ? "border-red-500" : "border-gray-300"}`}
                    />
                    {hasError("phone") && (
                        <p className="text-red-600 text-sm mt-1">{fieldErrors.phone[0]}</p>
                    )}
                </div>

                <div>
                    <label className="block font-medium mb-2">كلمة المرور الجديدة (اتركها فارغة إذا لم ترد تغييرها)</label>
                    <input
                        type="password"
                        value={form.password}
                        onChange={handleChange("password")}
                        placeholder="أدخل كلمة المرور الجديدة"
                        className={`w-full border px-3 py-2 rounded ${hasError("password") ? "border-red-500" : "border-gray-300"}`}
                    />
                    {hasError("password") && (
                        <p className="text-red-600 text-sm mt-1">{fieldErrors.password[0]}</p>
                    )}
                </div>

                {form.password && (
                    <div>
                        <label className="block font-medium mb-2">تأكيد كلمة المرور الجديدة</label>
                        <input
                            type="password"
                            value={form.password_confirmation}
                            onChange={handleChange("password_confirmation")}
                            placeholder="أعد إدخال كلمة المرور الجديدة"
                            className={`w-full border px-3 py-2 rounded ${hasError("password_confirmation") ? "border-red-500" : "border-gray-300"}`}
                        />
                        {hasError("password_confirmation") && (
                            <p className="text-red-600 text-sm mt-1">{fieldErrors.password_confirmation[0]}</p>
                        )}
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-primary text-white px-4 py-2 rounded disabled:opacity-60"
                    >
                        {loading ? "جاري التحديث..." : "تحديث"}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate("/admin/managers")}
                        className="px-4 py-2 border rounded"
                    >
                        إلغاء
                    </button>
                </div>
            </form>
        </div>
    );
}

