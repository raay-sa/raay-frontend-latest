import React from 'react';
import { ClockIcon, PlayIcon, StarIcon, TrashIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import { BsBarChartLineFill } from 'react-icons/bs';

export default function CartItemCard({ item, onRemove, onBuy, canPurchase = true, purchaseMessage = '' }) {
    // Format duration from program_duration (assuming it's in format "H:MM" or "HH:MM")
    const formatDuration = (duration) => {
        if (!duration || duration === "0:00") return "غير محدد";
        
        const [hours, minutes] = duration.split(':');
        const hoursNum = parseInt(hours) || 0;
        const minutesNum = parseInt(minutes) || 0;
        
        if (hoursNum === 0 && minutesNum === 0) return "غير محدد";
        if (hoursNum === 0) return `${minutesNum} دقيقة`;
        if (minutesNum === 0) return `${hoursNum} ساعة`;
        return `${hoursNum} ساعة و ${minutesNum} دقيقة`;
    };

    return (
        <>
            <div className="flex flex-col sm:flex-row items-start sm:items-center p-3 sm:p-4 rounded-lg gap-3 sm:gap-4">
                {/* Image - responsive sizing */}
                <img
                    src={item.image}
                    alt={item.title}
                    className="w-full sm:w-32 md:w-40 lg:w-48 h-32 sm:h-24 md:h-28 lg:h-32 object-cover rounded-lg flex-shrink-0"
                />

                {/* Content - responsive layout */}
                <div className="flex-1 w-full sm:w-auto">
                    <h4 className="font-semibold text-sm sm:text-base mb-1">{item.title}</h4>
                    <p className="text-xs sm:text-sm text-gray-500 mb-2">{item.instructor}</p>
                    
                    {/* Reviews & Rating */}
                    <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-600 mb-2">
                        <StarIcon className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
                        <span>{item.rating || 0}</span>
                        <span>({item.reviewsCount || 0} تقييم)</span>
                    </div>
                    
                    {/* Course details - responsive layout */}
                    <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-[#5F5F5F] mb-3">
                        <span className='py-1 px-2 rounded-xl bg-gray-50'>
                            <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
                            <span>
                                {formatDuration(item.duration)}
                            </span>
                        </span>

                        <span className='py-1 px-2 rounded-xl bg-gray-50'>
                            <PlayIcon className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
                            <span>
                                {item.videoCount || 0} فيديو
                            </span>
                        </span>

                        <span className='py-1 px-2 rounded-xl bg-gray-50'>
                            <BsBarChartLineFill className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
                            <span>
                                {item.level || 'مبتدئ'}
                            </span>
                        </span>
                    </div>
                    
                    {/* Price - show from price_breakdown if available */}
                    <div className="mb-3 sm:mb-0">
                        <h1 className="font-semibold text-lg sm:text-xl lg:text-2xl">
                            <span className="icon-saudi_riyal">&#xea;</span>
                            {item.priceBreakdown?.total ?? item.price}
                        </h1>
                        {item.priceBreakdown && (
                            <div className="text-xs text-gray-500 mt-1">
                                <span>قيمة الدورة: <span className="icon-saudi_riyal">&#xea;</span>{Number(item.priceBreakdown.subtotal || 0).toFixed(2)}</span>
                                <span className="mr-2"> | </span>
                                <span>ضريبة ({item.priceBreakdown.tax_rate || 15}%): <span className="icon-saudi_riyal">&#xea;</span>{Number(item.priceBreakdown.tax_amount || 0).toFixed(2)}</span>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Actions - responsive layout */}
                <div className="flex flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                    {/* Remove button - always visible */}
                    <button 
                        type="button"
                        onClick={() => onRemove(item.rowId || item.id)}
                        className="p-2 sm:p-1 rounded-lg hover:bg-gray-100 transition-colors order-2 sm:order-2"
                    >
                        <TrashIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#C62828] hover:text-red-500" />
                    </button>
                    
                    {/* Buy button or message */}
                    {onBuy ? (
                        <button 
                            onClick={() => onBuy(item)}
                            disabled={!canPurchase}
                            className={`px-3 sm:px-4 w-full sm:w-auto py-2 rounded-lg font-medium flex items-center justify-center gap-2 text-sm sm:text-base order-1 sm:order-1 ${
                                canPurchase 
                                    ? 'bg-primary text-white hover:bg-primary-dark' 
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                            title={purchaseMessage}
                        >
                            <ShoppingCartIcon className="w-4 h-4" />
                            شراء
                        </button>
                    ) : (
                        <div className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-600 bg-gray-50 rounded-lg border text-center order-1 sm:order-1">
                            الدفع سيتم قبل أسبوع من إتاحة الدورة
                        </div>
                    )}
                </div>
            </div>
            <hr className="my-2" />
        </>
    );
}
