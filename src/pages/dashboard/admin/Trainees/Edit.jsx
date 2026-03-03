// src/pages/dashboard/admin/Trainees/Edit.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import TraineesService from "../../../../services/admin/traineesService";
import { ProgramsService } from "../../../../services/programsService";
import toast from "react-hot-toast";

function ProgramMultiSelect({ options, value, onChange }) {
    const [open, setOpen] = useState(false);
    const toggle = (id) =>
        value.includes(id)
            ? onChange(value.filter((x) => x !== id))
            : onChange([...value, id]);

    return (
        <div className="relative w-full">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="w-full border rounded-lg px-4 py-2 flex items-center justify-between"
            >
                <span className="truncate">
                    {value.length
                        ? options
                            .filter((o) => value.includes(o.id))
                            .map((o) => o.title)
                            .join("، ")
                        : "اختر اسم البرنامج"}
                </span>
                <span>▾</span>
            </button>

            {open && (
                <div className="absolute z-20 mt-2 w-full bg-white border rounded-lg shadow p-3 max-h-60 overflow-auto">
                    {options.map((opt) => (
                        <label key={opt.id} className="flex items-center justify-between py-2 cursor-pointer">
                            <span className="text-sm">{opt.title}</span>
                            <input
                                type="checkbox"
                                checked={value.includes(opt.id)}
                                onChange={() => toggle(opt.id)}
                            />
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function AdminTraineeEdit() {
    const { id } = useParams(); // subscription id / row id (as used in list)
    const nav = useNavigate();

    const [students, setStudents] = useState([]);
    const [studentId, setStudentId] = useState(""); // dropdown value
    const [programs, setPrograms] = useState([]);
    const [selectedPrograms, setSelectedPrograms] = useState([]);
    const [saving, setSaving] = useState(false);
    
    // New form fields based on Postman structure
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: ""
    });

    // Load dropdowns
    useEffect(() => {
        ProgramsService.list(1, {})
            .then((res) => setPrograms(res?.data?.data || []))
            .catch(() => toast.error("تعذّر تحميل قائمة البرامج"));

        TraineesService.studentsList()
            .then((res) => setStudents(res?.data?.data || []))
            .catch(() => toast.error("تعذّر تحميل قائمة المتدربين"));
    }, []);

    // Load current row (⚠️ new shape: { id, name, subscriptions: [{ program_id, ...}] })
    useEffect(() => {
        (async () => {
            try {
                const res = await TraineesService.show(id);
                const row = res?.data?.data || {};

                // student dropdown selection
                setStudentId(String(row.id ?? ""));

                // programs from subscriptions
                const subs = Array.isArray(row.subscriptions) ? row.subscriptions : [];
                setSelectedPrograms(subs.map((s) => s.program_id));
                
                // Load form data if available
                if (row.name || row.phone || row.email) {
                    setFormData({
                        name: row.name || "",
                        phone: row.phone || "",
                        email: row.email || ""
                    });
                }
            } catch {
                toast.error("فشل تحميل بيانات المتدرب");
            }
        })();
    }, [id]);

    const submit = async (e) => {
        e.preventDefault();

        const fd = new FormData();
        fd.append("_method", "PUT");
        if (studentId) fd.append("student_id", studentId);
        selectedPrograms.forEach((pid) => fd.append("programs_id[]", pid));
        
        // Add new form fields
        if (formData.name) fd.append("name", formData.name);
        if (formData.phone) fd.append("phone", formData.phone);
        if (formData.email) fd.append("email", formData.email);

        setSaving(true);
        try {
            await TraineesService.update(id, fd);
            toast.success("تم تحديث بيانات المتدرب");
            nav("/admin/trainees");
        } catch {
            toast.error("فشل حفظ التعديلات");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-3 lg:p-6 space-y-4 lg:space-y-6" dir="rtl">
            <h1 className="text-xl lg:text-2xl font-bold">إدارة المتدربين</h1>

            <form onSubmit={submit} className="bg-white p-3 sm:p-6 rounded-lg shadow space-y-4 lg:space-y-6">
                <h2 className="text-lg sm:text-xl font-semibold">تعديل بيانات المتدرب</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    {/* Programs multi-select */}
                    <div>
                        <label className="block mb-2">اسم البرنامج</label>
                        <ProgramMultiSelect
                            options={programs}
                            value={selectedPrograms}
                            onChange={setSelectedPrograms}
                        />
                    </div>

                    {/* Student dropdown */}
                    <div>
                        <label className="block mb-2">اختيار متدرب موجود</label>
                        <select
                            className="w-full border rounded-lg px-4 py-2"
                            value={studentId}
                            onChange={(e) => setStudentId(e.target.value)}
                        >
                            <option value="">اختر المتدرب</option>
                            {students.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* New form fields section */}
                <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold mb-4">تعديل بيانات المتدرب</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                        <div>
                            <label className="block mb-2">اسم المتدرب</label>
                            <input
                                type="text"
                                className="w-full border rounded-lg px-4 py-2"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                placeholder="أدخل اسم المتدرب"
                            />
                        </div>
                        <div>
                            <label className="block mb-2">رقم الهاتف</label>
                            <input
                                type="tel"
                                className="w-full border rounded-lg px-4 py-2"
                                value={formData.phone}
                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                placeholder="أدخل رقم الهاتف"
                            />
                        </div>
                        <div>
                            <label className="block mb-2">البريد الإلكتروني</label>
                            <input
                                type="email"
                                className="w-full border rounded-lg px-4 py-2"
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                placeholder="أدخل البريد الإلكتروني"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-3">
                    <button type="button" onClick={() => nav(-1)} className="px-4 sm:px-6 py-2 bg-gray-100 rounded-lg text-sm sm:text-base">
                        تجاهل
                    </button>
                    <button type="submit" disabled={saving} className="px-4 sm:px-6 py-2 bg-primary text-white rounded-lg text-sm sm:text-base">
                        {saving ? "جاري الحفظ..." : "حفظ"}
                    </button>
                </div>
            </form>
        </div>
    );
}
