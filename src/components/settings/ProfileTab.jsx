// src/components/settings/ProfileTab.jsx
import React, { useEffect, useMemo, useState } from 'react';
import {
    EyeIcon,
    EyeSlashIcon,
    PhoneIcon,
    EnvelopeIcon,
    PencilSquareIcon,
    XMarkIcon,
    PlusIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

import { AdminService } from '../../services/adminService';
import PublicService from '../../services/publicService';
import TeacherService from '../../services/teacher/settingsService';
import StudentSettingsService from '../../services/student/settingsService';
import { withBaseUrl } from '../../utils/url';
import { processCategoriesList } from '../../utils/index';

const SOCIAL_OPTIONS = [
    { key: 'facebook', label: 'Facebook' },
    { key: 'instagram', label: 'Instagram' },
    { key: 'twitter', label: 'Twitter/X' },
    { key: 'linkedin', label: 'LinkedIn' },
    { key: 'youtube', label: 'YouTube' },
    { key: 'whatsapp', label: 'WhatsApp' },
    { key: 'telegram', label: 'Telegram' },
    { key: 'snapchat', label: 'Snapchat' },
    { key: 'tiktok', label: 'TikTok' },
    { key: 'threads', label: 'Threads' },
    { key: 'pinterest', label: 'Pinterest' },
];

const isFile = (v) => v instanceof File;

export default function ProfileTab({ role = 'student' }) {
    const isAdmin = role === 'admin';
    const isTeacher = role === 'teacher';
    const isStudent = !isAdmin && !isTeacher;

    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        old_password: '',
        password: '',
        password_confirmation: '',
        image: null,
        certificate: null, // teacher only
        bio: '',           // student + teacher
        site_link: '',     // teacher only
        categories: [],    // teacher only
    });

    const [previewImage, setPreviewImage] = useState('/images/avatar.png');
    const [certificatePreview, setCertificatePreview] = useState('');

    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [loading, setLoading] = useState(false);

    const [categoriesList, setCategoriesList] = useState([]); // [{id,title}]
    const [catsOpen, setCatsOpen] = useState(false);

    const [socials, setSocials] = useState([{ type: '', url: '' }]);
    const [adminId, setAdminId] = useState(null);

    useEffect(() => {
        if (isAdmin) {
            loadAdmin();
        } else if (isTeacher) {
            loadTeacher();
            loadPublicCategories();
        } else {
            loadStudent();
        }
    }, [role]);

    const loadPublicCategories = async () => {
        try {
            const res = await PublicService.getCategories();
            const arr = res?.data?.data || [];
            // Process categories to extract titles from translations
            const processedCategories = processCategoriesList(arr).map(category => ({
                id: Number(category.id),
                title: category.title
            }));
            setCategoriesList(processedCategories);
        } catch (e) {
            console.error('Failed to load public categories', e);
        }
    };

    const loadAdmin = async () => {
        try {
            const res = await AdminService.getProfile();
            const d = res?.data?.data || {};
            setAdminId(d.id ?? null);
            setForm((prev) => ({
                ...prev,
                name: d.name || '',
                email: d.email || '',
                phone: d.phone || '',
                bio: '',
            }));
            if (d.image) setPreviewImage(withBaseUrl(d.image));
        } catch (err) {
            console.error('Error loading profile (admin):', err);
            toast.error('حدث خطأ أثناء تحميل البيانات');
        }
    };

    const loadTeacher = async () => {
        try {
            const res = await TeacherService.getProfile();
            const d = res?.data?.data || {};

            const currentCatIds = Array.isArray(d.categories)
                ? d.categories.map((c) => Number(c.id))
                : [];

            setForm((prev) => ({
                ...prev,
                name: d.name || '',
                email: d.email || '',
                phone: d.phone || '',
                bio: d.bio || '',
                site_link: d.site_link || '',
                categories: currentCatIds,
                image: null,
                certificate: null,
            }));

            if (d.image) setPreviewImage(withBaseUrl(d.image));
            if (d.certificate) setCertificatePreview(withBaseUrl(d.certificate));

            const rows = SOCIAL_OPTIONS.reduce((acc, opt) => {
                const val = d?.[opt.key];
                if (val) acc.push({ type: opt.key, url: String(val) });
                return acc;
            }, []);
            setSocials(rows.length ? rows : [{ type: '', url: '' }]);
        } catch (err) {
            console.error('Error loading profile (teacher):', err);
            toast.error('حدث خطأ أثناء تحميل البيانات');
        }
    };

    const loadStudent = async () => {
        try {
            const res = await StudentSettingsService.getProfile();
            const d = res?.data?.data || {};
            setForm((prev) => ({
                ...prev,
                name: d.name || '',
                email: d.email || '',
                phone: d.phone || '',
                bio: d.bio || '',
                image: null,
            }));
            if (d.image) setPreviewImage(withBaseUrl(d.image));
        } catch (err) {
            console.error('Error loading profile (student):', err);
            toast.error('حدث خطأ أثناء تحميل البيانات');
        }
    };

    const handleInput = (e) => {
        const { name, value, files } = e.target;

        if (name === 'image') {
            const file = files?.[0];
            setForm((p) => ({ ...p, image: file || null }));
            if (file) setPreviewImage(URL.createObjectURL(file));
            return;
        }

        if (name === 'certificate') {
            const file = files?.[0];
            setForm((p) => ({ ...p, certificate: file || null }));
            if (file) setCertificatePreview(URL.createObjectURL(file));
            return;
        }

        setForm((p) => ({ ...p, [name]: value }));
    };

    const toggleCategory = (id, checked) => {
        setForm((prev) => {
            const set = new Set(prev.categories);
            if (checked) set.add(id);
            else set.delete(id);
            return { ...prev, categories: Array.from(set) };
        });
    };

    const addSocialRow = () => setSocials((rows) => [...rows, { type: '', url: '' }]);
    const removeSocialRow = (idx) =>
        setSocials((rows) => rows.filter((_, i) => i !== idx));
    const changeSocial = (idx, patch) =>
        setSocials((rows) => rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const fd = new FormData();

            if (form.name) fd.append('name', form.name);
            if (form.email) fd.append('email', form.email);
            if (form.phone) fd.append('phone', form.phone);

            if (form.old_password) fd.append('old_password', form.old_password);
            if (form.password) fd.append('password', form.password);
            if (form.password_confirmation) fd.append('password_confirmation', form.password_confirmation);

            if (isFile(form.image)) fd.append('image', form.image);

            if (isTeacher) {
                if (typeof form.bio === 'string') fd.append('bio', form.bio);
                if (typeof form.site_link === 'string') fd.append('site_link', form.site_link);

                (form.categories || []).forEach((id) => fd.append('categories[]', id));
                if (isFile(form.certificate)) fd.append('certificate', form.certificate);

                const byKey = {};
                SOCIAL_OPTIONS.forEach((opt) => (byKey[opt.key] = ''));
                socials
                    .filter((r) => r.type && r.url)
                    .forEach((r) => { byKey[r.type] = r.url; });
                Object.entries(byKey).forEach(([k, v]) => fd.append(k, v));

                await TeacherService.updateProfile(fd);
                toast.success('تم تحديث الملف الشخصي بنجاح');
                await loadTeacher();
            } else if (isAdmin) {
                fd.append('_method', 'PUT');
                await AdminService.updateProfile(adminId || 1, fd);
                toast.success('تم تحديث الملف الشخصي بنجاح');
                await loadAdmin();
            } else {
                // student
                if (typeof form.bio === 'string') fd.append('bio', form.bio);
                await StudentSettingsService.updateProfile(fd);
                toast.success('تم تحديث الملف الشخصي بنجاح');
                await loadStudent();
            }
        } catch (err) {
            console.error(err);
            toast.error('حدث خطأ أثناء التحديث');
        } finally {
            setLoading(false);
        }
    };

    const selectedCatsText = useMemo(() => {
        if (!form.categories?.length) return 'ادخل التخصص';
        const map = new Map(categoriesList.map((c) => [c.id, c.title]));
        return form.categories.map((id) => map.get(id) || id).join('، ');
    }, [form.categories, categoriesList]);

    return (
        <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-6 flex flex-col lg:flex-row" dir="rtl">
            {/* Avatar */}
            <div className="flex flex-col items-center lg:items-start space-y-4 lg:space-y-6 mx-0 lg:mx-6">
                <img src={previewImage} alt="avatar" className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover" />
                <label className="flex px-3 py-1 bg-secondary text-white rounded-md cursor-pointer text-sm sm:text-base">
                    <PencilSquareIcon className="w-4 h-4 sm:w-5 sm:h-5 ml-1" />
                    تغيير الصورة
                    <input type="file" name="image" onChange={handleInput} hidden />
                </label>
            </div>

            {/* Form */}
            <div className="flex flex-col gap-4 lg:gap-6 w-full lg:w-10/12">
                <h1 className="text-xl lg:text-2xl font-bold">تعديل الملف الشخصي</h1>

                <div>
                    <label className="block text-sm font-medium mb-1">الاسم كامل</label>
                    <div className="relative">
                        <input
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={handleInput}
                            placeholder="أحمد محمد"
                            className="w-full border rounded px-3 sm:px-4 py-2 pr-10 text-sm sm:text-base"
                        />
                        <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 2a5 5 0 00-5 5v1a5 5 0 0010 0V7a5 5 0 00-5-5z" />
                                <path d="M4 15a4 4 0 018 0v1H4v-1z" />
                            </svg>
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="relative">
                        <input
                            type="tel"
                            name="phone"
                            value={form.phone}
                            onChange={handleInput}
                            placeholder="+966 123456789"
                            className="w-full border rounded px-3 sm:px-4 py-2 pl-10 text-sm sm:text-base"
                        />
                        <PhoneIcon className="w-5 h-5 text-gray-400 absolute inset-y-0 left-3 m-auto" />
                    </div>
                    <div className="relative">
                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleInput}
                            placeholder="ahmed@gmail.com"
                            className="w-full border rounded px-3 sm:px-4 py-2 pl-10 text-sm sm:text-base"
                        />
                        <EnvelopeIcon className="w-5 h-5 text-gray-400 absolute inset-y-0 left-3 m-auto" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="relative">
                        <input
                            type={showOld ? 'text' : 'password'}
                            name="old_password"
                            value={form.old_password}
                            onChange={handleInput}
                            placeholder="كلمة المرور القديمة"
                            className="w-full border rounded px-3 sm:px-4 py-2 pr-10 text-sm sm:text-base"
                        />
                        <button
                            type="button"
                            onClick={() => setShowOld((v) => !v)}
                            className="absolute inset-y-0 left-3 m-auto text-gray-400"
                        >
                            {showOld ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                        </button>
                    </div>

                    <div className="relative">
                        <input
                            type={showNew ? 'text' : 'password'}
                            name="password"
                            value={form.password}
                            onChange={handleInput}
                            placeholder="كلمة المرور الجديدة"
                            className="w-full border rounded px-3 sm:px-4 py-2 pr-10 text-sm sm:text-base"
                        />
                        <button
                            type="button"
                            onClick={() => setShowNew((v) => !v)}
                            className="absolute inset-y-0 left-3 m-auto text-gray-400"
                        >
                            {showNew ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                <div className="relative">
                    <input
                        type={showConfirm ? 'text' : 'password'}
                        name="password_confirmation"
                        value={form.password_confirmation}
                        onChange={handleInput}
                        placeholder="تأكيد كلمة المرور"
                        className="w-full border rounded px-3 sm:px-4 py-2 pr-10 text-sm sm:text-base"
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirm((v) => !v)}
                        className="absolute inset-y-0 left-3 m-auto text-gray-400"
                    >
                        {showConfirm ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                    </button>
                </div>

                <ul className="list-disc list-inside text-gray-500 text-sm space-y-1">
                    <li>يفضل أن تحتوي كلمة المرور على حروف وأرقام.</li>
                    <li>يجب أن تكون كلمة المرور مكونة من 8 خانات على الأقل.</li>
                    <li>ينبغي أن تحتوي كلمة المرور على حرف كبير واحد على الأقل.</li>
                </ul>

                {/* Bio for Teacher & Student */}
                {(isTeacher || isStudent) && (
                    <div>
                        <label className="block text-sm font-medium mb-1">السيرة الذاتية</label>
                        <textarea
                            rows={4}
                            maxLength={300}
                            value={form.bio}
                            onChange={handleInput}
                            name="bio"
                            placeholder="أدخل السيرة الذاتية"
                            className="w-full border rounded px-3 sm:px-4 py-2 text-sm sm:text-base"
                        />
                        <div className="text-gray-400 text-xs text-left mt-1">
                            {(form.bio || '').length} / 300
                        </div>
                    </div>
                )}

                {/* ===== Teacher-only fields ===== */}
                {isTeacher && (
                    <>
                        {/* Categories */}
                        <div>
                            <label className="block text-sm font-medium mb-2">التخصص</label>
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setCatsOpen((o) => !o)}
                                    className="w-full border rounded px-3 py-2 flex items-center justify-between bg-white"
                                >
                                    <span className={`truncate ${form.categories.length ? '' : 'text-gray-400'}`}>
                                        {selectedCatsText}
                                    </span>
                                    <svg width="18" height="18" viewBox="0 0 24 24" className="text-gray-500">
                                        <path fill="currentColor" d="M7 10l5 5 5-5z" />
                                    </svg>
                                </button>

                                {catsOpen && (
                                    <div className="absolute z-20 mt-2 w-full bg-white border rounded-lg shadow max-h-56 overflow-auto">
                                        {categoriesList.map((cat) => {
                                            const checked = form.categories.includes(cat.id);
                                            return (
                                                <label
                                                    key={cat.id}
                                                    className="flex items-center justify-between px-4 py-2 hover:bg-gray-50 cursor-pointer"
                                                >
                                                    <span className="text-sm">{cat.title}</span>
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={(e) => toggleCategory(cat.id, e.target.checked)}
                                                    />
                                                </label>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Certificate */}
                        <div>
                            <label className="block text-sm font-medium mb-2">الشهادات</label>
                            <div className="flex items-center gap-3">
                                <label className="flex-1 border rounded px-3 py-2 bg-white cursor-pointer">
                                    <input
                                        type="file"
                                        name="certificate"
                                        accept="image/*,application/pdf"
                                        onChange={handleInput}
                                        className="hidden"
                                    />
                                    <div className="flex items-center justify-between text-sm text-gray-500">
                                        <span className="truncate">
                                            {isFile(form.certificate)
                                                ? form.certificate.name
                                                : certificatePreview
                                                    ? 'ملف محفوظ'
                                                    : 'صورة الشهادة • JPG / PNG / PDF'}
                                        </span>
                                        {certificatePreview && (
                                            <a
                                                href={certificatePreview}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-[#B3894E] font-semibold"
                                            >
                                                عرض
                                            </a>
                                        )}
                                    </div>
                                </label>
                                {(isFile(form.certificate) || certificatePreview) && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setForm((p) => ({ ...p, certificate: null }));
                                            setCertificatePreview('');
                                        }}
                                        className="p-2 rounded-full border hover:bg-gray-50"
                                        title="حذف"
                                    >
                                        <XMarkIcon className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Website + Socials */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium mb-2">الموقع الشخصي</label>
                                <input
                                    type="url"
                                    name="site_link"
                                    placeholder="أدخل رابط الموقع الشخصي"
                                    value={form.site_link}
                                    onChange={handleInput}
                                    className="w-full border rounded px-3 sm:px-4 py-2 text-sm sm:text-base"
                                />
                            </div>
                            <div className="hidden md:block" />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-center mb-2">روابط الاتصال</label>
                            <div className="space-y-3">
                                {socials.map((row, idx) => (
                                    <div key={idx} className="grid grid-cols-1 md:grid-cols-[180px_1fr_40px] gap-3">
                                        <select
                                            value={row.type}
                                            onChange={(e) => changeSocial(idx, { type: e.target.value })}
                                            className="border rounded px-3 py-2 text-sm sm:text-base"
                                        >
                                            <option value="">اختر المنصة</option>
                                            {SOCIAL_OPTIONS.map((opt) => (
                                                <option key={opt.key} value={opt.key}>
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </select>

                                        <input
                                            type="url"
                                            placeholder="ادخل رابط الاتصال"
                                            value={row.url}
                                            onChange={(e) => changeSocial(idx, { url: e.target.value })}
                                            className="border rounded px-3 py-2 text-sm sm:text-base"
                                        />

                                        <button
                                            type="button"
                                            onClick={() => removeSocialRow(idx)}
                                            className="flex items-center justify-center border rounded hover:bg-gray-50"
                                            title="حذف الرابط"
                                        >
                                            <XMarkIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={addSocialRow}
                                className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm hover:bg-gray-50"
                            >
                                <PlusIcon className="w-4 h-4" /> إضافة رابط
                            </button>
                        </div>
                    </>
                )}

                <div className="flex flex-col sm:flex-row justify-start gap-3 sm:gap-4">
                    <button type="button" className="px-4 sm:px-6 py-2 bg-gray-200 text-gray-700 rounded-md text-sm sm:text-base">
                        تجاهل
                    </button>
                    <button type="submit" disabled={loading} className="px-4 sm:px-6 py-2 bg-primary text-white rounded-md text-sm sm:text-base">
                        {loading ? 'جاري الحفظ...' : 'حفظ'}
                    </button>
                </div>
            </div>
        </form>
    );
}
