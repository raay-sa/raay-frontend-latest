// src/pages/dashboard/student/Cart.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import CartEmpty from '../../../components/CartEmpty';
import CartItemCard from '../../../components/CartItemCard';
import CartSummary from '../../../components/CartSummary';
import PaymentPage from './PaymentPage';
import OrderCompleteModal from './OrderCompleteModal';
import StudentShopService from '../../../services/student/shopService';
import { withBaseUrl } from '../../../utils/url';

export default function Cart() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState([]); // raw cart rows from API
    const [showComplete, setShowComplete] = useState(false);
    const [purchaseStatus, setPurchaseStatus] = useState({}); // Track purchase status for each item
    const [cartSummary, setCartSummary] = useState(null); // Cart summary from backend (includes tax breakdown)

    const location = useLocation();
    const navigate = useNavigate();

    // fetch cart
    const fetchCart = async (showLoading = true) => {
        if (showLoading) {
            setLoading(true);
        }
        try {
            const { data } = await StudentShopService.list();
            const arr = data?.data?.data || [];
            setRows(arr);
            // Store cart summary from backend (includes tax breakdown)
            if (data?.data?.cart_summary) {
                setCartSummary(data.data.cart_summary);
            } else if (data?.cart_summary) {
                setCartSummary(data.cart_summary);
            }
            
            // Check purchase status for each item
            const statusPromises = arr.map(async (row) => {
                try {
                    const response = await StudentShopService.canPurchase(row.program_id);
                    return {
                        programId: row.program_id,
                        canPurchase: response.data.can_purchase,
                        message: response.data.message,
                        daysUntilStart: response.data.days_until_start,
                        showBuyButton: response.data.show_buy_button,
                        isWithin7Days: response.data.is_within_7_days,
                        inCart: response.data.in_cart
                    };
                } catch (e) {
                    console.error('Failed to check purchase status:', e);
                    return {
                        programId: row.program_id,
                        canPurchase: false,
                        message: 'خطأ في التحقق من حالة الشراء',
                        daysUntilStart: null,
                        showBuyButton: false,
                        isWithin7Days: false,
                        inCart: false
                    };
                }
            });
            
            const statuses = await Promise.all(statusPromises);
            const statusMap = {};
            statuses.forEach(status => {
                statusMap[status.programId] = status;
            });
            setPurchaseStatus(statusMap);
        } catch (e) {
            console.error('Failed to load cart:', e);
            setRows([]);
        } finally {
            if (showLoading) {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        fetchCart();
    }, []);

    // When returning from MyFatoorah:
    // /student/cart?status=success|authorized|failed|error&invoice=&paymentId=
    useEffect(() => {
        const qs = new URLSearchParams(location.search);
        const status = qs.get('status');
        const invoice = qs.get('invoice');
        // const paymentId = qs.get('paymentId');

        if (!status) return;

        // Remove the query params from URL after handling them (prevents re-trigger on refresh)
        const clearParams = () => navigate('/student/cart', { replace: true });

        if (status === 'success' || status === 'authorized' || status === 'completed') {
            // Show step 3 modal
            setStep(3);
            setShowComplete(true);

            // Optional: toast / info
            const msg =
                status === 'success' || status === 'completed'
                    ? 'تم الدفع بنجاح'
                    : 'تمت الموافقة على العملية (Authorized) وستتم التسوية لاحقًا';
            toast.success(`${msg}${invoice ? ` — فاتورة #${invoice}` : ''}`);

            // Clear cart locally (backend should already have moved items to subscriptions)
            setRows([]);

            // Clear query string shortly after so the modal isn't re-triggered on refresh
            const t = setTimeout(clearParams, 500);
            return () => clearTimeout(t);
        }

        if (status === 'failed' || status === 'error') {
            // Send user back to payment step
            setStep(2);
            toast.error('فشلت عملية الدفع. حاول مرة أخرى.');

            // Clean URL
            clearParams();
        }
    }, [location.search, navigate]);

    // Helper function to get localized content
    const getLocalizedContent = (translations, field = 'title') => {
        if (!translations || !Array.isArray(translations)) return '';
        
        // Try to find Arabic content first, then English
        const arabicContent = translations.find(t => t.locale === 'ar');
        const englishContent = translations.find(t => t.locale === 'en');
        
        return arabicContent?.[field] || englishContent?.[field] || '';
    };

    // map rows -> UI items
    const cartItems = useMemo(() => {
        return rows.map((row) => {
            const p = row.program || {};
            const programTranslations = p.translations || [];
            // Use price_breakdown.total from API if available, otherwise fallback to program.price
            const priceBreakdown = row.price_breakdown || {};
            const itemPrice = priceBreakdown.total ?? p.price ?? 0;
            
            return {
                // keep cart row id to remove via API
                rowId: row.id,
                id: row.id, // used by CartItemCard; we'll pass rowId to onRemove
                programId: p.id, // Add program ID for status lookup
                title: getLocalizedContent(programTranslations, 'title') || p.title || '',
                instructor: p.teacher?.name || '',
                price: itemPrice,
                priceBreakdown: priceBreakdown, // Pass price breakdown for detailed display
                rating: p.reviews_avg_score ? parseFloat(p.reviews_avg_score) : 0,
                reviewsCount: p.reviews_count ?? 0,
                videoCount: p.video_count ?? 0,
                duration: p.program_duration || "0:00",
                level: p.level || 'مبتدئ',
                image: withBaseUrl(p.image),
            };
        });
    }, [rows]);

    const total = useMemo(
        () => cartItems.reduce((sum, item) => sum + (Number(item.price) || 0), 0),
        [cartItems]
    );

    const handleRemove = async (cartRowId) => {
        // optimistic remove
        setRows((prev) => prev.filter((r) => r.id !== cartRowId));
        try {
            await StudentShopService.remove(cartRowId);
            // Re-fetch cart to update sidebar and ensure server truth (without showing loading)
            await fetchCart(false);
        } catch (e) {
            console.error('Failed to remove from cart:', e);
            // rollback if failed (without showing loading)
            await fetchCart(false);
        }
    };

    const handleBuy = async (item) => {
        try {
            // Purchase specific course from cart
            const response = await StudentShopService.purchaseCourse(item.rowId);
            if (response.data.payment_url) {
                // Redirect to payment
                window.location.href = response.data.payment_url;
            }
        } catch (e) {
            console.error('Failed to initiate payment:', e);
            const errorMessage = e.response?.data?.message || 'فشل في بدء عملية الدفع. حاول مرة أخرى.';
            toast.error(errorMessage);
        }
    };

    const handleNext = () => setStep((prev) => prev + 1);
    const handleBack = () => setStep((prev) => prev - 1);

    // const handlePaymentSuccess = () => {
    //     // Only used for non-redirect flows; kept for compatibility
    //     setShowComplete(true);
    //     setRows([]);
    // };

    if (step === 1 && !loading && cartItems.length === 0) {
        return <CartEmpty />;
    }

    return (
        <div className="p-3 sm:p-4 lg:p-8 max-w-7xl mx-auto">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 sm:mb-6">عربة التسوق</h1>

            {/* Progress Steps - responsive layout */}
            <div className="flex flex-row w-full max-w-2xl items-center justify-between mx-auto space-y-3 sm:space-y-0 sm:space-x-4 mb-6 lg:mb-8 font-bold">
                <StepCircle number={1} label="عربة التسوق" current={step} />
                <StepCircle number={2} label="الدفع" current={step} />
                <StepCircle number={3} label="الطلب مكتمل" current={step} />
            </div>

            {loading && step === 1 && (
                <div className="text-xs sm:text-sm text-gray-500 text-center">جاري التحميل…</div>
            )}

            {/* Step 1: cart list + summary */}
            {step === 1 && !loading && (
                <div className="flex flex-col sm:flex-row gap-4 lg:gap-6 xl:gap-8">
                    {/* Cart Items */}
                    <div className="flex-1 space-y-3 sm:space-y-4">
                        {cartItems.map((item) => {
                            // Use program ID to get the correct status
                            const status = purchaseStatus[item.programId] || {};
                            return (
                                <CartItemCard
                                    key={item.rowId}
                                    item={item}
                                    rating={item.rating}
                                    reviewsCount={item.reviewsCount}
                                    questions={item.questions}
                                    onRemove={() => handleRemove(item.rowId)}
                                    onBuy={status.showBuyButton ? handleBuy : null}
                                    canPurchase={status.showBuyButton}
                                    purchaseMessage={status.message}
                                />
                            );
                        })}
                    </div>
                    
                    {/* Cart Summary - sticky on larger screens */}
                    <div className="sm:sticky sm:top-4 sm:self-start">
                        <CartSummary
                            items={cartItems}
                            count={cartItems.length}
                            cartSummary={cartSummary}
                            onNext={handleNext}
                        />
                    </div>
                </div>
            )}

            {/* Step 2: payment (redirect to MyFatoorah) */}
            {step === 2 && (
                <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
                    <div className="flex-1 space-y-4">
                        {/* We pass total from backend cart_summary so PaymentPage can create the invoice/session */}
                        <PaymentPage total={cartSummary?.total || total} />
                    </div>
                    {/* Keep summary for context; user will click the Pay button inside PaymentPage */}
                    <CartSummary
                        items={cartItems}
                        count={cartItems.length}
                        cartSummary={cartSummary}
                        onBack={handleBack}
                    />
                </div>
            )}

            {/* Step 3 (modal) */}
            {showComplete && (
                <OrderCompleteModal
                    onStartLearning={() => (window.location.href = '/student/courses')}
                />
            )}
        </div>
    );
}

function StepCircle({ number, label, current }) {
    const completed = number < current;
    const active = number === current;

    const circleBg = completed ? 'bg-green-500' : active ? 'bg-primary' : 'bg-gray-200';
    const circleText = completed || active ? 'text-white' : 'text-gray-600';
    const labelColor = completed ? 'text-green-500' : active ? 'text-primary' : 'text-gray-400';

    return (
        <div className="flex gap-2 items-center">
            <div className={`w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-full ${circleBg} ${circleText}`}>
                {completed ? (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                ) : (
                    <span className="text-xs sm:text-sm">{number}</span>
                )}
            </div>
            <span className={`${labelColor} text-xs sm:text-sm mt-1`}>{label}</span>
        </div>
    );
}
