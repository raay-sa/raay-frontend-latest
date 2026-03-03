import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PageSkeleton from '../components/Loaders/PageSkeleton'; // or any small loader

export default function ProtectedRoute({ allowedRoles }) {
    const { user, token, loading } = useAuth();

    // 1) While we are restoring session / fetching profile -> show loader, no redirect.
    if (loading) return <PageSkeleton />; // or: return null

    // 2) No token at all => unauthenticated
    if (!token) return <Navigate to="/login" replace />;

    // 3) Token exists but user still null (rare, but defensive)
    if (!user) return <Navigate to="/login" replace />;

    // 4) Role guard: if allowedRoles is provided and user.type is NOT in it -> bounce to their own dashboard
    if (allowedRoles && !allowedRoles.includes(user.type)) {
        // Treat trainee users the same as student users
        const userType = user.type === 'trainee' ? 'student' : user.type;
        return <Navigate to={`/${userType}`} replace />;
    }

    // 5) All good
    return <Outlet />;
}
