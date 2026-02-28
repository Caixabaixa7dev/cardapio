import React, { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';
import { AlertCircle, Ticket, X } from 'lucide-react';
import { useWhiteLabel } from '../context/WhiteLabelContext';

export default function CouponSplash() {
    const { availableCoupons } = useCart();
    const { storeName } = useWhiteLabel();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if user has already seen the splash
        const hasSeenSplash = localStorage.getItem('@acaiRino:splashShown');
        if (!hasSeenSplash) {
            // Small delay so it feels like a welcome popup
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        localStorage.setItem('@acaiRino:splashShown', 'true');
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-[#FFEB3B] w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl relative animate-scale-up">

                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 z-10 bg-black/10 hover:bg-black/20 text-black/80 p-2 rounded-full transition-colors"
                >
                    <X size={20} />
                </button>

                {/* Header Section */}
                <div className="pt-8 px-6 pb-6 relative">
                    <h2 className="text-3xl font-black text-black leading-tight mb-2">
                        R$100 em cupons<br />só pra você!
                    </h2>
                    <p className="text-black/80 font-medium text-sm flex items-center gap-1">
                        <AlertCircle size={14} /> Confira os descontos disponíveis
                    </p>
                </div>

                {/* Coupon Cards Section */}
                <div className="px-4 pb-6 flex flex-col gap-3">
                    {availableCoupons.map((coupon, idx) => (
                        <div key={idx} className="bg-white rounded-2xl p-4 flex items-center shadow-sm relative overflow-hidden">
                            {/* Visual Tear Details */}
                            <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#FFEB3B]" />
                            <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#FFEB3B]" />
                            <div className="absolute left-16 top-0 bottom-0 border-l-2 border-dashed border-gray-100" />

                            {/* Icon */}
                            <div className="w-12 flex justify-center text-[#ff6b6b]">
                                <Ticket size={28} />
                            </div>

                            {/* Info */}
                            <div className="flex-1 pl-6">
                                <h3 className="font-black text-lg text-gray-900">{coupon.title}</h3>
                                <p className="text-xs text-gray-500 font-medium">
                                    Apenas no {storeName || 'Açai Rino'}<br />
                                    {coupon.description}
                                </p>
                            </div>
                        </div>
                    ))}

                    {/* Action Button */}
                    <button
                        onClick={handleClose}
                        className="mt-4 bg-black text-white font-black text-xl py-4 rounded-2xl hover:bg-gray-900 transition-colors shadow-lg active:scale-95 transform"
                    >
                        Peça já!
                    </button>
                </div>

            </div>
        </div>
    );
}
