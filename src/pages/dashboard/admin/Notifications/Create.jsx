// src/pages/dashboard/admin/notifications/Create.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import AccountForm from '../../../../components/Form';
import { NotificationsService } from '../../../../services/notificationsService';
import toast from 'react-hot-toast';

export default function Create() {
    const navigate = useNavigate();

    const typeOptions = [
        { label: 'تنبيه', value: 'alert' },
        { label: 'عرض', value: 'offer' },
        { label: 'اشعار', value: 'notification' },
    ];

    const targetOptions = [
        { label: 'متدرب', value: 'student' },
        { label: 'خبير', value: 'teacher' },
    ];

    const fields = [
        {
            name: 'title',
            label: 'عنوان الإشعار',
            placeholder: 'أدخل عنوان الإشعار',
            validation: { required: true },
        },
        {
            name: 'type',
            label: 'نوع الإشعار',
            options: typeOptions,
            validation: { required: true },
        },
        {
            name: 'content',
            label: 'المحتوى',
            placeholder: 'أدخل المحتوى',
            validation: { required: true },
        },
        {
            name: 'target',
            label: 'الفئة المستهدفة',
            options: targetOptions,
            validation: { required: true },
        },
    ];

    const initialValues = {
        title: '',
        type: '',
        content: '',
        target: '',
    };

    const onSubmit = async (data) => {
        const payload = {
            title: data.title,
            content: data.content,
            type: data.type,
            users_type: [data.target],
        };

        try {
            await NotificationsService.create(payload);
            toast.success("تم إضافة الإشعار بنجاح");
            navigate('/admin/notifications');
        } catch (err) {
            console.error(err);
            toast.error("فشل في إنشاء الإشعار");
            throw err;
        }
    };

    const onCancel = () => navigate(-1);

    return (
        <div className="p-6">
            <h1 className='text-3xl font-bold mb-4'> الإشعارات</h1>
            <div className='bg-white p-6 rounded-lg shadow'>
                <h2 className="text-2xl font-bold mb-4">إضافة إشعار جديد</h2>
                <AccountForm
                    fields={fields}
                    initialValues={initialValues}
                    onSubmit={onSubmit}
                    onCancel={onCancel}
                    submitLabel="إضافة إشعار"
                />
            </div>
        </div>
    );
}
