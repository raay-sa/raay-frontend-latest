import React from 'react';

export default function CartSummary({ items, cartSummary }) {
    // Use tax breakdown from backend API
    const subtotal = cartSummary?.subtotal ?? 0;
    const taxAmount = cartSummary?.tax_amount ?? 0;
    const total = cartSummary?.total ?? 0;
    const fmt = (v) => Number(v).toFixed(2);
    return (
        <div className="w-full sm:w-72 lg:w-80 xl:w-96 max-h-fit bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow overflow-auto">
            <h3 className="text-sm sm:text-base lg:text-lg font-bold mb-3 sm:mb-4">
                {items.length} برامج تدريبية في السلة
            </h3>

            <hr className='py-2 sm:py-3 lg:py-5' />

            <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4 lg:mb-6">
                {items.map(item => {
                    // Use price_breakdown.total if available, otherwise use item.price
                    const displayPrice = item.priceBreakdown?.total ?? item.price;
                    return (
                        <div
                            key={item.id}
                            className="flex items-center gap-2 sm:gap-3">
                            <img
                                src={item.image}
                                alt={item.title}
                                className="w-8 h-6 sm:w-10 sm:h-8 lg:w-12 lg:h-8 object-cover rounded-md flex-shrink-0"
                            />
                            <p className="flex-1 text-xs sm:text-sm line-clamp-2">
                                {item.title}
                            </p>
                            <span className="text-xs sm:text-sm font-medium flex-shrink-0">
                                <span className="icon-saudi_riyal">&#xea;</span>
                                {Number(displayPrice).toFixed(2)}
                            </span>
                        </div>
                    );
                })}
            </div>

            <div className="space-y-2 pt-2 sm:pt-3 border-t mb-3 sm:mb-4 lg:mb-6">
                <div className="flex justify-between items-center">
                    <span className="text-sm sm:text-base">قيمه الدوره</span>
                    <span className="text-sm sm:text-base font-medium">
                        <span className="icon-saudi_riyal">&#xea;</span>
                        {fmt(subtotal)}
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-sm sm:text-base">ضريبة القيمة المضافة ({cartSummary?.tax_rate || 15}%)</span>
                    <span className="text-sm sm:text-base font-medium">
                        <span className="icon-saudi_riyal">&#xea;</span>
                        {fmt(taxAmount)}
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-sm sm:text-base lg:text-lg font-bold">الإجمالي</span>
                    <span className="text-base sm:text-lg lg:text-xl font-bold">
                        <span className="icon-saudi_riyal">&#xea;</span>
                        {fmt(total)}
                    </span>
                </div>
            </div>

            {/* {onNext && (
                <button
                    onClick={onNext}
                    className="w-full py-2 sm:py-3 bg-primary text-white rounded-lg text-sm sm:text-base font-medium"
                >
                    الدفع
                </button>
            )} */}
        </div>
    );
}
