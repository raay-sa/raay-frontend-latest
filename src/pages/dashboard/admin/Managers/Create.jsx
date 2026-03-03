// src/pages/dashboard/admin/Managers/Create.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ManagersService } from "../../../../services/managersService";
import { toast } from "react-hot-toast";

export default function ManagerCreate() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    
    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
        password_confirmation: "",
    });

    const extractErrors = (err) => {
        const data = err?.response?.data;
        const errors = data?.errors || {};
        const message = data?.message || "حدث خطأ أثناء الإضافة";
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
        if (!form.password?.trim()) {
            setFieldErrors({ password: ["يرجى إدخال كلمة المرور"] });
            return toast.error("يرجى إدخال كلمة المرور");
        }
        if (form.password !== form.password_confirmation) {
            setFieldErrors({ password_confirmation: ["كلمة المرور غير متطابقة"] });
            return toast.error("كلمة المرور غير متطابقة");
        }

        setLoading(true);
        try {
            await ManagersService.create(form);
            toast.success("تمت إضافة المدير بنجاح");
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

    return (
        <div className="p-6 space-y-6" dir="rtl">
            <h1 className="text-2xl font-bold">إضافة مدير</h1>

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
                    <label className="block font-medium mb-2">كلمة المرور *</label>
                    <input
                        type="password"
                        value={form.password}
                        onChange={handleChange("password")}
                        placeholder="أدخل كلمة المرور"
                        className={`w-full border px-3 py-2 rounded ${hasError("password") ? "border-red-500" : "border-gray-300"}`}
                        required
                    />
                    {hasError("password") && (
                        <p className="text-red-600 text-sm mt-1">{fieldErrors.password[0]}</p>
                    )}
                </div>

                <div>
                    <label className="block font-medium mb-2">تأكيد كلمة المرور *</label>
                    <input
                        type="password"
                        value={form.password_confirmation}
                        onChange={handleChange("password_confirmation")}
                        placeholder="أعد إدخال كلمة المرور"
                        className={`w-full border px-3 py-2 rounded ${hasError("password_confirmation") ? "border-red-500" : "border-gray-300"}`}
                        required
                    />
                    {hasError("password_confirmation") && (
                        <p className="text-red-600 text-sm mt-1">{fieldErrors.password_confirmation[0]}</p>
                    )}
                </div>

                <div className="flex gap-3">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-primary text-white px-4 py-2 rounded disabled:opacity-60"
                    >
                        {loading ? "جاري الحفظ..." : "حفظ"}
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

