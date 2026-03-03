// src/pages/dashboard/admin/notifications/Edit.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AccountForm from '../../../../components/Form';
import { NotificationsService } from '../../../../services/notificationsService';
import toast from 'react-hot-toast';

export default function Edit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [initialValues, setInitialValues] = useState(null);
  const [loading, setLoading] = useState(true);

  // NOTE: API expects: alert | offer | notice
  const typeOptions = [
    { label: 'تنبيه', value: 'alert' },
    { label: 'عرض', value: 'offer' },
    { label: 'اشعار', value: 'notice' },
  ];

  // API expects users_type: student | teacher (we send as array)
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
      type: 'textarea', // nicer UX; remove this line to use input
      validation: { required: true },
    },
    {
      name: 'target',
      label: 'الفئة المستهدفة',
      options: targetOptions,
      validation: { required: true },
    },
  ];

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await NotificationsService.get(id);
        const row = res?.data?.row || res?.data; // flex if backend returns row at root
        if (!row) throw new Error('No row returned');

        // users_type is a JSON string like '["student","teacher"]'
        let usersArr = [];
        try {
          const parsed = typeof row.users_type === 'string' ? JSON.parse(row.users_type) : row.users_type;
          usersArr = Array.isArray(parsed) ? parsed : [];
        } catch {
          usersArr = [];
        }

        // Choose single target for edit (fallback to 'student' if both)
        const singleTarget =
          usersArr.includes('student') && usersArr.includes('teacher')
            ? 'student'
            : usersArr.includes('student')
            ? 'student'
            : usersArr.includes('teacher')
            ? 'teacher'
            : 'student';

        setInitialValues({
          title: row.title ?? '',
          content: row.content ?? '',
          type: row.type ?? 'alert', // alert | offer | notice
          target: singleTarget,      // student | teacher
        });
      } catch (err) {
        console.error(err);
        toast.error('تعذر تحميل بيانات الإشعار');
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [id]);

  const onSubmit = async (data) => {
    const payload = {
      title: data.title,
      content: data.content,
      type: data.type,               // alert | offer | notice
      users_type: [data.target],     // array per API
    };

    try {
      await NotificationsService.update(id, payload);
      toast.success('تم تعديل الإشعار');
      navigate('/admin/notifications');
    } catch (err) {
      console.error(err);
      toast.error('فشل في تعديل الإشعار');
      throw err;
    }
  };

  const onCancel = () => navigate(-1);

  if (loading || !initialValues) {
    return <div className="p-6">جارٍ التحميل…</div>;
  }

  return (
    <div className="p-6" dir="rtl">
      <h1 className="text-3xl font-bold mb-4">الإشعارات</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">تعديل بيانات الإشعار</h2>
        <AccountForm
          fields={fields}
          initialValues={initialValues}
          onSubmit={onSubmit}
          onCancel={onCancel}
          submitLabel="حفظ"
        />
      </div>
    </div>
  );
}
