import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import Branding from "../../components/auth/Branding";
import { toast } from "react-hot-toast";
import authService from "../../services/authService";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({
    password: '',
    confirm: ''
  });
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: [],
    isValid: false
  });
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState('');

  // Get phone from sessionStorage (set by OTP verification)
  useEffect(() => {
    const resetPhone = sessionStorage.getItem('resetPasswordPhone');
    if (!resetPhone) {
      // If no phone in session, redirect to forgot password page
      toast.error('يرجى إعادة طلب إعادة تعيين كلمة المرور');
      navigate('/forgot-password', { replace: true });
      return;
    }
    setPhone(resetPhone);
  }, [navigate]);

  // Password validation function (same as RegisterPage)
  const validatePassword = (password) => {
    const feedback = [];
    let score = 0;

    // Length check (minimum 8 characters)
    if (password.length < 8) {
      feedback.push('يجب أن تكون كلمة المرور 8 أحرف على الأقل');
    } else {
      score += 1;
    }

    // Uppercase letter check
    if (!/[A-Z]/.test(password)) {
      feedback.push('يجب أن تحتوي على حرف كبير واحد على الأقل');
    } else {
      score += 1;
    }

    // Lowercase letter check
    if (!/[a-z]/.test(password)) {
      feedback.push('يجب أن تحتوي على حرف صغير واحد على الأقل');
    } else {
      score += 1;
    }

    // Number check
    if (!/\d/.test(password)) {
      feedback.push('يجب أن تحتوي على رقم واحد على الأقل');
    } else {
      score += 1;
    }

    // Special character check
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      feedback.push('يجب أن تحتوي على رمز خاص واحد على الأقل (!@#$%^&*)');
    } else {
      score += 1;
    }

    // Additional security checks
    if (password.length >= 12) {
      score += 1;
    }

    // Check for common patterns
    if (/(.)\1{2,}/.test(password)) {
      feedback.push('تجنب تكرار الأحرف أكثر من مرتين');
      score = Math.max(0, score - 1);
    }

    // Check for common words
    const commonWords = ['password', '123456', 'qwerty', 'abc123', 'password123'];
    if (commonWords.some(word => password.toLowerCase().includes(word))) {
      feedback.push('تجنب استخدام كلمات مرور شائعة');
      score = Math.max(0, score - 1);
    }

    return {
      score: Math.max(0, Math.min(score, 5)),
      feedback,
      isValid: score >= 4 && feedback.length === 0
    };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));

    // Validate password in real-time
    if (name === 'password') {
      const validation = validatePassword(value);
      setPasswordStrength(validation);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!phone) {
      toast.error('يرجى إعادة طلب إعادة تعيين كلمة المرور');
      navigate('/forgot-password', { replace: true });
      return;
    }

    // Validate password strength
    if (!passwordStrength.isValid) {
      toast.error('كلمة المرور لا تلبي متطلبات الأمان المطلوبة.');
      return;
    }

    if (form.password !== form.confirm) {
      toast.error('كلمتا المرور غير متطابقتين.');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(phone, form.password, form.confirm);
      // Clear session storage
      sessionStorage.removeItem('resetPasswordPhone');
      toast.success('تم تحديث كلمة المرور بنجاح');
      // Redirect to login page
      navigate(`${import.meta.env.VITE_MAIN_LOGIN_ROUTE}`, { replace: true });
    } catch (err) {
      const errorMessage = err?.response?.data?.message || 
                          err?.response?.data?.errors?.password?.[0] ||
                          'فشل تحديث كلمة المرور. يرجى المحاولة مرة أخرى.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      {/* right */}
      <Branding text="استعد الوصول لحسابك بسهولة وأمان" paragrapgh="" />

      {/* left */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white">
        <div className="max-w-md w-full text-start px-4 lg:px-0 py-8 lg:py-0">
          <h2 className="text-2xl lg:text-3xl font-bold mb-2">تعيين كلمة مرور جديدة</h2>
          <p className="text-gray-600 mb-6 text-sm lg:text-base">
            يرجى إدخال كلمة مرور جديدة لحسابك.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              {showPwd ? (
                <EyeSlashIcon
                  onClick={() => setShowPwd(false)}
                  className="w-5 h-5 absolute left-3 top-1/2 text-gray-400 cursor-pointer"
                />
              ) : (
                <EyeIcon
                  onClick={() => setShowPwd(true)}
                  className="w-5 h-5 absolute left-3 top-1/2 text-gray-400 cursor-pointer"
                />
              )}

              <label htmlFor="password" className="block text-gray-700 mb-1 font-semibold">كلمة المرور الجديدة</label>
              <input
                type={showPwd ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="أدخل كلمة المرور الجديدة"
                className="w-full pl-11 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-primary focus:border-primary"
              />
              
              {/* Password Strength Indicator */}
              {form.password && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          passwordStrength.score <= 1 ? 'bg-red-500' :
                          passwordStrength.score <= 2 ? 'bg-orange-500' :
                          passwordStrength.score <= 3 ? 'bg-yellow-500' :
                          passwordStrength.score <= 4 ? 'bg-blue-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      />
                    </div>
                    <span className={`text-xs font-medium ${
                      passwordStrength.score <= 2 ? 'text-red-600' : 
                      passwordStrength.score <= 3 ? 'text-orange-600' : 
                      passwordStrength.score <= 4 ? 'text-blue-600' : 'text-green-600'
                    }`}>
                      {passwordStrength.score <= 1 ? 'ضعيف جداً' :
                       passwordStrength.score <= 2 ? 'ضعيف' :
                       passwordStrength.score <= 3 ? 'متوسط' :
                       passwordStrength.score <= 4 ? 'قوي' : 'قوي جداً'}
                    </span>
                  </div>
                  
                  {/* Password Requirements */}
                  {passwordStrength.feedback.length > 0 && (
                    <div className="text-xs text-gray-600 space-y-1">
                      {passwordStrength.feedback.map((msg, index) => (
                        <div key={index} className="flex items-center gap-1">
                          <span className="text-red-500">•</span>
                          <span>{msg}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Success message when password is valid */}
                  {passwordStrength.isValid && (
                    <div className="text-xs text-green-600 flex items-center gap-1">
                      <span>✓</span>
                      <span>كلمة مرور قوية وآمنة</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="relative">
              {showConfirm ? (
                <EyeSlashIcon
                  onClick={() => setShowConfirm(false)}
                  className="w-5 h-5 absolute left-3 top-1/2 text-gray-400 cursor-pointer"
                />
              ) : (
                <EyeIcon
                  onClick={() => setShowConfirm(true)}
                  className="w-5 h-5 absolute left-3 top-1/2 text-gray-400 cursor-pointer"
                />
              )}

              <label htmlFor="confirm" className="block text-gray-700 mb-1 font-semibold">تأكيد كلمة المرور</label>
              <input
                type={showConfirm ? "text" : "password"}
                name="confirm"
                value={form.confirm}
                onChange={handleChange}
                placeholder="أعد إدخال كلمة المرور"
                className="w-full pl-11 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-primary focus:border-primary"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 lg:py-2 bg-primary text-white rounded-lg text-sm lg:text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

