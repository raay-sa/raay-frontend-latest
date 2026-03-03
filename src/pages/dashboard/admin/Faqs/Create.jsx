// src/pages/dashboard/admin/FAQs/Create.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Form from '../../../../components/Form';
import { FaqsService } from '../../../../services/faqsService';
import toast from 'react-hot-toast';

const mapUiToUserType = (v) => (v === 'متدرب' ? 'student' : 'teacher');

export default function CreateFaq() {
  const navigate = useNavigate();

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

  const initialValues = { question: '', target: '', content: '' };

  const onSubmit = async (data) => {
    const payload = {
      question: data.question,
      answer: data.content,
      user_type: mapUiToUserType(data.target),
    };
    try {
      await FaqsService.create(payload);
      toast.success('تم إضافة السؤال');
      navigate('/admin/faq');
    } catch (e) {
      console.error(e);
      toast.error('فشل في إضافة السؤال');
      throw e;
    }
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <h2 className="text-2xl font-bold">الأسئلة الشائعة</h2>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-bold mb-4">إضافة أسئلة شائعة</h3>

        <Form
          fields={fields}
          initialValues={initialValues}
          onSubmit={onSubmit}
          onCancel={() => navigate(-1)}
          submitLabel="إضافة سؤال"
        />
      </div>
    </div>
  );
}
