// src/pages/dashboard/admin/Trainees/Create.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TraineesService from "../../../../services/admin/traineesService";
import toast from "react-hot-toast";

/** Filename-safe download from axios response (blob) */
const openBlobDownload = (response, fallbackName = 'download.xlsx') => {
    try {
        const blob = new Blob([response.data], {
            type: response.headers['content-type'] || 'application/octet-stream',
        });
        let filename = fallbackName;
        const cd = response.headers['content-disposition'];
        if (cd && typeof cd === 'string') {
            const match = cd.match(/filename\*?=(?:UTF-8'')?["']?([^;"']+)/i);
            if (match && match[1]) filename = decodeURIComponent(match[1]);
        }
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (e) {
        console.error(e);
        toast.error('تعذر تنزيل الملف.');
    }
};

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

export default function AdminTraineeCreate() {
    const nav = useNavigate();

    const [students, setStudents] = useState([]);
    const [studentId, setStudentId] = useState("");
    const [programs, setPrograms] = useState([]);
    const [selectedPrograms, setSelectedPrograms] = useState([]);
    const [file, setFile] = useState(null);
    const [saving, setSaving] = useState(false);
    
    // New form fields based on Postman structure
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: ""
    });

    // load dropdowns
    useEffect(() => {
        TraineesService.programsList()
            .then((res) => {
                const programsData = res?.data?.data || [];
                // Transform the data to extract Arabic titles from translations
                const transformedPrograms = programsData.map(program => {
                    const arTranslation = program.translations?.find(t => t.locale === 'ar') || program.translations?.[0] || {};
                    return {
                        id: program.id,
                        title: arTranslation.title || 'Untitled Program',
                        slug: program.slug
                    };
                });
                setPrograms(transformedPrograms);
            })
            .catch(() => toast.error("تعذّر تحميل قائمة البرامج"));

        TraineesService.studentsList()
            .then((res) => setStudents(res?.data?.data || []))
            .catch(() => toast.error("تعذّر تحميل قائمة المتدربين"));
    }, []);

    // Download Excel example
    const handleDownloadExample = async () => {
        try {
            const response = await TraineesService.getExcelSheet();
            openBlobDownload(response, 'trainees_template.xlsx');
            toast.success('تم تنزيل نموذج الملف بنجاح.');
        } catch (error) {
            console.error('Download example failed', error);
            toast.error('تعذر تحميل نموذج الملف. حاول مرة أخرى.');
        }
    };

    const submit = async (e) => {
        e.preventDefault();
        if (!studentId && !file && !formData.name) return toast.error("أدخل المتدرب أو ارفع ملفاً أو أدخل البيانات المطلوبة.");

        const fd = new FormData();
        if (studentId) fd.append("student_id", studentId);
        selectedPrograms.forEach((id) => fd.append("programs_id[]", id));
        if (file) fd.append("file", file);
        
        // Add new form fields
        if (formData.name) fd.append("name", formData.name);
        if (formData.phone) fd.append("phone", formData.phone);
        if (formData.email) fd.append("email", formData.email);

        setSaving(true);
        try {
            await TraineesService.create(fd);
            toast.success("تم إضافة المتدرب بنجاح");
            nav("/admin/trainees");
        } catch {
            toast.error("فشل حفظ البيانات");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-6 space-y-6" dir="rtl">
            <h1 className="text-2xl font-bold">إدارة المتدربين</h1>

            <form onSubmit={submit} className="bg-white p-6 rounded-lg shadow space-y-6">
                <h2 className="text-xl font-semibold">إضافة متدرب</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Program multi-select */}
                    <div>
                        <label className="block mb-2">اسم البرنامج</label>
                        <ProgramMultiSelect
                            options={programs}
                            value={selectedPrograms}
                            onChange={setSelectedPrograms}
                        />
                    </div>

                    {/* 🔹 Student dropdown */}
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
                    <h3 className="text-lg font-semibold mb-4">أو إضافة متدرب جديد</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                {/* Bulk upload */}
                <div>
                    <label className="block mb-2">إضافة مجموعة متدربين</label>
                    <div className="border-2 border-dashed rounded-lg p-6 text-center text-gray-500">
                        <input
                            type="file"
                            accept=".xls,.xlsx"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                        />
                        <p className="text-xs mt-2">ملحوظة: يُرجى تقديم الملف بصيغة Excel (xls, xlsx)</p>
                        <div className="mt-3">
                            <button 
                                type="button"
                                onClick={handleDownloadExample}
                                className="text-primary hover:underline text-sm"
                            >
                                تحميل نموذج الملف
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <button type="button" onClick={() => nav(-1)} className="px-6 py-2 bg-gray-100 rounded-lg">
                        تجاهل
                    </button>
                    <button type="submit" disabled={saving} className="px-6 py-2 bg-primary text-white rounded-lg">
                        {saving ? "جاري الحفظ..." : "إضافة متدرب"}
                    </button>
                </div>
            </form>
        </div>
    );
}
