import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  EnvelopeIcon, EyeIcon, EyeSlashIcon, LockClosedIcon,
  UserIcon, PhoneIcon, DocumentIcon, ArrowUpTrayIcon,
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import Branding from '../../components/auth/Branding';
import GoogleCaptcha from '../../components/GoogleCaptcha';
import { useAuth } from '../../contexts/AuthContext';
import http from '../../services/http';
import otpService from '../../services/otpService';
import { toast } from 'react-hot-toast';

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    password: '', confirm: '',
    specialization: '',
    national_id: '',
    education: '',              // student only
  });
  const [accountType, setAccountType] = useState('student'); // student | teacher
  const [agree, setAgree] = useState(false);
  const [image, setImage] = useState(null);
  const [certs, setCerts] = useState([]);
  const [fileNames, setFileNames] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCats, setSelectedCats] = useState([]);

  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [globalErrors, setGlobalErrors] = useState([]);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: [],
    isValid: false
  });

  // Under-review modal (teacher)
  const [underReviewOpen, setUnderReviewOpen] = useState(false);
  const [underReviewMsg, setUnderReviewMsg] = useState('');

  // Captcha state
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaError, setCaptchaError] = useState('');
  const captchaRef = useRef();

  const { register: registerApi, setOtpSession } = useAuth();
  const navigate = useNavigate();

  // fetch categories for teachers
  useEffect(() => {
    if (accountType !== 'teacher') return;
    http.get('/public/categories')
      .then(({ data }) => {
        const categoriesData = data?.data ?? [];
        // Process categories to extract titles from translations
        const processedCategories = categoriesData.map(category => {
          if (category.translations && Array.isArray(category.translations)) {
            const arTranslation = category.translations.find(t => t.locale === 'ar');
            const enTranslation = category.translations.find(t => t.locale === 'en');
            
            return {
              ...category,
              title: arTranslation?.title || category.title || '',
              title_ar: arTranslation?.title || '',
              title_en: enTranslation?.title || '',
            };
          }
          return category;
        });
        setCategories(processedCategories);
      })
      .catch(() => setCategories([]));
  }, [accountType]);

  const categoryOptions = useMemo(
    () => categories.map(c => ({ value: c.id, label: c.title })),
    [categories]
  );

  // Password validation function
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
    setErrors(prev => ({ ...prev, [name]: undefined }));
    setGlobalErrors([]);

    // Validate password in real-time
    if (name === 'password') {
      const validation = validatePassword(value);
      setPasswordStrength(validation);
    }
  };

  const handleImage = (e) => setImage(e.target.files?.[0] || null);

  const handleCerts = (e) => {
    const files = Array.from(e.target.files || []);
    setCerts(files);
    setFileNames(files.map(f => f.name).join(', '));
  };

  // Captcha handlers
  const handleCaptchaVerify = (token) => {
    setCaptchaToken(token);
    setCaptchaError('');
  };

  const handleCaptchaExpire = () => {
    setCaptchaToken('');
    setCaptchaError('انتهت صلاحية التحقق. يرجى المحاولة مرة أخرى.');
  };

  const handleCaptchaError = (error) => {
    setCaptchaToken('');
    setCaptchaError('حدث خطأ في التحقق. يرجى المحاولة مرة أخرى.');
    console.error('Captcha error:', error);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!agree) {
      toast.error('يجب الموافقة على الشروط والأحكام.');
      return;
    }

    // TODO: Uncomment this when captcha is implemented on backend
    // Validate captcha
    // if (!captchaToken) {
    //   setCaptchaError('يجب إكمال التحقق من أنك لست روبوت.');
    //   toast.error('يجب إكمال التحقق من أنك لست روبوت.');
    //   return;
    // }

    // Validate password strength
    if (!passwordStrength.isValid) {
      toast.error('كلمة المرور لا تلبي متطلبات الأمان المطلوبة.');
      return;
    }

    if (form.password !== form.confirm) {
      toast.error('كلمتا المرور غير متطابقتين.');
      return;
    }
    if (accountType === 'student' && !form.education?.trim()) {
      setErrors(prev => ({ ...prev, education: ['المؤهل التعليمي مطلوب'] }));
      toast.error('المؤهل التعليمي مطلوب');
      return;
    }
    if (!form.email?.trim()) {
      toast.error('البريد الإلكتروني مطلوب');
      return;
    }

    try {
      if (accountType === 'student') {
        // 1) Register first
        const fd = new FormData();
        fd.append('name', form.name);
        fd.append('email', form.email);
        fd.append('phone', form.phone);
        fd.append('password', form.password);
        fd.append('password_confirmation', form.confirm);
        fd.append('user_type', 'student');
        fd.append('national_id', form.national_id || '');
        if (image) fd.append('image', image);

        // student-specific (send under multiple likely keys as before)
        fd.append('education', form.education || '');
        fd.append('qualification', form.education || '');
        fd.append('educational_qualification', form.education || '');

        // This should succeed with no validation errors but WITHOUT logging in yet.
        await registerApi(fd);

        // 2) If success, send OTP then navigate to OTP page
        await otpService.sendOtp(form.email, 'register');

        // 3) Minimal session data: only what OTP screen needs
        setOtpSession({ email: form.email, method: 'register' });

        navigate('/otp');
        return;
      }

      // Teacher: unchanged (no OTP; under review)
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('email', form.email);
      fd.append('phone', form.phone);
      fd.append('password', form.password);
      fd.append('password_confirmation', form.confirm);
      fd.append('user_type', accountType);
      fd.append('national_id', form.national_id || '');
      if (image) fd.append('image', image);
      fd.append('specialization', form.specialization || '');
      certs.forEach(f => fd.append('certificate', f));
      selectedCats.forEach(id => fd.append('categories[]', String(id)));

      const res = await registerApi(fd);
      const data = res?.data ?? res ?? {};
      const message = data.message ?? data.data?.message ?? '';

      setUnderReviewMsg(message || 'تم التسجيل بنجاح. طلبك قيد المراجعة.');
      setUnderReviewOpen(true);
    } catch (err) {
      // Reset captcha on error
      if (captchaRef.current) {
        captchaRef.current.reset();
      }
      setCaptchaToken('');
      
      if (err?.response?.status === 422) {
        const resErrors = err.response.data?.errors || {};
        setErrors(resErrors);
        const allMessages = Object.values(resErrors).flat();
        setGlobalErrors(allMessages);
        if (allMessages.length) toast.error(allMessages[0]);
        else toast.error('تعذر إكمال الطلب. تحقق من الحقول.');
      } else {
        const msg = err?.response?.data?.message || 'فشل التسجيل';
        setGlobalErrors([msg]);
        toast.error(msg);
      }
    }
  };

  const selectStyles = {
    control: (b, s) => ({
      ...b,
      borderRadius: '0.5rem',
      borderColor: s.isFocused ? '#6366f1' : '#d1d5db',
      boxShadow: s.isFocused ? '0 0 0 1px #6366f1' : 'none',
      minHeight: '2.5rem',
      direction: 'rtl',
    }),
    placeholder: (b) => ({ ...b, textAlign: 'right' }),
    valueContainer: (b) => ({ ...b, paddingInlineEnd: '0.5rem' }),
    multiValue: (b) => ({ ...b, background: '#6366f1', direction: 'rtl' }),
    multiValueLabel: (b) => ({ ...b, color: 'white', fontSize: '0.75rem' }),
    multiValueRemove: (b) => ({
      ...b, color: 'white', ':hover': { background: '#4f46e5', color: 'white' },
    }),
    menu: (b) => ({ ...b, direction: 'rtl' }),
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <Branding text="ابدأ تجربتك معنا" paragraph="إنشاء حساب جديد" />

      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white overflow-auto">
        <form onSubmit={handleSubmit} className="max-w-md w-full py-8 lg:py-12 px-4 lg:px-0 space-y-6">
          {globalErrors.length > 0 && (
            <div className="bg-red-100 border border-red-400 text-red-700 text-sm rounded p-3 mb-4">
              <ul className="list-disc pr-5 space-y-1">
                {globalErrors.map((msg, idx) => <li key={idx}>{msg}</li>)}
              </ul>
            </div>
          )}

          <h2 className="text-2xl lg:text-3xl font-bold">إنشاء حساب</h2>
          <p className="text-gray-600 mb-4 text-sm lg:text-base">اختر نوع الحساب وابدأ رحلتك معنا.</p>

          <Input icon={UserIcon} label="الاسم كامل" name="name"
            value={form.name} onChange={handleChange}
            error={errors.name?.[0]} />

          <Input icon={EnvelopeIcon} label="البريد الإلكتروني" name="email" type="email"
            value={form.email} onChange={handleChange}
            error={errors.email?.[0]} />

          <Input icon={PhoneIcon} label="رقم الاتصال" name="phone" type="tel"
            value={form.phone} onChange={handleChange}
            error={errors.phone?.[0]} />

          {/* Account type */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <Radio label="متدرب" value="student"
              checked={accountType === 'student'}
              onChange={() => setAccountType('student')} />
            <Radio label="مدرب" value="trainer"
              checked={accountType === 'teacher'}
              onChange={() => setAccountType('teacher')} />
          </div>

          {/* Student-only: education */}
          {accountType === 'student' && (
            <Input icon={DocumentIcon} label="المؤهل التعليمي *" name="education"
              value={form.education} onChange={handleChange}
              error={errors.education?.[0] || errors.qualification?.[0] || errors.educational_qualification?.[0]} />
          )}

          {/* Teacher-only fields */}
          {(accountType === 'teacher') && (
            <>
              <Input icon={DocumentIcon} label="التخصص" name="specialization"
                value={form.specialization} onChange={handleChange}
                error={errors.specialization?.[0]} />

              <div>
                <label className="block text-gray-700 mb-1">الفئات</label>
                <Select
                  options={categoryOptions}
                  isMulti
                  isRtl
                  placeholder="اختر الفئات"
                  value={categoryOptions.filter(o => selectedCats.includes(o.value))}
                  onChange={(sel) => setSelectedCats(sel.map(o => o.value))}
                  styles={selectStyles}
                  noOptionsMessage={() => 'لا توجد نتائج'}
                />
                {errors['categories.0'] && (
                  <p className="text-xs text-red-500 mt-1">{errors['categories.0'][0]}</p>
                )}
              </div>

              <FileUpload label="الشهادات" multiple filesLabel={fileNames || 'أرفق الشهادة'}
                onChange={handleCerts} error={errors.certificate?.[0]} />
            </>
          )}

          <FileUpload label="الصورة الشخصية"
            filesLabel={image?.name || 'أرفق الصورة'}
            onChange={handleImage}
            error={errors.image?.[0]} />

          <PasswordInput label="كلمة المرور" name="password"
            show={showPwd} onToggle={() => setShowPwd(!showPwd)}
            value={form.password} onChange={handleChange}
            error={errors.password?.[0]} 
            strength={passwordStrength} />

          <PasswordInput label="تأكيد كلمة المرور" name="confirm"
            show={showConfirm} onToggle={() => setShowConfirm(!showConfirm)}
            value={form.confirm} onChange={handleChange} />

          {/* Could not find captcha verification route on backend, so disabled it temporarily */}
          {/* Google reCAPTCHA */}
          {/* <GoogleCaptcha
            ref={captchaRef}
            onVerify={handleCaptchaVerify}
            onExpire={handleCaptchaExpire}
            onError={handleCaptchaError}
            error={captchaError}
            className="flex justify-center"
          /> */}

          {/* Terms */}
          <label className="inline-flex items-center text-sm">
            <input type="checkbox" checked={agree}
              onChange={e => setAgree(e.target.checked)}
              className="form-checkbox h-4 w-4 text-primary" />
            <span className="mr-2 text-gray-700">
              أوافق على&nbsp;<a href={`${import.meta.env.VITE_WEBSITE_LINK}terms`} className="text-primary underline">الشروط والأحكام</a>
              &nbsp;وسياسة الخصوصية
            </span>
          </label>

          <button type="submit" className="w-full py-3 lg:py-2 bg-primary text-white rounded-lg flex items-center justify-center gap-2 text-sm lg:text-base">
            <LockClosedIcon className="w-5 h-5" /> إرسال رمز التحقق
          </button>

          <p className="text-center text-xs lg:text-sm mt-4">
            لديك حساب بالفعل؟&nbsp;
            <a href={`${import.meta.env.VITE_MAIN_LOGIN_ROUTE}` || '/login'} className="text-primary underline">تسجيل الدخول</a>
          </p>
        </form>
      </div>

      {/* UNDER-REVIEW MODAL (Teacher) */}
      {underReviewOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md text-center space-y-3" dir="rtl">
            <h3 className="text-lg lg:text-xl font-bold">تم التسجيل بنجاح</h3>
            <p className="text-gray-700 text-sm lg:text-base">{underReviewMsg || 'تم التسجيل بنجاح. طلبك قيد المراجعة.'}</p>
            <p className="text-gray-700 text-sm lg:text-base">
              شكراً لتسجيلك كخبير. طلبك حالياً <span className="font-semibold">قيد المراجعة</span>.
              سنقوم بإشعارك فور الموافقة.
            </p>
            <button
              onClick={() => { setUnderReviewOpen(false); navigate(`${import.meta.env.VITE_MAIN_LOGIN_ROUTE} || login`, { replace: true }); }}
              className="mt-2 w-full py-3 lg:py-2 bg-primary text-white rounded-lg text-sm lg:text-base"
            >
              العودة لتسجيل الدخول
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* Helper Components */
function Input({ label, icon: Icon, error, ...rest }) { 
  return (
    <div>
      <label className="block text-gray-700 mb-1">{label}</label>
      <div className="relative">
        {Icon && <Icon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />}
        <input {...rest}
          className={`w-full pl-11 pr-4 py-2 border rounded-lg focus:outline-none ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:border-primary focus:ring-primary'
            }`} />
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function PasswordInput({ label, show, onToggle, error, strength, ...rest }) {
  const getStrengthColor = (score) => {
    if (score <= 1) return 'bg-red-500';
    if (score <= 2) return 'bg-orange-500';
    if (score <= 3) return 'bg-yellow-500';
    if (score <= 4) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStrengthText = (score) => {
    if (score <= 1) return 'ضعيف جداً';
    if (score <= 2) return 'ضعيف';
    if (score <= 3) return 'متوسط';
    if (score <= 4) return 'قوي';
    return 'قوي جداً';
  };

  return (
    <div>
      <label className="block text-gray-700 mb-1">{label}</label>
      <div className="relative">
        {show
          ? <EyeSlashIcon onClick={onToggle}
            className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer" />
          : <EyeIcon onClick={onToggle}
            className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer" />
        }
        <input type={show ? 'text' : 'password'} {...rest}
          className={`w-full pl-11 pr-4 py-2 border rounded-lg focus:outline-none ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:border-primary focus:ring-primary'
            }`} />
      </div>
      
      {/* Password Strength Indicator */}
      {strength && rest.name === 'password' && rest.value && (
        <div className="mt-2">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(strength.score)}`}
                style={{ width: `${(strength.score / 5) * 100}%` }}
              />
            </div>
            <span className={`text-xs font-medium ${
              strength.score <= 2 ? 'text-red-600' : 
              strength.score <= 3 ? 'text-orange-600' : 
              strength.score <= 4 ? 'text-blue-600' : 'text-green-600'
            }`}>
              {getStrengthText(strength.score)}
            </span>
          </div>
          
          {/* Password Requirements */}
          {strength.feedback.length > 0 && (
            <div className="text-xs text-gray-600 space-y-1">
              {strength.feedback.map((msg, index) => (
                <div key={index} className="flex items-center gap-1">
                  <span className="text-red-500">•</span>
                  <span>{msg}</span>
                </div>
              ))}
            </div>
          )}
          
          {/* Success message when password is valid */}
          {strength.isValid && (
            <div className="text-xs text-green-600 flex items-center gap-1">
              <span>✓</span>
              <span>كلمة مرور قوية وآمنة</span>
            </div>
          )}
        </div>
      )}
      
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

const Radio = ({ label, value, checked, onChange }) => (
  <label className="inline-flex items-center">
    <input type="radio" value={value} checked={checked}
      onChange={onChange} className="form-radio h-4 w-4 text-primary" />
    <span className="mr-2">{label}</span>
  </label>
);

function FileUpload({ label, filesLabel, onChange, multiple, error }) {
  return (
    <div>
      <label className="block text-gray-700 mb-1">{label}</label>
      <div className={`flex border rounded-lg overflow-hidden ${error ? 'border-red-500' : 'border-gray-300'}`}>
        <div className="flex-1 pr-4 py-2 text-gray-500 text-right truncate">
          {filesLabel}
        </div>
        <label className="flex items-center bg-primary text-white text-sm px-2 py-2 cursor-pointer rounded-xl">
          <ArrowUpTrayIcon className="w-5 h-5 ml-2" />
          ارفق
          <input type="file" multiple={multiple} onChange={onChange} className="hidden" />
        </label>
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
