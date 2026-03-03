// src/pages/dashboard/admin/CreateExpert.jsx
import React, { useEffect, useState } from 'react';
import AccountForm from '../../../../components/Form';
import { AccountsService } from '../../../../services/accountsService';

export default function CreateExpert() {
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        AccountsService.fetchCategories().then(res => {
            if (res.data.success) {
                const categoriesData = res.data.data;
                // Process categories to extract titles from translations
                const processedCategories = categoriesData.map(category => {
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
            }
        });
    }, []);

    const handleSubmit = async (data) => {
        const payload = {
            name: data.name,
            phone: data.phone,
            email: data.email,
            password: data.password,
            status: data.status === 'نشط' ? 'active' : 'inactive',
            categories: data.specialization,
        };
       const res = await AccountsService.createTeacher(payload).then(() => window.history.back());
    };

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6">إدارة الحسابات</h1>
            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-2xl font-bold mb-4">إضافة حساب للخبير</h2>
                <AccountForm
                    fields={[
                        { name: 'name', label: 'الاسم', type: 'text', validation: { required: true } },
                        { name: 'phone', label: 'رقم الاتصال', type: 'text', validation: { required: true } },
                        { name: 'email', label: 'البريد الإلكتروني', type: 'email', validation: { required: true } },
                        { name: 'password', label: 'كلمة المرور', type: 'password', validation: { required: true } },
                        { name: 'specialization', label: 'التخصص', type: 'multi-select' },
                        { name: 'status', label: 'حالة الحساب', type: 'select' },
                    ]}
                    initialValues={{
                        name: '', phone: '', email: '', password: '', specialization: [], otherSpecialization: '', status: '',
                    }}
                    statusOptions={[
                        { label: 'اختر حالة الحساب', value: '' },
                        { label: 'نشط', value: 'نشط' },
                        { label: 'غير نشط', value: 'غير نشط' },
                    ]}
                    specializationOptions={categories.map(c => ({ label: c.title, value: c.id }))}
                    onSubmit={handleSubmit}
                    onCancel={() => window.history.back()}
                    submitLabel="إضافة حساب"
                />
            </div>
        </div>
    );
}
