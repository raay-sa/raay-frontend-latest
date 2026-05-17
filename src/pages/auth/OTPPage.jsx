import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Branding from '../../components/auth/Branding';
import otpService from '../../services/otpService';
import { flushSync } from 'react-dom';

export default function OTPPage() {
  const { otpSession, setOtpSession, setToken, setUser } = useAuth();
  const navigate = useNavigate();

  const phone = otpSession?.phone || otpSession?.email; // Support both for backward compatibility
  const method = otpSession?.method; // 'register' | 'login' | 'forgot-password'
  const [code, setCode] = useState('');
  const [timer, setTimer] = useState(30);
  const [loading, setLoad] = useState(false);
  const [error, setError] = useState('');

  const boxes = useRef([]);

  // redirect if missing context
  useEffect(() => {
    // Values needed to hardcoded here
    // if (!phone) navigate(`${import.meta.env.VITE_MAIN_LOGIN_ROUTE}`, { replace: true });
    if (!phone) navigate("/login", { replace: true });
  }, [phone, navigate]);

  useEffect(() => {
    if (timer === 0) return;
    const id = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const handleDigit = (i, v) => {
    const d = v.replace(/\D/g, '').slice(0, 1);
    setCode(prev => {
      const arr = prev.split('');
      arr[i] = d; return arr.join('');
    });
    if (d && boxes.current[i + 1]) boxes.current[i + 1].focus();
  };

  const handleKeyDown = (i, e) => {
    // Handle backspace/delete
    if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      setCode(prev => {
        const arr = prev.split('');
        // If current field has a value, clear it and move to previous field
        if (arr[i]) {
          arr[i] = '';
          if (i > 0 && boxes.current[i - 1]) {
            boxes.current[i - 1].focus();
          }
          return arr.join('');
        }
        // If current field is empty, move to previous and clear it
        if (i > 0 && boxes.current[i - 1]) {
          arr[i - 1] = '';
          boxes.current[i - 1].focus();
          return arr.join('');
        }
        return prev;
      });
    }
    // Handle arrow keys for navigation
    else if (e.key === 'ArrowLeft' && i > 0) {
      e.preventDefault();
      boxes.current[i - 1].focus();
    }
    else if (e.key === 'ArrowRight' && i < 5) {
      e.preventDefault();
      boxes.current[i + 1].focus();
    }
  };

  const resend = async () => {
    setTimer(30);
    setError('');
    try {
      await otpService.sendOtp(phone, method || 'register');
    } catch (_) {
      setError('فشل الإرسال');
    }
  };

  const verify = async () => {
    if (code.length < 6) return;
    setLoad(true); setError('');

    try {
      // include auth_method in verification
      const resp = await otpService.verifyOtp(phone, code, method || 'register');

      // Handle forgot-password flow differently
      if (method === 'forgot-password') {
        // For password reset, store phone in sessionStorage and redirect to reset password page
        sessionStorage.setItem('resetPasswordPhone', phone);
        setOtpSession(null);
        navigate('/reset-password', { replace: true });
        return;
      }

      // Expecting backend response to include token + user under data
      const payload = resp?.data ?? {};
      const token = payload?.data?.token || payload?.token;
      const user = payload?.data?.user || payload?.user;

      if (token && user) {
        flushSync(() => {
          localStorage.setItem('token', token);
          localStorage.setItem('type', user.type);
          setToken(token);
          setUser(user);
          setOtpSession(null);
        });
        // Redirect trainee users to student dashboard
        const redirectPath = user.type === 'trainee' ? '/student' : `/${user.type}`;
        navigate(redirectPath, { replace: true });
      } else {
        setError('تم التحقق لكن لم نستلم بيانات الدخول. تواصل مع الدعم.');
      }
    } catch (err) {
      const errorMessage =  err?.response?.data?.errors?.auth_method?.[0] ||
                            err?.response?.data?.errors?.phone?.[0] ||
                            err?.response?.data?.errors?.code?.[0] || 
                            err?.message || 
                            'رمز غير صالح';
                              console.log("err?.response?.data?.message", err?.response?.data?.message)
                              console.log("err?.message", err?.message)
      // setError(err?.response?.data?.message || 'رمز غير صالح');
      setError(errorMessage || 'رمز غير صالح');
    } finally {
      setLoad(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <Branding text="أمانك أولويتنا" paragrapgh="أدخل رمز التحقق المكوَّن من 6 أرقام." />

      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white">
        <div className="max-w-md w-full px-4 lg:px-0 py-8 lg:py-0">
          <h2 className="text-2xl lg:text-3xl font-bold mb-4">رمز التحقق</h2>
          <p className="text-gray-600 mb-6 text-sm lg:text-base">
            تم إرسال رمز إلى <span className="font-semibold break-all">{phone}</span>
          </p>

          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

          <div className="flex justify-between mb-6 gap-2" dir="ltr">
            {[0, 1, 2, 3, 4, 5].map(i => (
              <input
                key={i}
                ref={el => boxes.current[i] = el}
                maxLength={1}
                value={code[i] || ''}
                onChange={e => handleDigit(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className="w-12 h-14 sm:w-14 sm:h-16 text-center border rounded-lg focus:outline-none focus:ring-primary text-lg sm:text-xl font-semibold"
              />
            ))}
          </div>

          <div className="text-center text-sm mb-6">
            {timer > 0
              ? <span className="bg-gray-100 px-4 py-2 rounded text-sm lg:text-base">00:{String(timer).padStart(2, '0')}</span>
              : <button className="text-primary hover:underline text-sm lg:text-base" onClick={resend}>إعادة الإرسال</button>}
          </div>

          <button
            onClick={verify}
            disabled={code.length < 6 || loading}
            className="w-full py-3 lg:py-2 bg-primary text-white rounded-lg text-sm lg:text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'جارٍ التحقق...' : 'تحقق'}
          </button>
        </div>
      </div>
    </div>
  );
}
