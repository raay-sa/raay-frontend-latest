import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { StudentBannerService } from '../../../services/bannerService';

const MyInterests = () => {
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyInterests();
  }, []);

  const fetchMyInterests = async () => {
    try {
      setLoading(true);
      const response = await StudentBannerService.getMyInterests();
      if (response.data?.success !== false) {
        setInterests(response.data?.data || response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch interests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return '/images/empty.png';
    if (imagePath.startsWith('http')) return imagePath;
    return `${import.meta.env.VITE_BASE_URL || ''}/${imagePath}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">دوراتي المهتم بها</h1>
      
      {interests.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">لم تظهر اهتماماً بأي دورات بعد.</p>
          <Link 
            to="/student/courses" 
            className="mt-4 inline-block bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            تصفح الدورات المتاحة
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {interests.map((interest) => (
            <div key={interest.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="relative h-48 overflow-hidden">
                <img
                  src={getImageUrl(interest.banner?.image)}
                  alt={interest.banner?.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = '/images/empty.png';
                  }}
                />
                <div className="absolute top-2 right-2">
                  <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs">
                    مهتم
                  </span>
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {interest.banner?.title}
                </h3>
                
                <p className="text-gray-600 text-sm mb-3">
                  تاريخ الاهتمام: {new Date(interest.created_at).toLocaleDateString('ar-SA')}
                </p>

                {/* Progress Bar */}
                {interest.banner && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>التقدم</span>
                      <span>{interest.banner.interested_students_count}/{interest.banner.min_students}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min((interest.banner.interested_students_count / interest.banner.min_students) * 100, 100)}%`
                        }}
                      ></div>
                    </div>
                  </div>
                )}

                {interest.banner?.program ? (
                  <Link
                    to={`/student/courses/${interest.banner.program.id}`}
                    className="w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-blue-700 text-center block"
                  >
                    عرض الدورة
                  </Link>
                ) : (
                  <div className="text-center text-gray-500 text-sm py-2">
                    في انتظار تفعيل الدورة
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyInterests;
