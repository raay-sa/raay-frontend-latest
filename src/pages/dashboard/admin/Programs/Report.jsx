// src/pages/dashboard/admin/Programs/Report.jsx
import React, { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeftIcon, 
  UserGroupIcon, 
  AcademicCapIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  TagIcon,
  StarIcon,
  DocumentTextIcon,
  TrophyIcon,
  ChartBarIcon,
  CloudArrowDownIcon
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";
import DataTable from "../../../../components/DataTable";
import useProgramReport from "../../../../hooks/useProgramReport";
import { ProgramsService } from "../../../../services/programsService";
import toast from "react-hot-toast";
import moment from "moment-hijri";

const AR = {
  assignments: {
    completed: "مكتملة",
    not_completed: "غير مكتملة", 
    not_started: "لم يبدأ",
  },
};

const badge = (text, color) => (
  <span
    className={`text-xs px-2 py-1 rounded-md ${
      color === "green"
        ? "bg-green-100 text-green-700"
        : color === "amber"
        ? "bg-amber-100 text-amber-700"
        : color === "blue"
        ? "bg-blue-100 text-blue-700"
        : color === "gray"
        ? "bg-gray-100 text-gray-600"
        : "bg-red-100 text-red-700"
    }`}
  >
    {text}
  </span>
);

export default function ProgramReport() {
  const { id: programId } = useParams();
  const navigate = useNavigate();
  
  const { program, students, pagination, loading, setPage } = useProgramReport(programId);

  // Export functionality
  const handleExportReport = async () => {
    try {
      const response = await ProgramsService.exportProgramReport(programId);
      const blob = new Blob([response.data], { 
        type: response.headers['content-type'] || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from response headers or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = `program_${programId}_report.xlsx`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('تم تحميل تقرير البرنامج بنجاح');
    } catch (error) {
      console.error('Failed to export program report:', error);
      toast.error('تعذر تحميل تقرير البرنامج');
    }
  };

  // Table columns for students
  const columns = useMemo(
    () => [
      { header: "#", accessor: "idx" },
      {
        header: "صورة المتدرب",
        accessor: "image",
        Cell: (img) => (
          <img
            src={
              img
                ? `${import.meta.env.VITE_BASE_URL}/${img}`
                : "/images/avatar.png"
            }
            alt=""
            className="w-12 h-12 rounded-lg object-cover"
          />
        ),
      },
      { header: "اسم المتدرب", accessor: "name" },
      { header: "البريد الإلكتروني", accessor: "email" },
      { header: "رقم الهاتف", accessor: "phone" },
      {
        header: "عدد البرامج",
        accessor: "programs_count",
        Cell: (v) => v || 0,
      },
      {
        header: "نسبة الإنجاز",
        accessor: "student_progress",
        Cell: (v) => (
          <span className={`px-2 py-1 text-xs rounded-full ${
            v >= 80 ? 'bg-green-100 text-green-600' :
            v >= 60 ? 'bg-yellow-100 text-yellow-600' :
            v >= 40 ? 'bg-orange-100 text-orange-600' :
            'bg-red-100 text-red-600'
          }`}>
            {v}%
          </span>
        ),
      },
    ],
    []
  );

  if (loading && !program) {
    return (
      <div className="p-3 lg:p-6" dir="rtl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-64 bg-gray-200 rounded-lg"></div>
              <div className="h-32 bg-gray-200 rounded-lg"></div>
            </div>
            <div className="space-y-4">
              <div className="h-48 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="p-3 lg:p-6" dir="rtl">
        <div className="text-center py-12">
          <p className="text-gray-500">لم يتم العثور على البرنامج</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 lg:p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">تقرير البرنامج</h1>
            <p className="text-gray-600">
              {program.translations?.find(t => t.locale === 'ar')?.title || 
               program.translations?.[0]?.title || 
               'بدون عنوان'}
            </p>
          </div>
        </div>
        
        {/* Export Button */}
        <button
          onClick={handleExportReport}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <CloudArrowDownIcon className="w-5 h-5" />
          <span>تصدير التقرير</span>
        </button>
      </div>

      {/* Program Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserGroupIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">عدد المتدربين</p>
              <p className="text-2xl font-bold text-gray-900">{program.subscriptions_count || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CurrencyDollarIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">السعر</p>
              <p className="text-2xl font-bold text-gray-900">{program.price} ر.س</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TagIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">نوع البرنامج</p>
              <p className="text-lg font-semibold text-gray-900">
                {program.type === 'live' ? 'مباشر' : 'مسجل'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <CalendarIcon className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">تاريخ الإنشاء</p>
              <p className="text-sm font-semibold text-gray-900">
                {moment(program.created_at).format('YYYY/MM/DD')}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <ChartBarIcon className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">تقدم الطلاب</p>
              <p className="text-2xl font-bold text-gray-900">{program.students_progress || 0}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Program Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Program Info Card */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">معلومات البرنامج</h2>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  {program.image && (
                    <img
                      src={`${import.meta.env.VITE_BASE_URL}/${program.image}`}
                      alt={program.translations?.find(t => t.locale === 'ar')?.title || program.translations?.[0]?.title || 'Program'}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {program.translations?.find(t => t.locale === 'ar')?.title || 
                       program.translations?.[0]?.title || 
                       'بدون عنوان'}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {program.translations?.find(t => t.locale === 'ar')?.description || 
                       program.translations?.[0]?.description || 
                       'بدون وصف'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-gray-600">المستوى</p>
                    <p className="font-semibold">{program.level || 'غير محدد'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">الشهادة</p>
                    <p className="font-semibold">
                      {program.have_certificate ? 'متوفرة' : 'غير متوفرة'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">نوع المستخدم</p>
                    <p className="font-semibold">
                      {program.user_type === 'trainee' ? 'متدرب' : program.user_type}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">الحالة</p>
                    <p className="font-semibold">
                      {program.status ? badge('نشط', 'green') : badge('غير نشط', 'red')}
                    </p>
                  </div>
                </div>

                {/* Learning Objectives */}
                {(() => {
                  const arTranslation = program.translations?.find(t => t.locale === 'ar');
                  const learning = arTranslation?.learning || program.translations?.[0]?.learning;
                  return learning && learning.length > 0 && (
                    <div className="pt-4 border-t">
                      <h4 className="font-semibold text-gray-900 mb-2">أهداف التعلم</h4>
                      <ul className="space-y-1">
                        {learning.map((item, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })()}

                {/* Requirements */}
                {(() => {
                  const arTranslation = program.translations?.find(t => t.locale === 'ar');
                  const requirements = arTranslation?.requirement || program.translations?.[0]?.requirement;
                  return requirements && requirements.length > 0 && (
                    <div className="pt-4 border-t">
                      <h4 className="font-semibold text-gray-900 mb-2">المتطلبات</h4>
                      <ul className="space-y-1">
                        {requirements.map((item, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Students Table */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">قائمة المتدربين</h2>
              
              <DataTable
                data={students}
                columns={columns}
                loading={loading}
                selectable={false}
                showActions={false}
                serverPagination={{
                  currentPage: pagination.current_page || 1,
                  totalPages: pagination.last_page || 1,
                  onPageChange: setPage,
                }}
                bulkActions={() => null}
              />
            </div>
          </div>
        </div>

        {/* Teacher Info Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">معلومات المدرب</h2>
              
              {program.teacher ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    {program.teacher.image ? (
                      <img
                        src={`${import.meta.env.VITE_BASE_URL}/${program.teacher.image}`}
                        alt={program.teacher.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                        <AcademicCapIcon className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900">{program.teacher.name}</h3>
                      <p className="text-sm text-gray-600">{program.teacher.email}</p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t">
                    <div>
                      <p className="text-sm text-gray-600">رقم الهاتف</p>
                      <p className="font-semibold">{program.teacher.phone || 'غير محدد'}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600">النوع</p>
                      <p className="font-semibold">
                        {program.teacher.type === 'teacher' ? 'مدرب' : program.teacher.type}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600">الحالة</p>
                      <p className="font-semibold">
                        {program.teacher.status === 'active' ? badge('نشط', 'green') : badge('غير نشط', 'red')}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600">الموافقة</p>
                      <p className="font-semibold">
                        {program.teacher.is_approved ? badge('موافق عليه', 'green') : badge('غير موافق', 'red')}
                      </p>
                    </div>

                    {program.teacher.bio && (
                      <div>
                        <p className="text-sm text-gray-600">نبذة شخصية</p>
                        <p className="text-sm text-gray-900">{program.teacher.bio}</p>
                      </div>
                    )}
                  </div>

                  {/* Social Links */}
                  {(program.teacher.facebook || program.teacher.instagram || program.teacher.twitter || program.teacher.linkedin) && (
                    <div className="pt-4 border-t">
                      <p className="text-sm text-gray-600 mb-2">روابط التواصل</p>
                      <div className="flex gap-2">
                        {program.teacher.facebook && (
                          <a href={program.teacher.facebook} target="_blank" rel="noopener noreferrer" 
                             className="text-blue-600 hover:text-blue-800 text-sm">
                            Facebook
                          </a>
                        )}
                        {program.teacher.instagram && (
                          <a href={program.teacher.instagram} target="_blank" rel="noopener noreferrer" 
                             className="text-pink-600 hover:text-pink-800 text-sm">
                            Instagram
                          </a>
                        )}
                        {program.teacher.twitter && (
                          <a href={program.teacher.twitter} target="_blank" rel="noopener noreferrer" 
                             className="text-blue-400 hover:text-blue-600 text-sm">
                            Twitter
                          </a>
                        )}
                        {program.teacher.linkedin && (
                          <a href={program.teacher.linkedin} target="_blank" rel="noopener noreferrer" 
                             className="text-blue-700 hover:text-blue-900 text-sm">
                            LinkedIn
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AcademicCapIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">لا يوجد مدرب مسجل</p>
                </div>
              )}
            </div>
          </div>

          {/* Category Info */}
          {program.category && (
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">التصنيف</h2>
                
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {program.category.translations?.find(t => t.locale === 'ar')?.title || 
                       program.category.translations?.[0]?.title || 
                       'بدون عنوان'}
                    </p>
                    <p className="text-sm text-gray-600">
                      تم الإنشاء: {moment(program.category.created_at).format('YYYY/MM/DD')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
