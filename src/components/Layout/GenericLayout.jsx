import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    BellIcon,
    ChevronLeftIcon,
    ChevronDownIcon,
    MagnifyingGlassIcon,
    ShoppingCartIcon,
    Bars3Icon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { Outlet, NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import SearchService from '../../services/searchService';
import NotificationDropdown from '../NotificationDropdown';

/* Click-outside helper for small popovers (profile menu, search dropdown) */
function useOutsideAlerter(ref, onClickOutside) {
    useEffect(() => {
        function handleClickOutside(e) {
            if (ref.current && !ref.current.contains(e.target)) {
                onClickOutside();
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [ref, onClickOutside]);
}

export default function GenericLayout({ navItems }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();

    // Normalize role/type (prefer context over localStorage)
    const roleFromUser = (user?.role || user?.type || '').trim();
    const typeFromStorage = (localStorage.getItem('type') || '').trim();
    const resolvedRole = roleFromUser || typeFromStorage || 'student';
    const isStudent = resolvedRole === 'student' || resolvedRole === 'trainee';

    // Profile dropdown
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const profileRef = useRef(null);
    const sidebarRef = useRef(null);
    useOutsideAlerter(profileRef, () => setDropdownOpen(false));
    useOutsideAlerter(sidebarRef, () => {
        if (window.innerWidth < 1024) {
            setSidebarOpen(false);
        }
    });

    // Close sidebar on window resize to desktop size and ensure proper initial state
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setSidebarOpen(false);
            }
        };

        // Ensure sidebar is closed on mobile by default
        if (window.innerWidth < 1024) {
            setSidebarOpen(false);
        }

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleAccount = () => {
        setDropdownOpen(false);
        // Treat trainee users the same as student users for navigation
        const navRole = resolvedRole === 'trainee' ? 'student' : resolvedRole;
        navigate(`/${navRole}/settings`);
    };

    const handleLogout = () => {
        setDropdownOpen(false);
        setShowLogoutModal(true);
    };

    const confirmLogout = async () => {
        setShowLogoutModal(false);
        await logout();
        navigate(import.meta.env.VITE_MAIN_LOGIN_ROUTE)
        // navigate('/login');
    };

    /* ==========================
       Student search state/logic
       ========================== */
    const [searchValue, setSearchValue] = useState('');
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [results, setResults] = useState([]);
    const [searchError, setSearchError] = useState('');
    const searchWrapRef = useRef(null);
    useOutsideAlerter(searchWrapRef, () => setSearchOpen(false));

    // Close results on ESC
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') setSearchOpen(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const performSearch = useCallback(async (q) => {
        if (!q || q.trim().length < 2) {
            setResults([]);
            setSearchError('');
            return;
        }
        setSearchLoading(true);
        setSearchError('');
        try {
            const { data } = await SearchService.searchPrograms(q.trim());
            const list = Array.isArray(data?.programs) ? data.programs : [];
            setResults(list);
        } catch (e) {
            console.error('Search failed', e);
            setResults([]);
            setSearchError('حدث خطأ أثناء البحث');
        } finally {
            setSearchLoading(false);
        }
    }, []);

    // Debounce input
    useEffect(() => {
        const id = setTimeout(() => performSearch(searchValue), 400);
        return () => clearTimeout(id);
    }, [searchValue, performSearch]);

    const onResultClick = (programId) => {
        setSearchOpen(false);
        setSearchValue('');
        setResults([]);
        navigate(`/student/courses/${programId}`);
    };

    /* ==========================
       Collapsible grouped sidebar
       ========================== */

    // Track which groups are expanded: {<groupKey>: boolean}
    const [expandedGroups, setExpandedGroups] = useState({});

    // Helper: returns true if the current location matches one of the children
    const groupHasActiveChild = (children) => {
        const pathname = location.pathname || '';
        return children?.some((c) => pathname.startsWith(`/admin/${c.to}`));
    };

    // Auto-expand any group that contains current active route
    useEffect(() => {
        const initial = {};
        (navItems || []).forEach((item, idx) => {
            if (item?.type === 'group' && Array.isArray(item.children)) {
                const open = groupHasActiveChild(item.children);
                initial[idx] = open;
            }
        });
        setExpandedGroups((prev) => ({ ...prev, ...initial }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname, JSON.stringify(navItems || [])]);

    const toggleGroup = (key) =>
        setExpandedGroups((s) => ({ ...s, [key]: !s[key] }));

    // Render a single simple link item
    const SimpleItem = ({ to, label, Icon }) => (
        <NavLink
            to={to}
            end
            className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg transition ${isActive ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-50'
                }`
            }
        >
            {Icon ? <Icon className="w-5 h-5" /> : null}
            <span className="flex-1">{label}</span>
        </NavLink>
    );

    // Render a grouped item with collapsible children
    const GroupItem = ({ item, groupKey }) => {
        const isOpen = !!expandedGroups[groupKey];
        const headerActive = groupHasActiveChild(item.children);

        return (
            <div className="rounded-lg border border-gray-200 bg-white">
                <button
                    type="button"
                    onClick={() => toggleGroup(groupKey)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition text-right ${headerActive ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                >
                    {item.icon ? <item.icon className="w-5 h-5" /> : null}
                    <span className="flex-1">{item.label}</span>
                    <ChevronDownIcon
                        className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                </button>

                {/* Children live inside the sidebar (no absolute positioning) */}
                {isOpen && (
                    <div className="px-2 py-2">
                        <nav className="space-y-1">
                            {item.children.map((child) => (
                                <NavLink
                                    key={child.to}
                                    to={child.to}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 pr-6 pl-3 py-2 rounded-lg transition ${isActive ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-50'
                                        }`
                                    }
                                >
                                    {child.icon ? (
                                        <child.icon className="w-4 h-4" />
                                    ) : (
                                        <span className="inline-block w-2 h-2 rounded-full bg-gray-300" />
                                    )}
                                    <span className="flex-1">{child.label}</span>
                                </NavLink>
                            ))}
                        </nav>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex h-screen bg-[#FAFAFA] overflow-hidden">
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside 
                ref={sidebarRef}
                className={`
                    fixed lg:static inset-y-0 z-50 lg:z-20
                    w-64 bg-white flex flex-col justify-between p-4 lg:p-6 shadow-xl
                    transition-all duration-300 ease-in-out
                    lg:!right-0
                `}
                style={{
                    right: sidebarOpen ? '0px' : '-100%'
                }}
            >
                {/* Make the nav area scrollable, so expanded groups never overflow */}
                <div className="flex-1 min-h-0 flex flex-col">
                    {/* Mobile close button */}
                    <div className="flex justify-between items-center mb-6 lg:hidden">
                        <a 
                            href={import.meta.env.VITE_WEBSITE_LINK} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="cursor-pointer"
                        >
                            <img
                                src="/images/logoheaderrayy.png"
                                alt="راي"
                                className="h-10"
                            />
                        </a>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="p-2 rounded-lg hover:bg-gray-100"
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Desktop Logo */}
                    <div className="hidden lg:flex justify-center mb-6">
                        <a 
                            href={import.meta.env.VITE_WEBSITE_LINK}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="cursor-pointer"
                        >
                            <img
                                src="/images/logoheaderrayy.png"
                                alt="راي"
                                className="h-14"
                            />
                        </a>
                    </div>

                    {/* Nav */}
                    <div className="overflow-y-auto pr-1 space-y-2">
                        {(navItems || []).map((item, idx) => {
                            if (item?.type === 'group') {
                                return <GroupItem key={`g-${idx}`} item={item} groupKey={idx} />;
                            }
                            return (
                                <SimpleItem
                                    key={item.to || `i-${idx}`}
                                    to={item.to}
                                    label={item.label}
                                    Icon={item.icon}
                                />
                            );
                        })}
                    </div>
                </div>

                {/* User box + dropdown */}
                <div ref={profileRef} className="relative mt-4">
                    <div
                        className="flex items-center gap-3 bg-white p-2 rounded-lg shadow cursor-pointer"
                        onClick={() => setDropdownOpen((o) => !o)}
                    >
                        <div className="flex gap-1">
                            <img
                                src={
                                    user?.image
                                        ? `${import.meta.env.VITE_BASE_URL}/${user.image}`
                                        : '/images/avatar.png'
                                }
                                alt="User"
                                className="w-10 h-10 rounded-full object-cover"
                            />
                            <div>
                                <p className="font-medium text-gray-800">
                                    {user?.name || '—'}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {user?.email || ''}
                                </p>
                            </div>
                        </div>
                        <ChevronLeftIcon className="w-5 h-5" />
                    </div>

                    {dropdownOpen && (
                        <div className="absolute right-full top-1/2 transform -translate-y-1/2 mr-2 w-40 bg-white rounded-lg shadow-lg overflow-hidden">
                            <button
                                className="w-full text-right px-4 py-2 hover:bg-gray-100"
                                onClick={handleAccount}
                            >
                                حسابي
                            </button>
                            <button
                                className="w-full text-right px-4 py-2 hover:bg-gray-100"
                                onClick={handleLogout}
                            >
                                تسجيل الخروج
                            </button>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main area */}
            <div className="flex-1 flex flex-col lg:mr-0">
                {/* Header */}
                <header className="bg-white px-3 lg:px-6 py-3 lg:py-4 flex justify-between items-center shadow-xl z-10">
                    {/* Mobile menu button */}
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
                    >
                        <Bars3Icon className="w-6 h-6" />
                    </button>
                    {/* Greeting */}
                    <div className="flex-1 mr-4">
                        <p className="text-base lg:text-lg font-semibold truncate">
                            {user ? `مرحباً ${user.name}` : 'مرحباً'}
                        </p>
                        <p className="text-xs lg:text-sm text-gray-500 hidden sm:block">
                            مرحباً بك مرة أخرى في لوحة التحكم.
                        </p>
                    </div>

                    {/* Search (students only) */}
                    {isStudent && (
                        <div className="hidden md:block w-1/2 px-6" ref={searchWrapRef}>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center">
                                    <div className="w-8 h-8 bg-primary flex items-center justify-center rounded-lg me-3">
                                        <MagnifyingGlassIcon className="w-5 h-5 text-white" />
                                    </div>
                                </div>
                                <input
                                    type="text"
                                    placeholder="ماذا تريد أن تتعلم؟"
                                    className="w-full bg-white border border-gray-300 rounded-lg py-2 pr-4 pl-12 focus:outline-none focus:ring-primary focus:border-primary"
                                    value={searchValue}
                                    onChange={(e) => {
                                        setSearchValue(e.target.value);
                                        if (!searchOpen) setSearchOpen(true);
                                    }}
                                    onFocus={() => setSearchOpen(true)}
                                />

                                {/* Results dropdown */}
                                {searchOpen && (
                                    <div className="absolute mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
                                        {/* Loading */}
                                        {searchLoading && (
                                            <div className="px-4 py-3 text-sm text-gray-500">
                                                جاري البحث...
                                            </div>
                                        )}

                                        {/* Error */}
                                        {!searchLoading && searchError && (
                                            <div className="px-4 py-3 text-sm text-red-600">
                                                {searchError}
                                            </div>
                                        )}

                                        {/* No results */}
                                        {!searchLoading &&
                                            !searchError &&
                                            searchValue.trim().length >= 2 &&
                                            results.length === 0 && (
                                                <div className="px-4 py-3 text-sm text-gray-500">
                                                    لا توجد نتائج
                                                </div>
                                            )}

                                        {/* Results list */}
                                        {!searchLoading &&
                                            !searchError &&
                                            results.length > 0 && (
                                                <ul className="max-h-80 overflow-auto">
                                                    {results.map((p) => (
                                                        <li
                                                            key={p.id}
                                                            className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-start gap-3"
                                                            onClick={() => onResultClick(p.id)}
                                                        >
                                                            <div className="w-12 h-12 rounded bg-gray-100 overflow-hidden flex-shrink-0">
                                                                {p.image ? (
                                                                    <img
                                                                        src={`${import.meta.env.VITE_BASE_URL}/${p.image}`}
                                                                        alt={p.title}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                                                                        لا صورة
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="font-medium text-gray-900">
                                                                    {p.title || '—'}
                                                                </div>
                                                                <div className="text-xs text-gray-500 mt-0.5">
                                                                    {p.category?.title ? p.category.title : '—'}
                                                                </div>
                                                                <div className="text-sm text-primary mt-1">
                                                                    {typeof p.price === 'number'
                                                                        ? `${p.price} ر.س`
                                                                        : '—'}
                                                                </div>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Icons */}
                    <div className="flex items-center gap-2 lg:gap-4">
                        <NotificationDropdown isStudent={isStudent} />
                        {isStudent && (
                            <ShoppingCartIcon className="w-5 h-5 lg:w-6 lg:h-6 text-gray-600 cursor-pointer" />
                        )}
                        <img
                            src={
                                user?.image
                                    ? `${import.meta.env.VITE_BASE_URL}/${user.image}`
                                    : '/images/avatar.png'
                            }
                            alt="User"
                            className="w-7 h-7 lg:w-8 lg:h-8 rounded-full object-cover"
                        />
                    </div>
                </header>

                {/* Page content */}
                <main className="overflow-auto">
                    <Outlet />
                </main>
            </div>

            {/* Logout confirmation modal */}
            {showLogoutModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-sm w-full space-y-4">
                        <h2 className="text-xl font-bold">
                            هل أنت متأكد أنك تريد تسجيل الخروج؟
                        </h2>
                        <p className="text-gray-600">
                            عند تسجيل الخروج، سيتم إنهاء جلستك الحالية. ويمكنك دائماً تسجيل الدخول مرة أخرى في أي وقت.
                        </p>
                        <div className="flex justify-center gap-4 mt-4">
                            <button
                                onClick={() => setShowLogoutModal(false)}
                                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md"
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={confirmLogout}
                                className="px-6 py-2 bg-primary text-white rounded-md"
                            >
                                تأكيد الخروج
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
