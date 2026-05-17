import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Branding from '../../components/auth/Branding';
import otpService from '../../services/otpService';

export default function LoginPage() {
  const { setOtpSession } = useAuth();

  const [phone, setPhone] = useState('');
  const [loading, setLoad] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoad(true);

    try {
      // Send OTP for login and redirect to OTP page
      await otpService.sendOtp(phone, 'login');
      setOtpSession({ phone, method: 'login' });
      navigate('/otp');
    } catch (err) {
      const errorMessage =  err?.response?.data?.errors?.auth_method?.[0] ||
      err?.response?.data?.phone?.password?.[0] ||
      err?.response?.data?.message || 
      err?.message || 
     'تعذّر إرسال رمز التحقق';
      // setError(err?.response?.data?.message || 'تعذّر إرسال رمز التحقق');
      setError(errorMessage)
    } finally {
      setLoad(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <Branding text="مرحباً بك" paragraph="أدخل رقم هاتفك وسنُرسل لك رمز تحقق لتسجيل الدخول." />

      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white">
        <form onSubmit={handleSubmit} className="max-w-xs w-full space-y-6 px-4 lg:px-0 py-8 lg:py-0">
          <h2 className="text-2xl lg:text-3xl font-bold">تسجيل الدخول</h2>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div>
            <label className="block mb-1 text-gray-700 text-sm lg:text-base">رقم الهاتف</label>
            <input
              type="tel"
              value={phone || ''}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 lg:py-2 border rounded-lg focus:outline-none focus:ring-primary focus:border-primary text-sm lg:text-base"
              placeholder="05xxxxxxxx"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !phone}
            className="w-full py-3 lg:py-2 bg-primary text-white rounded-lg text-sm lg:text-base"
          >
            {loading ? 'جاري الإرسال...' : 'أرسل رمز التحقق'}
          </button>

          <p className="text-center text-xs lg:text-sm">
            <a href="/forgot-password" className="text-primary hover:underline">نسيت كلمة المرور؟</a>
          </p>

          <p className="text-center text-xs lg:text-sm">
            ليس لديك حساب؟ <a href="/register" className="text-primary">إنشاء حساب</a>
          </p>
        </form>
      </div>
    </div>
  );
}
