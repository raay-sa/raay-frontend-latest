// src/components/settings/TermsTab.jsx
import React, { useEffect, useState } from 'react';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { TermsService } from '../../services/termsService';
import TeacherSettingsService from '../../services/teacher/settingsService';
import StudentSettingsService from '../../services/student/settingsService';
import toast from 'react-hot-toast';

export default function TermsTab({ role = 'student' }) {
    const isAdmin = role === 'admin';

    const [mode, setMode] = useState('list');
    const [target, setTarget] = useState('student');
    const [terms, setTerms] = useState([]);
    const [inactiveTerms, setInactiveTerms] = useState([]);

    const [form, setForm] = useState({
        title: '',
        content: '',
        type: 'terms',
        users_type: [],
        status: '1',
    });
    const [editId, setEditId] = useState(null);

    const fetchTermsAdmin = async () => {
        try {
            const [activeRes, inactiveRes] = await Promise.all([
                TermsService.list({ users_type: target, status: 1 }),
                TermsService.list({ users_type: target, status: 0 })                
            ]);
            setTerms(activeRes?.data?.data || []);
            setInactiveTerms(inactiveRes?.data?.data || []);
        } catch {
            toast.error('حدث خطأ أثناء جلب البيانات');
        }
    };

    const fetchTermsTeacher = async () => {
        try {
            const res = await TeacherSettingsService.getTerms();
            setTerms(res?.data?.data || []);
        } catch {
            toast.error('حدث خطأ أثناء جلب البيانات');
        }
    };

    useEffect(() => {
        if (isAdmin) {
            fetchTermsAdmin();
        } else if (role === 'teacher') {
            fetchTermsTeacher();
        } else {
            StudentSettingsService.getTerms()
                .then(res => setTerms(res?.data?.data || []))
                .catch(() => setTerms([]));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [role, isAdmin, target]);

    const handleChange = (e) => {
        const { name, value, checked } = e.target;
        if (name === 'users_type') {
            setForm((prev) => {
                const updated = checked
                    ? [...prev.users_type, value]
                    : prev.users_type.filter((t) => t !== value);
                return { ...prev, users_type: updated };
            });
        } else {
            setForm((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleEdit = async (term) => {
        try {
            const res = await TermsService.show(term.id);
            const row = res?.data?.row;
            setForm({
                title: row.title,
                content: row.content,
                type: row.type,
                users_type: Array.isArray(row.users_type) ? row.users_type : JSON.parse(row.users_type || '[]'),
                status: String(row.status),
            });
            setEditId(row.id);
            setMode('edit');
        } catch {
            toast.error('فشل في تحميل البيانات');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('title', form.title);
        formData.append('content', form.content);
        formData.append('type', form.type);
        formData.append('status', form.status);
        form.users_type.forEach((type) => formData.append('users_type[]', type));

        try {
            if (editId) {
                formData.append('_method', 'put');
                await TermsService.update(editId, formData);
                toast.success('تم التحديث بنجاح');
            } else {
                await TermsService.create(formData);
                toast.success('تمت الإضافة بنجاح');
            }
            setForm({ title: '', content: '', type: 'terms', users_type: [], status: '1' });
            setEditId(null);
            setMode('list');
            fetchTermsAdmin();
        } catch {
            toast.error('فشل في حفظ البيانات');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('هل أنت متأكد من الحذف؟')) return;
        try {
            await TermsService.delete(id);
            toast.success('تم الحذف بنجاح');
            fetchTermsAdmin();
        } catch {
            toast.error('فشل في الحذف');
        }
    };

    const handleDownloadPdf = (id) => {
        TermsService.downloadPdf(id)
            .then((res) => {
                const url = window.URL.createObjectURL(new Blob([res.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'term.pdf');
                document.body.appendChild(link);
                link.click();
            })
            .catch(() => toast.error('فشل تحميل النسخة'));
    };

    if (!isAdmin) {
        return (
            <div className="space-y-6">
                <h1 className="text-3xl font-bold mb-4">الشروط والأحكام</h1>
                {terms.map((item) => (
                    <div key={item.id} className="bg-white p-6 text-gray-700 leading-relaxed">
                        <p className="font-semibold mb-3">{item.title}</p>
                        {item.content}
                    </div>
                ))}
                {terms.length === 0 && (
                    <div className="bg-white p-6 text-gray-500">لا توجد شروط متاحة حالياً.</div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">الشروط والأحكام</h1>
                <div className="flex gap-4">
                    {mode === 'list' && (
                        <select
                            value={target}
                            onChange={(e) => setTarget(e.target.value)}
                            className="border px-5 py-3 bg-secondary rounded-lg"
                        >
                            <option value="student">المتدرب</option>
                            <option value="teacher">الخبير</option>
                        </select>
                    )}
                    {mode === 'list' && (
                        <button
                            onClick={() => setMode('create')}
                            className="bg-primary text-white px-4 py-2 rounded-md flex items-center gap-2"
                        >
                            <FaPlus /> إضافة شروط
                        </button>
                    )}
                </div>
            </div>

            {mode === 'list' && (
                <>
                    <div className="space-y-6">
                        {terms.map((item) => (
                            <div key={item.id} className="border p-4 rounded bg-white">
                                <div className="flex justify-between items-center mb-2">
                                    <p className="font-bold">{item.title}</p>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEdit(item)} className="text-white bg-primary px-2 py-2 rounded-lg">
                                            <FaEdit />
                                        </button>
                                        <button onClick={() => handleDelete(item.id)} className="bg-gray-200 px-2 py-2 rounded-lg">
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600">
                                    تم التحديث في {new Date(item.updated_at).toLocaleDateString()}
                                </p>
                                <p className="mt-2 text-gray-700 text-sm line-clamp-2">{item.content}</p>
                            </div>
                        ))}
                    </div>

                    <h2 className="text-xl font-bold mt-8">الإصدارات السابقة</h2>
                    <div className="space-y-4">
                        {inactiveTerms.map((item) => (
                            <div key={item.id} className="bg-white p-4 border rounded">
                                <div className="flex justify-between items-center mb-2">
                                    <p className="font-bold">{item.title}</p>
                                    <button
                                        onClick={() => handleDownloadPdf(item.id)}
                                        className="bg-primary text-white px-4 py-1 rounded"
                                    >
                                        عرض النسخة
                                    </button>
                                </div>
                                <p className="text-sm text-gray-600">
                                    تم التحديث في {new Date(item.updated_at).toLocaleDateString()}
                                </p>
                                <p className="mt-2 text-gray-700 text-sm line-clamp-2">{item.content}</p>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {(mode === 'create' || mode === 'edit') && (
                <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-6 bg-white p-3 sm:p-6 rounded-lg">
                    <div>
                        <label className="block mb-1">نوع الشروط</label>
                        <select name="type" value={form.type} onChange={handleChange} className="w-full border rounded px-3 py-2 text-sm sm:text-base">
                            <option value="terms">بنود</option>
                            <option value="privacy">سياسة الخصوصية</option>
                        </select>
                    </div>

                    <div>
                        <label className="block mb-1">الفئة المستهدفة</label>
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    name="users_type"
                                    value="student"
                                    checked={form.users_type.includes('student')}
                                    onChange={handleChange}
                                />
                                المتدرب
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    name="users_type"
                                    value="teacher"
                                    checked={form.users_type.includes('teacher')}
                                    onChange={handleChange}
                                />
                                الخبير
                            </label>
                        </div>
                    </div>

                    <input
                        type="text"
                        name="title"
                        value={form.title}
                        onChange={handleChange}
                        placeholder="أدخل العنوان"
                        className="w-full border rounded px-3 py-2"
                    />

                    <textarea
                        name="content"
                        rows={5}
                        value={form.content}
                        onChange={handleChange}
                        placeholder="أدخل المحتوى"
                        className="w-full border rounded px-3 py-2"
                    />

                    <div>
                        <label className="block mb-1">الحالة</label>
                        <select name="status" value={form.status} onChange={handleChange} className="w-full border rounded px-3 py-2">
                            <option value="1">نشط</option>
                            <option value="0">غير نشط</option>
                        </select>
                    </div>

                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => {
                                setMode('list');
                                setEditId(null);
                                setForm({ title: '', content: '', type: 'terms', users_type: [], status: '1' });
                            }}
                            className="px-6 py-2 bg-gray-200 rounded"
                        >
                            تجاهل
                        </button>
                        <button type="submit" className="px-6 py-2 bg-primary text-white rounded flex items-center gap-2">
                            {mode === 'edit' ? <><FaEdit /> تحديث</> : <><FaPlus /> إضافة</>}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
