// src/pages/dashboard/admin/CreateStudent.jsx
import React from 'react';
import Form from '../../../../components/Form';
import { AccountsService } from '../../../../services/accountsService';

export default function CreateStudent() {
    const studentFields = [
        { name: 'name', label: 'الاسم', type: 'text', placeholder: 'أدخل الاسم', validation: { required: true } },
        { name: 'phone', label: 'رقم الاتصال', type: 'text', placeholder: 'أدخل رقم الاتصال', validation: { required: true } },
        { name: 'email', label: 'البريد الإلكتروني', type: 'email', placeholder: 'أدخل البريد الإلكتروني', validation: { required: true } },
        { name: 'password', label: 'كلمة المرور', type: 'password', placeholder: 'أدخل كلمة المرور', validation: { required: true } },
        { name: 'status', label: 'حالة الحساب', type: 'select' },
    ];

    const statusOptions = [
        { label: 'اختر حالة الحساب', value: '' },
        { label: 'نشط', value: 'active' },
        { label: 'غير نشط', value: 'inactive' },
    ];

    const handleSubmit = async (data) => {
       const res = await AccountsService.createStudent(data);
        window.history.back();
    };

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6">إدارة الحسابات</h1>
            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-2xl font-bold mb-4">إضافة حساب للمتدرب</h2>
                <Form
                    fields={studentFields}
                    initialValues={{ name: '', phone: '', email: '', password: '', status: '' }}
                    statusOptions={statusOptions}
                    onSubmit={handleSubmit}
                    onCancel={() => window.history.back()}
                    submitLabel="إضافة حساب"
                />
            </div>
        </div>
    );
}
