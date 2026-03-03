// src/pages/dashboard/admin/EditStudent.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Form from '../../../../components/Form';
import { AccountsService } from '../../../../services/accountsService';

export default function EditStudent() {
    const { id } = useParams();
    const [initial, setInitial] = useState(null);

    useEffect(() => {
        AccountsService.getStudent(id).then(res => {
            if (res.data.success) {
                const student = res.data.row;
                setInitial({
                    name: student.name,
                    phone: student.phone,
                    email: student.email,
                    status: student.status === 'نشط' ? 'active' : 'inactive'
                });
            }
        });
    }, [id]);

    const handleSubmit = (data) => {
        AccountsService.updateStudent(id, data).then(() => window.history.back());
    };

    const statusOptions = [
        { label: 'اختر حالة الحساب', value: '' },
        { label: 'نشط', value: 'active' },
        { label: 'غير نشط', value: 'inactive' },
    ];


    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6">إدارة الحسابات</h1>
            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-2xl font-bold mb-4">تعديل حساب المتدرب</h2>
                <Form
                    fields={[
                        { name: 'name', label: 'الاسم', type: 'text', validation: { required: true } },
                        { name: 'phone', label: 'رقم الاتصال', type: 'text', validation: { required: true } },
                        { name: 'email', label: 'البريد الإلكتروني', type: 'email', validation: { required: true } },
                        { name: 'status', label: 'حالة الحساب', type: 'select' },
                    ]}
                    initialValues={initial}
                    statusOptions={statusOptions}
                    onSubmit={handleSubmit}
                    onCancel={() => window.history.back()}
                    submitLabel="حفظ"
                />
            </div>
        </div>
    );
}
