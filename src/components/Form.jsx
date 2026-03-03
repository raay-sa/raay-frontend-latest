import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ChevronDownIcon, CheckIcon, XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';

/**
 * Generic Form component
 * - Keeps all visible UI strings in Arabic
 * - Comments in English
 * - Conditional visibility via `f.showWhen(values)`
 * - Simple repeater fields (array of strings)
 * - Aggregated server error banner
 */
export default function Form({
    fields,
    initialValues,
    statusOptions = [],
    specializationOptions = [],
    onSubmit,
    onCancel,
    submitLabel,
    onValuesChange,
}) {
    const {
        register,
        handleSubmit,
        setValue,
        watch,
        setError,
        clearErrors,
        reset,
        formState: { errors },
    } = useForm({ defaultValues: initialValues || {}, reValidateMode: 'onChange' });

    // Keep form state in sync when initialValues change
    useEffect(() => {
        if (initialValues) reset(initialValues);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(initialValues || {})]);

    // Local UI state
    const [specOpen, setSpecOpen] = useState(false);
    const [formErrors, setFormErrors] = useState([]);

    // Selected values for legacy specialization dropdown
    const selectedSpecs = watch('specialization') || [];

    // Expose all current values for conditional rendering (showWhen)
    const allValues = watch();

    // Subscribe to form value changes (avoids infinite loop from broad deps)
    useEffect(() => {
        const subscription = watch((values, { name }) => {
            if (onValuesChange) {
                onValuesChange(values);
            }
            if (formErrors.length > 0) {
                setFormErrors([]);
            }
            // Do not clear all errors; only clear the field being edited to avoid loops
            if (name && errors?.[name]) {
                clearErrors(name);
            }
        });
        return () => subscription.unsubscribe();
    }, [watch, onValuesChange, clearErrors, formErrors.length, errors]);

    // Local drafts for repeater inputs
    const [drafts, setDrafts] = useState({});

    // Submit handler with server-side error collection
    const handleFormSubmit = async (data) => {
        setFormErrors([]);
        try {
            // Include all form values, even for hidden fields
            const allFormData = watch();
            await onSubmit(allFormData);
        } catch (err) {
            if (err?.response?.data?.errors) {
                const serverErrors = err.response.data.errors;
                const collected = [];
                Object.entries(serverErrors).forEach(([field, messages]) => {
                    setError(field, { type: 'server', message: messages[0] });
                    collected.push(...messages);
                });
                setFormErrors(collected);
            } else if (err?.message) {
                setFormErrors([err.message]);
            }
        }
    };

    // ===== Repeater helpers (array of strings) =====
    const addToArray = (name) => {
        const draft = (drafts[name] || '').trim();
        if (!draft) return;
        const arr = Array.isArray(watch(name)) ? [...watch(name)] : [];
        arr.push(draft);
        setValue(name, arr, { shouldValidate: true, shouldDirty: true });
        setDrafts((d) => ({ ...d, [name]: '' }));
    };
    const removeFromArray = (name, idx) => {
        const arr = Array.isArray(watch(name)) ? [...watch(name)] : [];
        arr.splice(idx, 1);
        setValue(name, arr, { shouldValidate: true, shouldDirty: true });
    };
    const updateArrayItem = (name, idx, val) => {
        const arr = Array.isArray(watch(name)) ? [...watch(name)] : [];
        arr[idx] = val;
        setValue(name, arr, { shouldValidate: true, shouldDirty: true });
    };

    // ===== Translation Repeater helpers (array of objects with ar/en) =====
    const addToTranslationArray = (name) => {
        const draftAr = (drafts[`${name}_ar`] || '').trim();
        const draftEn = (drafts[`${name}_en`] || '').trim();
        if (!draftAr && !draftEn) return;
        
        const arr = Array.isArray(watch(name)) ? [...watch(name)] : [];
        arr.push({ ar: draftAr, en: draftEn });
        setValue(name, arr, { shouldValidate: true, shouldDirty: true });
        setDrafts((d) => ({ ...d, [`${name}_ar`]: '', [`${name}_en`]: '' }));
    };
    const removeFromTranslationArray = (name, idx) => {
        const arr = Array.isArray(watch(name)) ? [...watch(name)] : [];
        arr.splice(idx, 1);
        setValue(name, arr, { shouldValidate: true, shouldDirty: true });
    };
    const updateTranslationArrayItem = (name, idx, field, val) => {
        const arr = Array.isArray(watch(name)) ? [...watch(name)] : [];
        arr[idx] = { ...arr[idx], [field]: val };
        setValue(name, arr, { shouldValidate: true, shouldDirty: true });
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} encType="multipart/form-data">
            {/* Aggregated top errors (Arabic UI text) */}
            {formErrors.length > 0 && (
                <div className="mb-4 bg-red-100 text-red-700 border border-red-300 rounded-lg px-4 py-3 space-y-1">
                    {formErrors.map((msg, i) => (
                        <p key={i} className="text-sm">{msg}</p>
                    ))}
                </div>
            )}

            <div className="grid grid-cols-2 gap-6">
                {fields.map((f) => {
                    // Conditional field visibility using showWhen(values)
                    const isVisible = !f.showWhen || f.showWhen(allValues);
                    
                    // Always register the field, even if hidden
                    if (!isVisible) {
                        return (
                            <input
                                key={f.name}
                                type="hidden"
                                {...register(f.name)}
                            />
                        );
                    }

                    // ===== Simple select (excluding legacy specialization/status) =====
                    if (f.options && !['specialization', 'status'].includes(f.name)) {
                        return (
                            <div key={f.name} className={f.fullWidth ? 'col-span-2' : ''}>
                                <label className="block mb-1">{f.label}</label>
                                <select 
                                    {...register(f.name, f.validation)} 
                                    className={`w-full border rounded-xl py-2 px-3 ${f.disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                    disabled={f.disabled}
                                    onChange={(e) => {
                                        // Call the register onChange first
                                        register(f.name, f.validation).onChange(e);
                                        // Then call custom onChange if provided
                                        if (f.onChange) {
                                            f.onChange(e.target.value);
                                        }
                                    }}
                                >
                                    <option value="">{f.placeholder || `اختر ${f.label}`}</option>
                                    {f.options.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                {errors[f.name]?.message && <p className="text-xs text-red-600 mt-1">{String(errors[f.name].message)}</p>}
                            </div>
                        );
                    }

                    // ===== Legacy status select =====
                    if (f.name === 'status') {
                        return (
                            <div key="status" className={f.fullWidth ? 'col-span-2' : ''}>
                                <label className="block mb-1">{f.label}</label>
                                <select {...register('status', f.validation)} className="w-full border rounded-xl py-2 px-3">
                                    {statusOptions.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                {errors.status?.message && <p className="text-xs text-red-600 mt-1">{String(errors.status.message)}</p>}
                            </div>
                        );
                    }

                    // ===== Legacy specialization multi-select =====
                    if (f.name === 'specialization') {
                        return (
                            <div key="specialization" className={`relative ${f.fullWidth ? 'col-span-2' : ''}`}>
                                <label className="block mb-1">{f.label}</label>
                                <button
                                    type="button"
                                    onClick={() => setSpecOpen((o) => !o)}
                                    className="w-full text-right border rounded-xl py-2 px-3 flex justify-between items-center"
                                >
                                    {selectedSpecs.length > 0
                                        ? specializationOptions
                                            .filter((opt) => selectedSpecs.includes(opt.value))
                                            .map((opt) => opt.label)
                                            .join(', ')
                                        : f.placeholder || 'اختر التخصص'}
                                    <ChevronDownIcon className="w-5 ه-5 text-gray-500" />
                                </button>
                                {specOpen && (
                                    <div className="absolute z-10 mt-1 w-full bg-white border rounded-xl shadow max-h-48 overflow-auto">
                                        {specializationOptions.map((opt) => {
                                            const sel = selectedSpecs.includes(opt.value);
                                            return (
                                                <label key={opt.value} className="flex items-center px-3 py-2 hover:bg-gray-50">
                                                    <input
                                                        type="checkbox"
                                                        checked={sel}
                                                        onChange={() => {
                                                            if (sel) {
                                                                setValue('specialization', selectedSpecs.filter((v) => v !== opt.value), { shouldValidate: true, shouldDirty: true });
                                                            } else {
                                                                setValue('specialization', [...selectedSpecs, opt.value], { shouldValidate: true, shouldDirty: true });
                                                            }
                                                        }}
                                                        className="ml-2"
                                                    />
                                                    <span className={`flex-1 ${sel ? 'font-medium' : ''}`}>{opt.label}</span>
                                                    {sel && <CheckIcon className="w-4 h-4 text-primary" />}
                                                </label>
                                            );
                                        })}
                                        {selectedSpecs.includes('other') && (
                                            <input
                                                {...register('otherSpecialization')}
                                                placeholder="أدخل التخصص"
                                                className="w-full border-t px-3 py-2 text-sm"
                                            />
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    }

                    // ===== Textarea =====
                    if (f.type === 'textarea') {
                        return (
                            <div key={f.name} className={`col-span-2 ${f.fullWidth ? 'col-span-2' : ''}`}>
                                <label className="block mb-1">{f.label}</label>
                                <textarea
                                    rows={f.rows || 6}
                                    placeholder={f.placeholder}
                                    {...register(f.name, f.validation)}
                                    className="w-full border rounded-xl py-2 px-3 resize-none"
                                />
                                {errors[f.name]?.message && <p className="text-xs text-red-600 mt-1">{String(errors[f.name].message)}</p>}
                            </div>
                        );
                    }

                    // ===== Translation Repeater =====
                    if (f.type === 'translation-repeater') {
                        const arr = watch(f.name) || [];
                        return (
                            <div key={f.name} className={f.fullWidth ? 'col-span-2' : ''}>
                                <label className="block mb-1">{f.label}</label>
                                
                                {/* Add new item form */}
                                <div className="space-y-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
                                    <div className="grid grid-cols-2 gap-2">
                                        <input
                                            type="text"
                                            value={drafts[`${f.name}_ar`] || ''}
                                            onChange={(e) => setDrafts((d) => ({ ...d, [`${f.name}_ar`]: e.target.value }))}
                                            placeholder="بالعربية"
                                            className="border rounded-xl py-2 px-3"
                                        />
                                        <input
                                            type="text"
                                            value={drafts[`${f.name}_en`] || ''}
                                            onChange={(e) => setDrafts((d) => ({ ...d, [`${f.name}_en`]: e.target.value }))}
                                            placeholder="بالإنجليزية"
                                            className="border rounded-xl py-2 px-3"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => addToTranslationArray(f.name)}
                                        className="px-4 py-2 bg-primary text-white rounded-lg flex items-center gap-1"
                                    >
                                        <PlusIcon className="w-4 h-4" /> أضف
                                    </button>
                                </div>

                                {/* Existing items */}
                                {arr.length > 0 && (
                                    <div className="mt-3 space-y-3">
                                        {arr.map((item, idx) => (
                                            <div key={`${f.name}-${idx}`} className="p-3 border border-gray-200 rounded-lg bg-white">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <input
                                                        type="text"
                                                        value={item.ar || ''}
                                                        onChange={(e) => updateTranslationArrayItem(f.name, idx, 'ar', e.target.value)}
                                                        placeholder="بالعربية"
                                                        className="border rounded-xl py-2 px-3"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={item.en || ''}
                                                        onChange={(e) => updateTranslationArrayItem(f.name, idx, 'en', e.target.value)}
                                                        placeholder="بالإنجليزية"
                                                        className="border rounded-xl py-2 px-3"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeFromTranslationArray(f.name, idx)}
                                                    className="mt-2 px-2 py-1 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 flex items-center gap-1"
                                                    title="حذف"
                                                >
                                                    <XMarkIcon className="w-4 h-4" /> حذف
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {errors[f.name]?.message && <p className="text-xs text-red-600 mt-1">{String(errors[f.name].message)}</p>}
                            </div>
                        );
                    }

                    // ===== Regular Repeater =====
                    if (f.type === 'repeater') {
                        const arr = watch(f.name) || [];
                        return (
                            <div key={f.name} className={f.fullWidth ? 'col-span-2' : ''}>
                                <label className="block mb-1">{f.label}</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={drafts[f.name] || ''}
                                        onChange={(e) => setDrafts((d) => ({ ...d, [f.name]: e.target.value }))}
                                        placeholder={f.placeholder || 'أدخل قيمة ثم اضغط أضف'}
                                        className="flex-1 border rounded-xl py-2 px-3"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => addToArray(f.name)}
                                        className="px-4 py-2 bg-primary text-white rounded-lg flex items-center gap-1"
                                    >
                                        <PlusIcon className="w-4 h-4" /> أضف
                                    </button>
                                </div>

                                {arr.length > 0 && (
                                    <div className="mt-2 space-y-2">
                                        {arr.map((val, idx) => (
                                            <div key={`${f.name}-${idx}`} className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={val}
                                                    onChange={(e) => updateArrayItem(f.name, idx, e.target.value)}
                                                    className="flex-1 border rounded-xl py-2 px-3"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeFromArray(f.name, idx)}
                                                    className="প-2 rounded-lg bg-[#EFEFEF]"
                                                    title="حذف"
                                                >
                                                    <XMarkIcon className="w-5 h-5 text-gray-700" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {errors[f.name]?.message && <p className="text-xs text-red-600 mt-1">{String(errors[f.name].message)}</p>}
                            </div>
                        );
                    }

                    // ===== File / Image input =====
                    if (f.type === 'file' || f.type === 'image') {
                        const accept = f.accept || (f.type === 'image' || f.name === 'image' ? 'image/*' : undefined);
                        const files = watch(f.name);
                        const selectedLabel =
                            files?.[0]?.name ||
                            (Array.isArray(files) && files.length ? files.map((x) => x?.name).filter(Boolean).join(', ') : '');

                        return (
                            <div key={f.name} className={f.fullWidth ? 'col-span-2' : ''}>
                                <label className="block mb-1">{f.label}</label>
                                <input
                                    type="file"
                                    accept={accept}
                                    multiple={!!f.multiple}
                                    {...register(f.name, f.validation)}
                                    className="w-full border rounded-xl py-2 px-3"
                                />
                                {/* Show current preview if provided and no new file selected */}
                                {f.previewUrl && !selectedLabel && (
                                    <div className="mt-2">
                                        <img
                                            src={f.previewUrl}
                                            alt="current"
                                            className="max-h-40 rounded-lg border"
                                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                        />
                                        <p className="text-xs text-gray-500 mt-1">الصورة الحالية — اختر ملفًا لاستبدالها</p>
                                    </div>
                                )}
                                {selectedLabel && <p className="mt-1 text-xs text-gray-500">تم اختيار: {selectedLabel}</p>}
                                {errors[f.name]?.message && <p className="text-xs text-red-600 mt-1">{String(errors[f.name].message)}</p>}
                            </div>
                        );
                    }

                    // ===== Default input =====
                    return (
                        <div key={f.name} className={f.fullWidth ? 'col-span-2' : ''}>
                            <label className="block mb-1">{f.label}</label>
                            <input
                                type={f.type || 'text'}
                                placeholder={f.placeholder}
                                {...register(f.name, f.validation)}
                                className="w-full border rounded-xl py-2 px-3"
                            />
                            {errors[f.name]?.message && <p className="text-xs text-red-600 mt-1">{String(errors[f.name].message)}</p>}
                        </div>
                    );
                })}
            </div>

            {/* Action buttons with Arabic labels */}
            <div className="mt-6 flex gap-3">
                <button type="button" onClick={onCancel} className="px-4 py-2 border rounded-lg">إلغاء</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg">{submitLabel}</button>
            </div>
        </form>
    );
}
