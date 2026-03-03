import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon, UsersIcon, LinkIcon } from '@heroicons/react/24/outline';
import { AdminBannerService } from '../../../../services/bannerService';
import TraineesService from '../../../../services/admin/traineesService';
import { toast } from 'react-hot-toast';
import DataTable from '../../../../components/DataTable';
import PageSkeleton from '../../../../components/Loaders/PageSkeleton';

export default function InterestedStudents() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [banner, setBanner] = useState(null);
    const [students, setStudents] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [selectedProgramId, setSelectedProgramId] = useState('');
    const [linking, setLinking] = useState(false);
    const [linkModalOpen, setLinkModalOpen] = useState(false);
    const [emailSubject, setEmailSubject] = useState('');
    const [emailBody, setEmailBody] = useState('');

    const fetchPrograms = useCallback(async () => {
        try {
            const response = await TraineesService.programsList();
            if (response.data?.success !== false) {
                const programsData = response.data?.data || response.data || [];
                console.log('Programs data:', programsData);
                setPrograms(programsData);
            }
        } catch (error) {
            console.error('Failed to fetch programs:', error);
            toast.error('فشل في تحميل قائمة البرامج');
        }
    }, []);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [bannerResponse] = await Promise.all([
                AdminBannerService.getBanner(id),
                fetchPrograms()
            ]);

            // Debug logging
            console.log('Banner response:', bannerResponse.data);

            if (bannerResponse.data?.success !== false) {
                const bannerData = bannerResponse.data?.data;
                setBanner(bannerData);
                
                // Extract interests from banner data
                const interestsArray = bannerData?.interests || [];
                console.log('Interests array:', interestsArray);
                setStudents(Array.isArray(interestsArray) ? interestsArray : []);
            } else {
                setBanner(null);
                setStudents([]);
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
            toast.error('فشل في تحميل البيانات');
            setBanner(null);
            setStudents([]);
        } finally {
            setLoading(false);
        }
    }, [id, fetchPrograms]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleLinkToProgram = () => {
        if (!selectedProgramId) {
            toast.error('يرجى اختيار برنامج');
            return;
        }
        setLinkModalOpen(true);
    };

    const handleLinkConfirm = async () => {
        if (!emailSubject.trim() || !emailBody.trim()) {
            toast.error('يرجى ملء جميع الحقول المطلوبة');
            return;
        }

        try {
            setLinking(true);
            const response = await AdminBannerService.linkToProgram(id, selectedProgramId, {
                email_subject: emailSubject.trim(),
                email_body: emailBody.trim()
            });
            
            if (response.data?.success !== false) {
                toast.success('تم ربط البانر بالبرنامج بنجاح');
                // Refresh banner data to show updated program info
                await fetchData();
                setSelectedProgramId('');
                setEmailSubject('');
                setEmailBody('');
                setLinkModalOpen(false);
            } else {
                toast.error(response.data?.message || 'فشل في ربط البانر بالبرنامج');
            }
        } catch (error) {
            console.error('Failed to link banner to program:', error);
            toast.error('فشل في ربط البانر بالبرنامج');
        } finally {
            setLinking(false);
        }
    };

    const handleLinkModalClose = () => {
        setLinkModalOpen(false);
        setEmailSubject('');
        setEmailBody('');
    };

    const columns = [
        { header: '#', accessor: 'id' },
        { header: 'اسم الطالب', accessor: 'student_name' },
        { header: 'البريد الإلكتروني', accessor: 'student_email' },
        { header: 'رقم الهاتف', accessor: 'student_phone' },
        {
            header: 'تاريخ التسجيل',
            accessor: 'created_at',
            Cell: (date) => new Date(date).toLocaleDateString('ar-SA'),
        },
    ];

    const rows = (Array.isArray(students) ? students : []).map((interest, index) => ({
        id: index + 1,
        student_name: interest.student?.name || 'غير محدد',
        student_email: interest.student?.email || 'غير محدد',
        student_phone: interest.student?.phone || 'غير محدد',
        created_at: interest.created_at,
    }));

    if (loading) return <PageSkeleton />;

    return (
        <div className="p-3 lg:p-6 space-y-4 lg:space-y-6" dir="rtl">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/admin/banners')}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                >
                    <ArrowLeftIcon className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-xl lg:text-2xl font-bold">الطلاب المهتمون</h1>
                    {banner && (
                        <p className="text-gray-600 mt-1">بانر: {banner.title}</p>
                    )}
                </div>
            </div>

            {/* Banner Info */}
            {banner && (
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-primary">{students.length}</div>
                            <div className="text-sm text-gray-600">عدد المهتمين</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{banner.min_students}</div>
                            <div className="text-sm text-gray-600">الحد الأدنى المطلوب</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                                {banner.min_students && banner.min_students > 0 
                                    ? Math.round((students.length / banner.min_students) * 100)
                                    : 0}%
                            </div>
                            <div className="text-sm text-gray-600">نسبة الإنجاز</div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-6">
                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                            <span>التقدم</span>
                            <span>{students.length}/{banner.min_students}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                                className="bg-primary h-3 rounded-full transition-all duration-300"
                                style={{
                                    width: `${banner.min_students && banner.min_students > 0 
                                        ? Math.min((students.length / banner.min_students) * 100, 100)
                                        : 0}%`
                                }}
                            ></div>
                        </div>
                    </div>

                    {/* Status Message */}
                    {banner.min_students && banner.min_students > 0 && students.length >= banner.min_students && (
                        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-green-800 font-medium">
                                    ✅ تم الوصول للحد الأدنى! يمكن بدء البرنامج.
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Link to Program Section */}
                    {banner.min_students && banner.min_students > 0 && students.length >= banner.min_students && !banner.program_id && (
                        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-3">
                                <LinkIcon className="w-5 h-5 text-blue-600" />
                                <span className="text-blue-800 font-medium">ربط البانر ببرنامج</span>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <select
                                    value={selectedProgramId}
                                    onChange={(e) => setSelectedProgramId(e.target.value)}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={linking}
                                >
                                    <option value="">اختر برنامج...</option>
                                    {programs.map((program) => {
                                        // Get Arabic title from translations array
                                        const arabicTranslation = program.translations?.find(t => t.locale === 'ar');
                                        const programTitle = arabicTranslation?.title || program.title || `برنامج ${program.id}`;
                                        
                                        return (
                                            <option key={program.id} value={program.id}>
                                                {programTitle}
                                            </option>
                                        );
                                    })}
                                </select>
                                <button
                                    onClick={handleLinkToProgram}
                                    disabled={linking || !selectedProgramId}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {linking ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            جاري الربط...
                                        </>
                                    ) : (
                                        <>
                                            <LinkIcon className="w-4 h-4" />
                                            ربط بالبرنامج
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Already Linked Message */}
                    {banner.program_id && (
                        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-green-800 font-medium">
                                    ✅ البانر مربوط ببرنامج: {
                                        banner.program?.translations?.find(t => t.locale === 'ar')?.title || 
                                        banner?.title || 
                                        'برنامج غير محدد'
                                    }
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Students Table */}
            <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b">
                    <div className="flex items-center gap-2">
                        <UsersIcon className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-semibold">قائمة الطلاب المهتمين</h2>
                    </div>
                </div>

                <DataTable
                    data={rows}
                    columns={columns}
                    loading={loading}
                    selectable={false}
                    showActions={false}
                    pageSizeOptions={[10, 25, 50]}
                />
            </div>

            {/* Link to Program Modal */}
            {linkModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-lg font-semibold text-gray-900">
                                ربط البانر بالبرنامج
                            </h2>
                            <button
                                onClick={handleLinkModalClose}
                                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ArrowLeftIcon className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6">
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    البرنامج المحدد
                                </label>
                                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                                    {programs.find(p => p.id == selectedProgramId)?.translations?.find(t => t.locale === 'ar')?.title || 
                                     programs.find(p => p.id == selectedProgramId)?.title || 
                                     'برنامج غير محدد'}
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    موضوع البريد الإلكتروني *
                                </label>
                                <input
                                    type="text"
                                    value={emailSubject}
                                    onChange={(e) => setEmailSubject(e.target.value)}
                                    placeholder="أدخل موضوع البريد الإلكتروني..."
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                    required
                                />
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    محتوى البريد الإلكتروني *
                                </label>
                                <textarea
                                    value={emailBody}
                                    onChange={(e) => setEmailBody(e.target.value)}
                                    placeholder="أدخل محتوى البريد الإلكتروني..."
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                                    rows={4}
                                    required
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 justify-end">
                                <button
                                    type="button"
                                    onClick={handleLinkModalClose}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    إلغاء
                                </button>
                                <button
                                    onClick={handleLinkConfirm}
                                    disabled={linking || !emailSubject.trim() || !emailBody.trim()}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {linking ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            جاري الربط...
                                        </>
                                    ) : (
                                        <>
                                            <LinkIcon className="w-4 h-4" />
                                            ربط بالبرنامج
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
