import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AdminService } from '../../../services/adminService';

// Credentials - Change these if needed
const CONTROL_USERNAME = 'liveStreamAdmin2024';
const CONTROL_PASSWORD = 'AntMedia@Control#Secure!';

const STORAGE_KEY = 'live_streaming_control_auth';

export default function LiveStreamingControl() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [antMedia, setAntMedia] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Check if already authenticated on mount
    useEffect(() => {
        const authStatus = sessionStorage.getItem(STORAGE_KEY);
        if (authStatus === 'authenticated') {
            setIsAuthenticated(true);
            fetchStatus();
        } else {
            setLoading(false);
        }
    }, []);

    const handleLogin = (e) => {
        e.preventDefault();
        setLoginError('');

        if (username === CONTROL_USERNAME && password === CONTROL_PASSWORD) {
            setIsAuthenticated(true);
            sessionStorage.setItem(STORAGE_KEY, 'authenticated');
            fetchStatus();
            toast.success('تم تسجيل الدخول بنجاح');
        } else {
            setLoginError('اسم المستخدم أو كلمة المرور غير صحيحة');
            setPassword('');
        }
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        sessionStorage.removeItem(STORAGE_KEY);
        setUsername('');
        setPassword('');
        setAntMedia(0);
        toast.success('تم تسجيل الخروج');
    };

    const fetchStatus = async () => {
        try {
            setLoading(true);
            const { data } = await AdminService.getSystemSettings();
            setAntMedia(data?.ant_media || 0);
        } catch (error) {
            console.error('Failed to fetch status:', error);
            toast.error('فشل تحميل الحالة');
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async () => {
        try {
            setSaving(true);
            const newValue = antMedia === 1 ? 0 : 1;
            await AdminService.updateSystemSettings({ ant_media: newValue });
            setAntMedia(newValue);
            toast.success('تم التحديث بنجاح');
        } catch (error) {
            console.error('Failed to update:', error);
            toast.error('فشل تحديث الحالة');
        } finally {
            setSaving(false);
        }
    };

    // Login Form
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4" dir="rtl">
                <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            التحكم في البث المباشر
                        </h1>
                        <p className="text-sm text-gray-600">
                            يرجى تسجيل الدخول للوصول إلى هذه الصفحة
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                اسم المستخدم
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="أدخل اسم المستخدم"
                                required
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                كلمة المرور
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="أدخل كلمة المرور"
                                required
                            />
                        </div>

                        {loginError && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                {loginError}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                        >
                            تسجيل الدخول
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // Main Control Panel
    if (loading) {
        return (
            <div className="p-8" dir="rtl">
                <div className="text-center">جاري التحميل...</div>
            </div>
        );
    }

    const isEnabled = antMedia === 1;

    return (
        <div className="p-8" dir="rtl">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">التحكم في البث المباشر</h1>
                <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg transition-colors"
                >
                    تسجيل الخروج
                </button>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-semibold">حالة البث المباشر</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        isEnabled 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                    }`}>
                        {isEnabled ? 'مفعل' : 'معطل'}
                    </span>
                </div>

                <p className="text-gray-600 mb-6 text-sm">
                    {isEnabled 
                        ? 'البث المباشر متاح للمعلمين حالياً' 
                        : 'البث المباشر معطل - سيظهر للمعلمين رسالة الاشتراك'}
                </p>

                <button
                    onClick={handleToggle}
                    disabled={saving}
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                        isEnabled
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    {saving ? 'جاري الحفظ...' : (isEnabled ? 'تعطيل البث المباشر' : 'تفعيل البث المباشر')}
                </button>
            </div>
        </div>
    );
}

