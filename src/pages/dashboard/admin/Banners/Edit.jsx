import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { AdminBannerService } from '../../../../services/bannerService';
import { toast } from 'react-hot-toast';

export default function EditBanner() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    min_students: 10,
    max_students: 20,
    status: 'active',
    image: null,
    current_image: null,
    _method: "PUT",
  });

  const fetchBannerData = useCallback(async () => {
    try {
      setLoadingData(true);
      const response = await AdminBannerService.getBanner(id);
      if (response.data?.success !== false) {
        const banner = response.data?.data || response.data;
        setFormData({
          title: banner.title || '',
          description: banner.description || '',
          min_students: banner.min_students || 10,
          max_students: banner.max_students || 20,
          status: banner.status || 'active',
          image: null,
          current_image: banner.image,
          _method: "PUT",
        });
      } else {
        toast.error('فشل في تحميل بيانات البانر');
        navigate('/admin/banners');
      }
    } catch (error) {
      console.error('Failed to fetch banner:', error);
      toast.error('فشل في تحميل بيانات البانر');
      navigate('/admin/banners');
    } finally {
      setLoadingData(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchBannerData();
  }, [fetchBannerData]);

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'file' ? files[0] : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('min_students', formData.min_students);
      submitData.append('max_students', formData.max_students);
      submitData.append('status', formData.status);

      submitData.append('_method', 'PUT');
      if (formData.image) {
        submitData.append('image', formData.image);
      }

      await AdminBannerService.updateBanner(id, submitData);
      toast.success('تم تحديث البانر بنجاح');
      navigate('/admin/banners');
    } catch (error) {
      console.error('Failed to update banner:', error);
      toast.error('فشل في تحديث البانر');
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return '/images/empty.png';
    if (imagePath.startsWith('http')) return imagePath;
    return `${import.meta.env.VITE_BASE_URL || ''}/${imagePath}`;
  };

  if (loadingData) {
    return (
      <div className="p-3 lg:p-6 space-y-4 lg:space-y-6" dir="rtl">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 lg:p-6 space-y-4 lg:space-y-6" dir="rtl">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/banners')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <h1 className="text-xl lg:text-2xl font-bold">تعديل البانر</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Title */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                عنوان البانر *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="أدخل عنوان البانر"
              />
            </div>

            {/* Description */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                وصف البانر
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="أدخل وصف البانر"
              />
            </div>

            {/* Min Students */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الحد الأدنى للطلاب *
              </label>
              <input
                type="number"
                name="min_students"
                value={formData.min_students}
                onChange={handleInputChange}
                required
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Max Students */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الحد الأقصى للطلاب *
              </label>
              <input
                type="number"
                name="max_students"
                value={formData.max_students}
                onChange={handleInputChange}
                required
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                صورة البانر
              </label>
              <input
                type="file"
                name="image"
                onChange={handleInputChange}
                accept="image/*"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              
              {/* Current Image */}
              {formData.current_image && !formData.image && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600 mb-2">الصورة الحالية:</p>
                  <img
                    src={getImageUrl(formData.current_image)}
                    alt="Current"
                    className="w-32 h-20 object-cover rounded-lg"
                  />
                </div>
              )}
              
              {/* New Image Preview */}
              {formData.image && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600 mb-2">الصورة الجديدة:</p>
                  <img
                    src={URL.createObjectURL(formData.image)}
                    alt="Preview"
                    className="w-32 h-20 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>

            {/* Status */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                حالة البانر *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="active">نشط</option>
                <option value="inactive">غير نشط</option>
                <option value="linked">مربوط ببرنامج</option>
              </select>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-6 border-t">
            <button
              type="submit"
              disabled={loading}
              className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/banners')}
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
