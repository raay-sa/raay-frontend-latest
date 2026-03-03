/* src/contexts/AuthContext.jsx
   -------------------------------------------------------------- */
import React, { createContext, useContext, useEffect, useState } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refresh_token'));
    const [loading, setLoading] = useState(!!token);

    /* while on OTP screen */
    const [otpSession, setOtpSession] = useState(null);
    // otpSession = { phone | email, method: 'login' | 'register' }

    /* helper that makes both old + new responses look the same */
    const extractAuth = (data) => {
        /* new style: top-level token & user */
        if (data?.token && data?.user) return { token: data.token, user: data.user, refreshToken: data.refresh_token };
        /* old style: data.data.token / user */
        if (data?.data?.token && data?.data?.user) return { ...data.data, refreshToken: data.data.refresh_token };
        /* otherwise give nulls for safety */
        return { token: null, user: null, refreshToken: null };
    };

    /* ------------------------------------------------------------ */
    /* silent profile fetch if token already stored                 */
    /* ------------------------------------------------------------ */
    useEffect(() => {
        const initializeAuth = async () => {
            if (!token && !refreshToken) {
                setLoading(false);
                return;
            }

            // If we have a token, try to fetch user profile
            if (token) {
                const type = localStorage.getItem('type') || 'student';
                // Treat trainee users the same as student users for API calls
                const apiType = type === 'trainee' ? 'student' : type;
                
                try {
                    const { data } = await authService.me(apiType);
                    setUser(data.data);
                } catch (error) {
                    /* keep token if still in OTP flow */
                    if (otpSession) return;
                    
                    // If token is invalid but we have refresh token, try to refresh
                    if (refreshToken && error.response?.status === 401) {
                        try {
                            console.log("Token expired, attempting refresh...");
                            const response = await authService.refreshToken(refreshToken);
                            const newToken = response.data.access_token;
                            
                            if (newToken) {
                                console.log("Token refreshed successfully on startup");
                                localStorage.setItem('token', newToken);
                                setToken(newToken);
                                
                                // Retry profile fetch with new token
                                const { data } = await authService.me(apiType);
                                setUser(data.data);
                            } else {
                                throw new Error("No new token received");
                            }
                        } catch (refreshError) {
                            console.error("Token refresh failed on startup:", refreshError);
                            localStorage.clear();
                            setToken(null);
                            setRefreshToken(null);
                        }
                    } else {
                        localStorage.clear();
                        setToken(null);
                        setRefreshToken(null);
                    }
                }
            } else if (refreshToken && !token) {
                // We have refresh token but no access token, try to refresh
                try {
                    const response = await authService.refreshToken(refreshToken);
                    const newToken = response.data.access_token;
                    
                    if (newToken) {
                        console.log("Token refreshed successfully on startup");
                        localStorage.setItem('token', newToken);
                        setToken(newToken);
                        
                        // Now fetch user profile
                        const type = localStorage.getItem('type') || 'student';
                        const apiType = type === 'trainee' ? 'student' : type;
                        const { data } = await authService.me(apiType);
                        setUser(data.data);
                    } else {
                        throw new Error("No new token received");
                    }
                } catch (refreshError) {
                    console.error("Token refresh failed on startup:", refreshError);
                    localStorage.clear();
                    setToken(null);
                    setRefreshToken(null);
                }
            }
            
            setLoading(false);
        };

        initializeAuth();
    }, [token, refreshToken, otpSession]);

    /* ------------------------------------------------------------ */
    /* auth helpers                                                 */
    /* ------------------------------------------------------------ */
    const login = (emailOrPhone, password) =>
        authService.login({ email: emailOrPhone, password }).then(({ data }) => {
            const authData = extractAuth(data);
            if (authData.token) {
                localStorage.setItem('token', authData.token);
                setToken(authData.token);
            }
            if (authData.refreshToken) {
                localStorage.setItem('refresh_token', authData.refreshToken);
                setRefreshToken(authData.refreshToken);
            }
            if (authData.user) {
                setUser(authData.user);
            }
            return authData;
        });

    const register = (formData) =>
        authService.register(formData).then(({ data }) => {
            const authData = extractAuth(data);
            if (authData.token) {
                localStorage.setItem('token', authData.token);
                setToken(authData.token);
            }
            if (authData.refreshToken) {
                localStorage.setItem('refresh_token', authData.refreshToken);
                setRefreshToken(authData.refreshToken);
            }
            if (authData.user) {
                setUser(authData.user);
            }
            return authData;
        });

    const logout = async () => {
        try {
            /* user may be null if token expired, so guard it */
            if (user) await authService.logout(user.id, user.type);
        } catch (_) { }
        localStorage.clear();
        setToken(null);
        setRefreshToken(null);
        setUser(null);
    };

    /* ------------------------------------------------------------ */
    return (
        <AuthContext.Provider value={{
            user, token, refreshToken, loading,
            setToken, setRefreshToken, setUser,
            login, register, logout,
            otpSession, setOtpSession,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
