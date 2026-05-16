import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PhoneIcon } from "@heroicons/react/24/outline";
import Branding from "../../components/auth/Branding";
import { useAuth } from "../../contexts/AuthContext";
import otpService from "../../services/otpService";

export default function ForgotPasswordPage() {
  const { setOtpSession } = useAuth();
  const navigate = useNavigate();

  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Send OTP for password reset and redirect to OTP page
      await otpService.sendOtp(phone, 'forgot-password');
      setOtpSession({ phone, method: 'forgot-password' });
      navigate('/otp');
    } catch (err) {
      setError(err?.response?.data?.message || 'تعذّر إرسال رمز التحقق');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <Branding text="استعد الوصول لحسابك بسهولة وأمان" paragrapgh="أدخل رقم هاتفك وسنُرسل لك رمز تحقق لإعادة تعيين كلمة المرور." />

      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white">
        <form onSubmit={handleSubmit} className="max-w-md w-full text-start px-4 lg:px-0 py-8 lg:py-0 space-y-6">
          <h2 className="text-2xl lg:text-3xl font-bold mb-2">نسيت كلمة المرور؟</h2>
          <p className="text-gray-600 mb-6 text-sm lg:text-base">
            أدخل رقم هاتفك وسنرسل لك رمز تحقق لإعادة تعيين كلمة المرور
          </p>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="relative">
            <label htmlFor="phone" className="block mb-1 text-gray-700 font-semibold text-sm lg:text-base">رقم الهاتف</label>
            <PhoneIcon className="w-5 h-5 absolute left-3 top-1/2 translate-y-2 text-gray-400" />
            <input
              type="tel"
              id="phone"
              value={phone || ''}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="05xxxxxxxx"
              className="w-full my-3 pl-11 text-end pr-4 py-3 lg:py-2 border rounded-lg focus:outline-none focus:ring-primary focus:border-primary text-sm lg:text-base"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !phone}
            className="w-full py-3 lg:py-2 bg-primary text-white rounded-lg text-sm lg:text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'جاري الإرسال...' : 'أرسل رمز التحقق'}
          </button>

          <p className="text-xs lg:text-sm text-center">
            تذكرت كلمة المرور؟{" "}
            <a href={import.meta.env.VITE_MAIN_LOGIN_ROUTE} className="text-primary hover:underline">
              تسجيل الدخول
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
