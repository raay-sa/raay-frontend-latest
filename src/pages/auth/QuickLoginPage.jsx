import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Branding from '../../components/auth/Branding';
import toast from 'react-hot-toast';

export default function QuickLoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const authData = await login(formData.email, formData.password);
      
      if (authData?.user) {
        // Store user type for routing
        localStorage.setItem('type', authData.user.type);
        
        // Show success message
        toast.success('تم تسجيل الدخول بنجاح');
        
        // Redirect based on user type
        const roleRedirectMap = {
          admin: '/admin',
          teacher: '/teacher',
          student: '/student',
          trainee: '/student'
        }

        const redirectPath = roleRedirectMap[authData.user.type] || '/student';
        
        navigate(redirectPath);
      } else {
        throw new Error('فشل في تسجيل الدخول');
      }
    } catch (err) {
      const errorMessage =  err?.response?.data?.errors?.email?.[0] ||
                            err?.response?.data?.errors?.password?.[0] ||
                            err?.response?.data?.message || 
                            err?.message || 
                           'حدث خطأ أثناء تسجيل الدخول';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <Branding 
        text="تسجيل دخول سريع" 
        paragraph="أدخل بريدك الإلكتروني وكلمة المرور لتسجيل الدخول مباشرة." 
      />

      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white">
        <form onSubmit={handleSubmit} className="max-w-xs w-full space-y-6 px-4 lg:px-0 py-8 lg:py-0">
          <h2 className="text-2xl lg:text-3xl font-bold">تسجيل الدخول السريع</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className="block mb-1 text-gray-700 text-sm lg:text-base">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-3 lg:py-2 border rounded-lg focus:outline-none focus:ring-primary focus:border-primary text-sm lg:text-base"
              placeholder="you@email.com"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block mb-1 text-gray-700 text-sm lg:text-base">
              كلمة المرور
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full px-4 py-3 lg:py-2 border rounded-lg focus:outline-none focus:ring-primary focus:border-primary text-sm lg:text-base"
              placeholder="أدخل كلمة المرور"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !formData.email || !formData.password}
            className="w-full py-3 lg:py-2 bg-primary text-white rounded-lg text-sm lg:text-base disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
          >
            {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </button>

          <div className="text-center space-y-2">
            <p className="text-xs lg:text-sm">
              ليس لديك حساب؟ <a href="/register" className="text-primary hover:underline">إنشاء حساب</a>
            </p>
            <p className="text-xs lg:text-sm">
              <a href="/forgot-password" className="text-primary hover:underline">نسيت كلمة المرور؟</a>
            </p>
            <p className="text-xs lg:text-sm">
              <a href="/login" className="text-gray-500 hover:underline">تسجيل دخول برمز التحقق</a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
