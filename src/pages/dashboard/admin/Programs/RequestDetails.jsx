import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  CheckIcon,
  XMarkIcon,
  PlayIcon,
  DocumentTextIcon,
  UserIcon,
  TagIcon,
  CalendarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { ProgramsService } from '../../../../services/programsService';
import { toast } from 'react-hot-toast';
import moment from 'moment-hijri';

export default function ProgramRequestDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState(null);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    fetchProgramDetails();
  }, [id]);

  const fetchProgramDetails = async () => {
    try {
      setLoading(true);
      const response = await ProgramsService.getRequests(1, { id });
      const responseData = response.data;
      
      if (responseData.success && responseData.data.data.length > 0) {
        setProgram(responseData.data.data[0]);
      } else {
        toast.error('البرنامج غير موجود');
        navigate('/admin/programs/requests');
      }
    } catch (error) {
      console.error('Failed to fetch program details:', error);
      toast.error('تعذر تحميل تفاصيل البرنامج');
      navigate('/admin/programs/requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setApproving(true);
      await ProgramsService.approveRequests([parseInt(id)]);
      toast.success('تم اعتماد البرنامج بنجاح');
      navigate('/admin/programs/requests');
    } catch (error) {
      console.error('Failed to approve program:', error);
      toast.error('تعذر اعتماد البرنامج');
    } finally {
      setApproving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6" dir="rtl">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="h-64 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="p-6" dir="rtl">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-600">البرنامج غير موجود</h1>
        </div>
      </div>
    );
  }

  const arTranslation = program.translations?.find(t => t.locale === 'ar');
  const enTranslation = program.translations?.find(t => t.locale === 'en');
  const categoryAr = program.category?.translations?.find(t => t.locale === 'ar');
  const categoryEn = program.category?.translations?.find(t => t.locale === 'en');

  return (
    <div className="p-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/admin/programs/requests')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          العودة لطلبات البرامج
        </button>
        
        {!program.is_approved && (
          <button
            onClick={handleApprove}
            disabled={approving}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            <CheckIcon className="w-5 h-5" />
            {approving ? 'جاري الاعتماد...' : 'اعتماد البرنامج'}
          </button>
        )}
      </div>

      <h1 className="text-2xl font-bold mb-6">تفاصيل البرنامج</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Program Image */}
          <div className="bg-white rounded-lg shadow p-6">
            <img
              src={`${import.meta.env.VITE_BASE_URL}/${program.image}`}
              alt={arTranslation?.title || enTranslation?.title}
              className="w-full h-64 object-cover rounded-lg mb-4"
            />
            
            {/* Program Title */}
            <h2 className="text-2xl font-bold mb-2">
              {arTranslation?.title || enTranslation?.title}
            </h2>
            
            {/* English Title */}
            {enTranslation?.title && (
              <h3 className="text-lg text-gray-600 mb-4">
                {enTranslation.title}
              </h3>
            )}

            {/* Status Badge */}
            <div className="mb-4">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  program.is_approved
                    ? 'bg-green-100 text-green-600'
                    : 'bg-yellow-100 text-yellow-600'
                }`}
              >
                {program.is_approved ? 'معتمد' : 'في الانتظار'}
              </span>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">الوصف</h3>
              <div className="text-gray-700 space-y-2">
                {arTranslation?.description && (
                  <div>
                    <strong>العربية:</strong>
                    <p className="mt-1">{arTranslation.description}</p>
                  </div>
                )}
                {enTranslation?.description && (
                  <div>
                    <strong>English:</strong>
                    <p className="mt-1">{enTranslation.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Learning Outcomes */}
            {arTranslation?.learning && arTranslation.learning.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">ما سيتعلمه في هذا البرنامج</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  {arTranslation.learning.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Requirements */}
            {arTranslation?.requirement && arTranslation.requirement.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">متطلبات البرنامج</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  {arTranslation.requirement.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Program Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">معلومات البرنامج</h3>
            
            <div className="space-y-4">
              {/* Price */}
              <div className="flex items-center gap-3">
                <CurrencyDollarIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">السعر</p>
                  <p className="font-semibold">{program.price} ر.س</p>
                </div>
              </div>

              {/* Type */}
              <div className="flex items-center gap-3">
                {program.type === 'live' ? (
                  <PlayIcon className="w-5 h-5 text-blue-500" />
                ) : (
                  <DocumentTextIcon className="w-5 h-5 text-green-500" />
                )}
                <div>
                  <p className="text-sm text-gray-600">النوع</p>
                  <p className="font-semibold">
                    {program.type === 'live' ? 'برنامج مباشر' : 'برنامج مسجل'}
                  </p>
                </div>
              </div>

              {/* Category */}
              <div className="flex items-center gap-3">
                <TagIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">التخصص</p>
                  <p className="font-semibold">
                    {categoryAr?.title || categoryEn?.title || 'غير محدد'}
                  </p>
                </div>
              </div>

              {/* Teacher */}
              <div className="flex items-center gap-3">
                <UserIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">المدرب</p>
                  <p className="font-semibold">{program.teacher?.name || 'غير محدد'}</p>
                </div>
              </div>

              {/* Created Date */}
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">تاريخ الطلب</p>
                  <p className="font-semibold">
                    {moment(program.created_at).format('YYYY/MM/DD')}
                  </p>
                </div>
              </div>

              {/* Live Program Specific Info */}
              {program.type === 'live' && (
                <>
                  {program.date_from && (
                    <div className="flex items-center gap-3">
                      <CalendarIcon className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">تاريخ البداية</p>
                        <p className="font-semibold">
                          {moment(program.date_from).format('YYYY/MM/DD')}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {program.date_to && (
                    <div className="flex items-center gap-3">
                      <CalendarIcon className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">تاريخ النهاية</p>
                        <p className="font-semibold">
                          {moment(program.date_to).format('YYYY/MM/DD')}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {program.time && (
                    <div className="flex items-center gap-3">
                      <ClockIcon className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">الوقت</p>
                        <p className="font-semibold">{program.time}</p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Registered Program Specific Info */}
              {program.type === 'registered' && program.duration && (
                <div className="flex items-center gap-3">
                  <ClockIcon className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">المدة</p>
                    <p className="font-semibold">{program.duration} يوم</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Statistics */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">الإحصائيات</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">عدد المشتركين</span>
                <span className="font-semibold">{program.subscriptions_count || 0}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">التقييم المتوسط</span>
                <div className="flex items-center gap-1">
                  <StarIcon className="w-4 h-4 text-yellow-400" />
                  <span className="font-semibold">{program.average_score || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
