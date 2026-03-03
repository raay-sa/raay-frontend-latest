// src/pages/dashboard/admin/FAQs/Edit.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Form from '../../../../components/Form';
import { FaqsService } from '../../../../services/faqsService';
import toast from 'react-hot-toast';

const mapUserTypeToUi = (u) => (u === 'student' ? 'متدرب' : 'خبير');
const mapUiToUserType = (v) => (v === 'متدرب' ? 'student' : 'teacher');

export default function EditFaq() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [initialValues, setInitialValues] = useState(null);
  const [loading, setLoading] = useState(true);

  const targetOptions = [
    { label: 'متدرب', value: 'متدرب' },
    { label: 'خبير', value: 'خبير' },
  ];

  const fields = [
    {
      name: 'question',
      label: 'عنوان السؤال',
      placeholder: 'أدخل عنوان السؤال',
      validation: { required: true },
      fullWidth: true,
    },
    {
      name: 'target',
      label: 'الفئة المستهدفة',
      options: targetOptions,
      validation: { required: true },
    },
    {
      name: 'content',
      label: 'المحتوى',
      placeholder: 'أدخل المحتوى',
      validation: { required: true },
      type: 'textarea',
      fullWidth: true,
    },
  ];

  useEffect(() => {
    const fetchOne = async () => {
      setLoading(true);
      try {
        const res = await FaqsService.get(id);
        const row = res?.data?.row || res?.data?.data || res?.data;

        setInitialValues({
          question: row.question ?? '',
          target: mapUserTypeToUi(row.user_type),
          content: row.answer ?? '',
        });
      } catch (e) {
        console.error(e);
        toast.error('تعذر تحميل السؤال');
        navigate('/admin/faqs');
      } finally {
        setLoading(false);
      }
    };
    fetchOne();
  }, [id, navigate]);

  const onSubmit = async (data) => {
    const payload = {
      question: data.question,
      answer: data.content,
      user_type: mapUiToUserType(data.target),
      _method: 'put',
    };
    try {
      await FaqsService.updatey(id, payload);
      toast.success('تم تعديل السؤال');
      navigate('/admin/faq');
    } catch (e) {
      console.error(e);
      toast.error('فشل في تعديل السؤال');
      throw e; 
    }
  };

  if (loading || !initialValues) return <div className="p-6">جارٍ التحميل…</div>;

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <h2 className="text-2xl font-bold">الأسئلة الشائعة</h2>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-bold mb-4">تعديل الأسئلة الشائعة</h3>

        <Form
          fields={fields}
          initialValues={initialValues}
          onSubmit={onSubmit}
          onCancel={() => navigate(-1)}
          submitLabel="حفظ"
        />
      </div>
    </div>
  );
}
