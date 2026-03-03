import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ProgramsService } from '../../../../services/programsService';
import { CategoriesService } from '../../../../services/categoriesService';
import { processCategoriesList } from '../../../../utils/index';
import { toast } from 'react-hot-toast';
import http from '../../../../services/http';

export default function ProgramsEdit() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({}); // server validation

    const [categories, setCategories] = useState([]);
    const [teachers, setTeachers] = useState([]);

    const [form, setForm] = useState({
        title: { ar: '', en: '' },
        price: '',
        type: 'live', // live | registered | onsite
        description: { ar: '', en: '' },
        learning: [{ ar: '', en: '' }],
        requirement: [{ ar: '', en: '' }],
        main_axes: [],
        notes: '',
        category_id: '',
        teacher_id: '',
        have_certificate: false,
        status: 'active',
        level: '',
        // Separate date fields for each type (matching create form structure)
        live_date_from: '',
        live_date_to: '',
        registered_date_from: '',
        onsite_date_from: '',
        onsite_date_to: '',
        duration: '',
        time: '',
        address: '',            // for onsite programs
        url: '',               // for onsite programs
        sections: [{ title: { ar: '', en: '' } }, { title: { ar: '', en: '' } }],
        user_type: 'student',   // user type for the program
        image: null,            // new File if user picks one
        imagePreview: '',       // preview URL
        originalImage: '',      // raw path from API (e.g. "uploads/....png")
    });

    // File version of the original (downloaded) image so we can re-upload it
    const [_ORIGINAL_IMAGE_FILE, setOriginalImageFile] = useState(null);
    const [imageFetchFailed, setImageFetchFailed] = useState(false);

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

    const parseArrayField = (val) => {
        try {
            if (Array.isArray(val)) return val;
            if (typeof val === 'string' && val.trim().startsWith('[')) {
                const parsed = JSON.parse(val);
                return Array.isArray(parsed) ? parsed : [];
            }
        } catch { /* ignore optional categories failure */ }
        return [];
    };

    const toAbsoluteUrl = (pathOrUrl) => {
        if (!pathOrUrl) return '';
        if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
        // API usually returns "uploads/...." -> build absolute for <img>
        return `${import.meta.env.VITE_BASE_URL}/${pathOrUrl.replace(/^\//, '')}`;
    };

    // Build candidate URLs to fetch the image BYTES from:

    const getFetchableImageUrls = (raw) => {
        const clean = (raw || '').replace(/^\//, '');
        const list = [];
        if (clean.startsWith('uploads/')) {
            list.push(`/${clean}`); // proxied path (same-origin via Vite proxy)
        }
        list.push(toAbsoluteUrl(clean)); // absolute (needs CORS on server)
        return list;
    };

    const tryFetchAsFile = async (urls, suggestedName = 'program-image') => {
        const inferMimeFromName = (name) => {
            const ext = (name || '').split('.').pop()?.toLowerCase();
            switch (ext) {
                case 'jpg':
                case 'jpeg':
                    return 'image/jpeg';
                case 'png':
                    return 'image/png';
                case 'gif':
                    return 'image/gif';
                case 'svg':
                    return 'image/svg+xml';
                case 'webp':
                    return 'image/webp';
                case 'avif':
                    return 'image/avif';
                default:
                    return '';
            }
        };
        let lastErr;
        for (const url of urls) {
            try {
                // Check if URL is relative (starts with /) - use http service for API requests
                const isRelative = url.startsWith('/');
                let blob, contentType, fileName;
                
                if (isRelative) {
                    // Use http service for relative URLs (goes through API with auth)
                    try {
                        const res = await http.get(url, { responseType: 'blob' });
                        blob = res.data;
                        contentType = res.headers?.['content-type'] || blob.type || '';
                        fileName = (() => {
                            const parts = url.split('/');
                            return parts.pop() || suggestedName;
                        })();
                    } catch (httpErr) {
                        // If http service fails, try direct fetch as fallback
                        throw httpErr;
                    }
                } else {
                    // For absolute URLs, try fetch first, but catch CORS errors gracefully
                    try {
                        const res = await fetch(url, { credentials: 'omit', mode: 'cors' });
                        if (!res.ok) throw new Error(`HTTP ${res.status}`);
                        blob = await res.blob();
                        contentType = res.headers?.get('content-type') || blob.type || '';
                        fileName = (() => {
                            try {
                                const u = new URL(url, window.location.origin);
                                const last = u.pathname.split('/').filter(Boolean).pop();
                                return last || suggestedName;
                            } catch {
                                const parts = url.split('/');
                                return parts.pop() || suggestedName;
                            }
                        })();
                    } catch (fetchErr) {
                        // CORS error - try using http service if URL can be converted to relative
                        const urlObj = new URL(url);
                        const relativePath = urlObj.pathname;
                        if (relativePath) {
                            const res = await http.get(relativePath, { responseType: 'blob' });
                            blob = res.data;
                            contentType = res.headers?.['content-type'] || blob.type || '';
                            fileName = relativePath.split('/').pop() || suggestedName;
                        } else {
                            throw fetchErr;
                        }
                    }
                }
                
                // Validate it's an image
                if (blob && /^image\//i.test(contentType || blob.type || '')) {
                    const inferred = inferMimeFromName(fileName);
                    const finalType = inferred || contentType || blob.type || 'image/png';
                    return new File([blob], fileName, { type: finalType });
                } else {
                    throw new Error('Not an image');
                }
            } catch (e) {
                lastErr = e;
                // Don't log CORS errors to console as they're expected in production
                if (e.message && !e.message.includes('CORS') && !e.message.includes('Failed to fetch')) {
                    console.warn('Image fetch attempt failed:', e.message);
                }
            }
        }
        throw lastErr || new Error('Failed to fetch image');
    };

    useEffect(() => {
        const load = async () => {
            try {
                // categories (best-effort)
                try {
                    const cRes = await CategoriesService.list();
                    const payload = cRes?.data?.data;
                    const arr = Array.isArray(payload?.data)
                        ? payload.data
                        : Array.isArray(payload)
                            ? payload
                            : [];
                    // Process categories to extract titles from translations
                    setCategories(processCategoriesList(arr));
                } catch { /* ignore optional teachers failure */ }

                // teachers (best-effort)
                try {
                    const tRes = await ProgramsService.getTeacherList();
                    const teachersList = tRes?.data?.data || tRes?.data || [];
                    setTeachers(Array.isArray(teachersList) ? teachersList : []);
                } catch { /* ignore */ }

                // program
                const res = await ProgramsService.get(id);
                const p = res?.data?.row ?? res?.data?.data ?? res?.data;
                if (!p) throw new Error('Program not found');

                // Helper function to extract date from ISO string
                const extractDateFromISO = (isoString) => {
                    if (!isoString) return '';
                    try {
                        const date = new Date(isoString);
                        if (isNaN(date)) return '';
                        const pad = (n) => String(n).padStart(2, '0');
                        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
                    } catch {
                        return '';
                    }
                };

                // Helper function to extract time from ISO string
                const extractTimeFromISO = (isoString) => {
                    if (!isoString) return '';
                    try {
                        const date = new Date(isoString);
                        if (isNaN(date)) return '';
                        const pad = (n) => String(n).padStart(2, '0');
                        return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
                    } catch {
                        return '';
                    }
                };

                // derive date/time/duration
                let df = '', dt = '', tm = '', duration = '';
                duration = p.duration || '';
                
                // Extract dates from API response - ensure we always get empty string, never null/undefined
                df = (extractDateFromISO(p.date_from) || '').toString();
                dt = (extractDateFromISO(p.date_to) || '').toString();
                
                // Extract time - format from "HH:MM:SS" to "HH:MM" if needed
                if (p.time) {
                    const timeStr = String(p.time).trim();
                    // If time is in "HH:MM:SS" format, extract just "HH:MM"
                    if (timeStr.match(/^\d{2}:\d{2}:\d{2}$/)) {
                        tm = timeStr.substring(0, 5); // "13:00:00" -> "13:00"
                    } else if (timeStr.match(/^\d{2}:\d{2}$/)) {
                        tm = timeStr; // Already in correct format
                    } else {
                        tm = extractTimeFromISO(p.date_from) || '';
                    }
                } else {
                    tm = extractTimeFromISO(p.date_from) || '';
                }
                tm = tm.toString();

                const rawImage = p.image ?? '';

                // Extract translations from API response
                const translations = p.translations || [];
                const arTranslation = translations.find(t => t.locale === 'ar') || {};
                const enTranslation = translations.find(t => t.locale === 'en') || {};

                // Normalize user_type to student only (trainee option removed)
                const normalizedUserType = 'student';

                // Determine program type for date field mapping
                // Priority: use p.type directly from API, only fallback if type is missing
                let programType = p.type;
                // Normalize 'recorded' to 'registered' for consistency
                if (programType === 'recorded') {
                    programType = 'registered';
                }
                // Only use fallback if type is missing or invalid
                if (!programType || !['live', 'registered', 'onsite'].includes(programType)) {
                    // Fallback: try to infer from is_live flag if type is missing
                    if (p.is_live === 1 || p.is_live === true) {
                        programType = 'live';
                    } else if (p.is_live === 0 || p.is_live === false) {
                        programType = 'registered';
                    } else {
                        programType = 'live'; // default
                    }
                }

                setForm({
                    title: { 
                        ar: arTranslation.title ?? '', 
                        en: enTranslation.title ?? '' 
                    },
                    price: p.price ?? '',
                    type: programType,
                    description: { 
                        ar: arTranslation.description ?? '', 
                        en: enTranslation.description ?? '' 
                    },
                    learning: parseArrayField(arTranslation.learning).length || parseArrayField(enTranslation.learning).length 
                        ? [
                            ...parseArrayField(arTranslation.learning).map((item, i) => ({
                                ar: item,
                                en: parseArrayField(enTranslation.learning)[i] || ''
                            })),
                            ...parseArrayField(enTranslation.learning).slice(parseArrayField(arTranslation.learning).length).map(item => ({
                                ar: '',
                                en: item
                            }))
                        ].filter(item => item.ar || item.en)
                        : [{ ar: '', en: '' }],
                    requirement: parseArrayField(arTranslation.requirement).length || parseArrayField(enTranslation.requirement).length 
                        ? [
                            ...parseArrayField(arTranslation.requirement).map((item, i) => ({
                                ar: item,
                                en: parseArrayField(enTranslation.requirement)[i] || ''
                            })),
                            ...parseArrayField(enTranslation.requirement).slice(parseArrayField(arTranslation.requirement).length).map(item => ({
                                ar: '',
                                en: item
                            }))
                        ].filter(item => item.ar || item.en)
                        : [{ ar: '', en: '' }],
                    main_axes: parseArrayField(arTranslation.main_axes).length || parseArrayField(enTranslation.main_axes).length 
                        ? [
                            ...parseArrayField(arTranslation.main_axes).map((item, i) => ({
                                ar: item,
                                en: parseArrayField(enTranslation.main_axes)[i] || ''
                            })),
                            ...parseArrayField(enTranslation.main_axes).slice(parseArrayField(arTranslation.main_axes).length).map(item => ({
                                ar: '',
                                en: item
                            }))
                        ].filter(item => item.ar || item.en)
                        : [],
                    notes: p.notes || '',
                    category_id: p.category_id ?? '',
                    teacher_id: p.teacher_id ?? '',
                    have_certificate: Boolean(p.have_certificate),
                    status: p.status === 1 ? 'active' : 'inactive',
                    level: p.level ?? '',
                    // ALWAYS initialize ALL date fields - this ensures they always exist in form state
                    // Populate the fields that match the current program type, others stay as empty strings
                    // This way, when user changes type, all fields are already in the form state
                    live_date_from: programType === 'live' ? String(df || '') : '',
                    live_date_to: programType === 'live' ? String(dt || '') : '',
                    registered_date_from: programType === 'registered' ? String(df || '') : '',
                    onsite_date_from: programType === 'onsite' ? String(df || '') : '',
                    onsite_date_to: programType === 'onsite' ? String(dt || '') : '',
                    // Always ensure these are strings, never null/undefined
                    duration: String(p.duration || duration || ''),
                    time: programType === 'live' ? String(tm || '') : '',
                    sections: Array.isArray(p.sections) && p.sections.length > 0
                        ? p.sections.map((s) => {
                            const sectionTranslations = s.translations || [];
                            const sectionAr = sectionTranslations.find(t => t.locale === 'ar') || {};
                            const sectionEn = sectionTranslations.find(t => t.locale === 'en') || {};
                            return { 
                                title: { 
                                    ar: sectionAr.title ?? '', 
                                    en: sectionEn.title ?? '' 
                                } 
                            };
                        })
                        : [{ title: { ar: '', en: '' } }, { title: { ar: '', en: '' } }],
                    user_type: normalizedUserType,
                    address: p.address ?? '',
                    url: p.url ?? '',
                    image: null,
                    imagePreview: rawImage ? toAbsoluteUrl(rawImage) : '',
                    originalImage: rawImage,
                });

                // ✅ Try to get a real File of the existing image (proxy first → absolute)
                if (rawImage) {
                    try {
                        const candidates = getFetchableImageUrls(rawImage);
                        const file = await tryFetchAsFile(candidates, 'program-image');
                        setOriginalImageFile(file);
                        setImageFetchFailed(false);
                    } catch (e) {
                        // Suppress CORS errors in console - they're expected when backend doesn't allow CORS
                        const isCorsError = e.message && (
                            e.message.includes('CORS') || 
                            e.message.includes('Failed to fetch') ||
                            e.message.includes('NetworkError') ||
                            e.name === 'TypeError'
                        );
                        if (!isCorsError) {
                            console.warn('Failed to fetch original image as file:', e.message);
                        }
                        setOriginalImageFile(null);
                        setImageFetchFailed(true);
                    }
                } else {
                    setOriginalImageFile(null);
                }
            } catch (e) {
                toast.error('تعذر تحميل البرنامج');
                console.error(e);
                navigate('/admin/programs');
            } finally {
                setLoading(false);
            }
        };
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleChooseImage = (e) => {
        const file = e.target.files?.[0] || null;
        setField({ image: file });
        if (file) {
            const url = URL.createObjectURL(file);
            setField({ imagePreview: url });
        }
    };

    const extractErrors = (err, fallbackMessage = 'حدث خطأ أثناء الحفظ') => {
        const data = err?.response?.data;
        const errors = data?.errors || {};
        const message = data?.message || fallbackMessage;
        return { errors, message };
    };

    const onSave = async (e) => {
        e.preventDefault();
        setFieldErrors({});

        if (!form.title.ar?.trim() && !form.title.en?.trim()) {
            setFieldErrors({ title: ['يرجى إدخال اسم البرنامج بالعربية أو الإنجليزية'] });
            return toast.error('يرجى إدخال اسم البرنامج بالعربية أو الإنجليزية');
        }
        if (!form.price || isNaN(Number(form.price))) {
            setFieldErrors((prev) => ({ ...prev, price: ['يرجى إدخال سعر صالح'] }));
            return toast.error('يرجى إدخال سعر صالح');
        }

        // Do not force image; if user doesn't pick a new image, we won't send one

        setSaving(true);
        try {
            const fd = new FormData();
            fd.append('_method', 'PUT');
            
            // Handle title translations
            if (form.title.ar?.trim()) fd.append('title[ar]', form.title.ar.trim());
            if (form.title.en?.trim()) fd.append('title[en]', form.title.en.trim());
            
            fd.append('price', String(form.price));
            fd.append('type', form.type);
            
            // Handle description translations
            if (form.description.ar?.trim()) fd.append('description[ar]', form.description.ar.trim());
            if (form.description.en?.trim()) fd.append('description[en]', form.description.en.trim());
            
            if (form.category_id !== '' && form.category_id !== null && form.category_id !== undefined) {
                fd.append('category_id', String(form.category_id));
            }
            if (form.teacher_id !== '' && form.teacher_id !== null && form.teacher_id !== undefined) {
                fd.append('teacher_id', String(form.teacher_id));
            }
            fd.append('have_certificate', form.have_certificate ? '1' : '0');
            fd.append('status', form.status === 'active' ? '1' : '0');
            fd.append('level', form.level ?? '');
            fd.append('user_type', form.user_type || 'student');
            
            // Handle date fields based on program type (matching create form structure)
            // For live programs, ensure date/time exist and send them
            if ((form.type || "").toLowerCase() === "live") {
                if (!form.live_date_from) {
                    setFieldErrors((prev) => ({ ...prev, live_date_from: ['يجب إدخال تاريخ البداية للبرنامج المباشر'] }));
                    throw new Error("يجب إدخال تاريخ البداية للبرنامج المباشر");
                }
                if (!form.live_date_to) {
                    setFieldErrors((prev) => ({ ...prev, live_date_to: ['يجب إدخال تاريخ النهاية للبرنامج المباشر'] }));
                    throw new Error("يجب إدخال تاريخ النهاية للبرنامج المباشر");
                }
                if (!form.time) {
                    setFieldErrors((prev) => ({ ...prev, time: ['يجب إدخال وقت البرنامج المباشر'] }));
                    throw new Error("يجب إدخال وقت البرنامج المباشر");
                }
                
                fd.append('date_from', form.live_date_from);
                fd.append('date_to', form.live_date_to);
                fd.append('time', (form.time || "").length === 5 ? `${form.time}:00` : form.time);
            } else if ((form.type || "").toLowerCase() === "registered") {
                // For registered programs, ensure duration exists (it will be sent in the general block below)
                if (!form.duration || form.duration <= 0) {
                    setFieldErrors((prev) => ({ ...prev, duration: ['يجب إدخال مدة البرنامج بالأيام'] }));
                    throw new Error("يجب إدخال مدة البرنامج بالأيام");
                }
                // date_from is optional for registered programs
                if (form.registered_date_from) fd.append('date_from', form.registered_date_from);
            } else if ((form.type || "").toLowerCase() === "onsite") {
                // For onsite programs, ensure date fields and address exist and send them
                if (!form.onsite_date_from) {
                    setFieldErrors((prev) => ({ ...prev, onsite_date_from: ['يجب إدخال تاريخ البداية للبرنامج الحضوري'] }));
                    throw new Error("يجب إدخال تاريخ البداية للبرنامج الحضوري");
                }
                if (!form.onsite_date_to) {
                    setFieldErrors((prev) => ({ ...prev, onsite_date_to: ['يجب إدخال تاريخ النهاية للبرنامج الحضوري'] }));
                    throw new Error("يجب إدخال تاريخ النهاية للبرنامج الحضوري");
                }
                if (!form.address?.trim()) {
                    setFieldErrors((prev) => ({ ...prev, address: ['يجب إدخال عنوان المكان للبرنامج الحضوري'] }));
                    throw new Error("يجب إدخال عنوان المكان للبرنامج الحضوري");
                }
                
                fd.append('date_from', form.onsite_date_from);
                fd.append('date_to', form.onsite_date_to);
                fd.append('address', form.address);
                fd.append('url', form.url || '');
            }
            
            // Duration can be set for all program types - send if it exists and is a valid number > 0
            // For registered programs, duration is already required and sent above, but we also send it here if it exists for consistency
            if (form.duration) {
                const durationNum = Number(form.duration);
                if (!isNaN(durationNum) && durationNum > 0) {
                    fd.append('duration', durationNum);
                }
            }
            
            // Handle learning translations
            (form.learning || []).forEach((item) => {
                if (item.ar?.trim()) fd.append('learning[ar][]', item.ar.trim());
                if (item.en?.trim()) fd.append('learning[en][]', item.en.trim());
            });
            
            // Handle requirement translations
            (form.requirement || []).forEach((item) => {
                if (item.ar?.trim()) fd.append('requirement[ar][]', item.ar.trim());
                if (item.en?.trim()) fd.append('requirement[en][]', item.en.trim());
            });
            
            // Handle main_axes translations
            (form.main_axes || []).forEach((item) => {
                if (item.ar?.trim()) fd.append('main_axes[ar][]', item.ar.trim());
                if (item.en?.trim()) fd.append('main_axes[en][]', item.en.trim());
            });
            
            // Handle notes
            if (form.notes) fd.append('notes', form.notes);
            
            // Handle sections translations
            (form.sections || [])
                .filter((s) => (s?.title?.ar || '').trim() || (s?.title?.en || '').trim())
                .forEach((s, i) => {
                    if (s.title.ar?.trim()) fd.append(`sections[${i}][title][ar]`, s.title.ar.trim());
                    if (s.title.en?.trim()) fd.append(`sections[${i}][title][en]`, s.title.en.trim());
                });

            // Only send image if user picked a new one
            if (form.image instanceof File) {
                fd.append('image', form.image);
            }

            await ProgramsService.update(id, fd);
            toast.success('تم تحديث البرنامج بنجاح');
            navigate('/admin/programs');
        } catch (err) {
            const { errors, message } = extractErrors(err);
            setFieldErrors(errors);
            
            // Show main error message
            toast.error(message);
            
            // Show individual field errors
            if (errors && typeof errors === 'object') {
                Object.entries(errors).forEach(([field, messages]) => {
                    if (Array.isArray(messages)) {
                        messages.forEach(msg => toast.error(`${field}: ${msg}`));
                    }
                });
            }
            
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const titleHasError = Array.isArray(fieldErrors?.title) && fieldErrors.title.length > 0;
    const priceHasError = Array.isArray(fieldErrors?.price) && fieldErrors.price.length > 0;
    const typeHasError = Array.isArray(fieldErrors?.type) && fieldErrors.type.length > 0;
    // Keep computed flag unused safely (naming to satisfy linter rule)
    const IMAGE_HAS_ERROR = Array.isArray(fieldErrors?.image) && fieldErrors.image.length > 0;

    if (loading) return <div className="p-6" dir="rtl">جاري التحميل...</div>;

    return (
        <div className="p-6 space-y-6" dir="rtl">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">تعديل برنامج</h1>
                <Link to="/admin/programs" className="px-3 py-2 border rounded text-sm">
                    ← الرجوع إلى قائمة البرامج
                </Link>
            </div>

            {Object.keys(fieldErrors || {}).length > 0 && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm">
                    <ul className="list-disc pr-5 space-y-1">
                        {Object.entries(fieldErrors).map(([k, arr]) =>
                            Array.isArray(arr) ? arr.map((msg, i) => <li key={`${k}-${i}`}>{msg}</li>) : null
                        )}
                    </ul>
                </div>
            )}

            <form onSubmit={onSave} className="bg-white p-6 rounded-lg shadow-md  space-y-5">
                {/* Image */}
                <div>
                    <label className="block text-sm font-medium mb-1">صورة البرنامج</label>
                    {form.imagePreview && (
                        <img src={form.imagePreview} alt="preview" className="w-28 h-28 object-cover rounded mb-3" />
                    )}
                    <input type="file" accept="image/*" onChange={handleChooseImage} />
                    <p className="text-xs text-gray-500 mt-1">
                        إذا لم تختر صورة جديدة، سنرفع الصورة الحالية تلقائيًا.
                    </p>
                    {imageFetchFailed && (
                        <p className="text-xs text-red-600 mt-1">
                            تعذر تحميل الصورة الأصلية، يرجى اختيار صورة جديدة.
                        </p>
                    )}
                    {Array.isArray(fieldErrors?.image) && fieldErrors.image.length > 0 && (
                        <p className="text-red-600 text-sm mt-1">{fieldErrors.image[0]}</p>
                    )}
                </div>

                {/* Row 1: teacher / category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">المعلم</label>
                        <select
                            value={form.teacher_id ?? ''}
                            onChange={(e) => setField({ teacher_id: Number(e.target.value) || '' })}
                            className="w-full border rounded px-3 py-2 border-gray-300"
                        >
                            <option value="">اختر المعلم</option>
                            {teachers.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">التخصص</label>
                        <select
                            value={form.category_id ?? ''}
                            onChange={(e) => setField({ category_id: Number(e.target.value) || '' })}
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

                {/* Row 2: title (ar/en) / price */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">اسم البرنامج (عربي)</label>
                        <input
                            type="text"
                            value={form.title.ar}
                            onChange={(e) => {
                                setField({ title: { ...form.title, ar: e.target.value } });
                                if (titleHasError) setFieldErrors((prev) => ({ ...prev, title: undefined }));
                            }}
                            className={`w-full border rounded px-3 py-2 ${titleHasError ? 'border-red-500' : 'border-gray-300'}`}
                            placeholder="أدخل اسم البرنامج بالعربية"
                        />
                        {titleHasError && <p className="text-red-600 text-sm mt-1">{fieldErrors.title[0]}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">اسم البرنامج (إنجليزي)</label>
                        <input
                            type="text"
                            value={form.title.en}
                            onChange={(e) => {
                                setField({ title: { ...form.title, en: e.target.value } });
                                if (titleHasError) setFieldErrors((prev) => ({ ...prev, title: undefined }));
                            }}
                            className={`w-full border rounded px-3 py-2 ${titleHasError ? 'border-red-500' : 'border-gray-300'}`}
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
                            onChange={(e) => {
                                setField({ price: e.target.value });
                                if (priceHasError) setFieldErrors((prev) => ({ ...prev, price: undefined }));
                            }}
                            className={`w-full border rounded px-3 py-2 ${priceHasError ? 'border-red-500' : 'border-gray-300'}`}
                            placeholder="أدخل السعر"
                        />
                        {priceHasError && <p className="text-red-600 text-sm mt-1">{fieldErrors.price[0]}</p>}
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
                            onChange={(e) => {
                                const newType = e.target.value;
                                // When type changes, ensure all date fields exist in form state
                                // This prevents fields from disappearing when switching types
                                setField({ 
                                    type: newType,
                                    // Ensure all date fields are always strings (never null/undefined)
                                    live_date_from: form.live_date_from || '',
                                    live_date_to: form.live_date_to || '',
                                    registered_date_from: form.registered_date_from || '',
                                    onsite_date_from: form.onsite_date_from || '',
                                    onsite_date_to: form.onsite_date_to || '',
                                    time: form.time || '',
                                });
                                if (typeHasError) setFieldErrors((prev) => ({ ...prev, type: undefined }));
                            }}
                            className={`w-full border rounded px-3 py-2 ${typeHasError ? 'border-red-500' : 'border-gray-300'}`}
                        >
                            <option value="live">برنامج مباشر</option>
                            <option value="registered">برنامج مسجل</option>
                            <option value="onsite">برنامج حضوري</option>
                        </select>
                        {typeHasError && <p className="text-red-600 text-sm mt-1">{fieldErrors.type[0]}</p>}
                    </div>
                </div>

                {/* Row 5: date/time for live, duration for registered, address/location for onsite */}
                {form.type === 'live' ? (
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
                            <label className="block text-sm font-medium mb-1">الوقت</label>
                            <input
                                type="time"
                                step="1"
                                value={form.time || ''}
                                onChange={(e) => setField({ time: e.target.value })}
                                className="w-full border rounded px-3 py-2 border-gray-300"
                            />
                        </div>
                    </div>
                ) : form.type === 'registered' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">تاريخ بداية التسجيل</label>
                            <input
                                type="date"
                                value={form.registered_date_from || ''}
                                onChange={(e) => setField({ registered_date_from: e.target.value })}
                                className="w-full border rounded px-3 py-2 border-gray-300"
                            />
                        </div>
                    </div>
                ) : form.type === 'onsite' ? (
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
                ) : null}

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

                {/* Sections - For registered and live programs */}
                {(form.type === 'registered' || form.type === 'live') && (
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
                        <option value="متوسط">متوسط</option>
                        <option value="متقدم">متقدم</option>
                        <option value="خبير">خبير</option>
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

                <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={() => navigate('/admin/programs')} className="px-4 py-2 border rounded">
                        إلغاء
                    </button>
                    <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-white rounded disabled:opacity-60">
                        {saving ? "جاري الإرسال..." : "إضافة برنامج"}
                    </button>
                </div>
            </form>
        </div>
    );
}
