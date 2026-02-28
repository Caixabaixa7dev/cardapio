import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { ArrowLeft, Trash2, Plus, Minus, Tag, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

export default function IFoodCartScreen() {
    const navigate = useNavigate();
    const {
        cartItems, updateQuantity, removeFromCart, cartTotal, cartCount,
        appliedCoupon, applyCoupon, removeCoupon, discountAmount, availableCoupons
    } = useCart();

    const [showCoupons, setShowCoupons] = useState(false);
    const [showRegister, setShowRegister] = useState(false);
    const [guestName, setGuestName] = useState('');
    const [guestPhone, setGuestPhone] = useState('');

    useEffect(() => {
        // Preenche info se ja tentou e recarregou a pagina
        const saved = localStorage.getItem('@acaiRino:user');
        if (saved) {
            const data = JSON.parse(saved);
            setGuestName(data.name || '');
            setGuestPhone(data.phone || '');
        }
    }, []);

    const handleApply = (code) => {
        const success = applyCoupon(code);
        if (success) setShowCoupons(false);
    };

    const handleFinish = () => {
        if (cartCount > 0) {
            const hasUser = localStorage.getItem('@acaiRino:user');
            if (hasUser) {
                navigate('/delivery', { state: { finalTotal: cartTotal - discountAmount } });
            } else {
                setShowRegister(true);
            }
        }
    };

    const handleSaveGuest = () => {
        if (guestName.length > 2 && guestPhone.length >= 10) {
            localStorage.setItem('@acaiRino:user', JSON.stringify({ name: guestName, phone: guestPhone }));
            setShowRegister(false);
            navigate('/delivery', { state: { finalTotal: cartTotal - discountAmount } });
        }
    };

    return (
        <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="flex flex-col min-h-screen bg-gray-50 pb-24 font-sans"
        >
            {/* Header Fixo */}
            <header className="sticky top-0 z-50 bg-white shadow-sm flex items-center justify-between p-4 mb-2">
                <button onClick={() => navigate(-1)} className="p-1 rounded-full active:bg-gray-100 transition-colors" style={{ color: 'var(--primary)' }}>
                    <ArrowLeft size={24} />
                </button>
                <div className="flex-1 flex justify-center items-center gap-2">
                    <h1 className="font-bold text-gray-800 text-lg">Carrinho</h1>
                    {cartCount > 0 && (
                        <span className="text-white text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--primary)' }}>
                            {cartCount}
                        </span>
                    )}
                </div>
                <div style={{ width: 32 }}></div> {/* Espaçador para centralizar */}
            </header>

            {/* Lista de Itens */}
            <div className="flex-1 bg-white p-4">
                {cartItems.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                        <p>Seu carrinho está vazio.</p>
                    </div>
                ) : (
                    <div className="flex flex-col divide-y">
                        {cartItems.map(item => (
                            <div key={item.id} className="py-4 flex gap-4">
                                <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-md" />
                                <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-gray-800 font-medium text-sm">{item.name}</h3>

                                        {/* Exibe as customizações selecionadas */}
                                        {item.customOptions && item.customOptions.length > 0 && (
                                            <ul className="mt-1 text-xs text-gray-500 flex flex-col gap-0.5">
                                                {item.customOptions.map((opt, idx) => (
                                                    <li key={idx} className="flex gap-1">
                                                        <span>•</span> {opt.name} {opt.price > 0 ? `(+ ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(opt.price)})` : ''}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}

                                        {/* Exibe Observação se houver */}
                                        {item.observation && (
                                            <p className="mt-1.5 text-xs text-gray-500 italic bg-gray-50 p-2 rounded-md border">
                                                Obs: {item.observation}
                                            </p>
                                        )}

                                        <p className="font-bold text-gray-900 mt-2 flex justify-between items-center">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
                                        </p>
                                    </div>

                                    {/* Stepper (+ / -) iFood Style */}
                                    <div className="flex items-center gap-4 mt-2 self-start">
                                        <div className="flex items-center bg-gray-50 rounded-lg p-1 border">
                                            {item.quantity === 1 ? (
                                                <motion.button whileTap={{ scale: 0.8 }} onClick={() => removeFromCart(item.id)} className="w-8 h-8 flex items-center justify-center" style={{ color: 'var(--primary)' }}><Trash2 size={16} /></motion.button>
                                            ) : (
                                                <motion.button whileTap={{ scale: 0.8 }} onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 flex items-center justify-center" style={{ color: 'var(--primary)' }}><Minus size={16} /></motion.button>
                                            )}

                                            <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>

                                            <motion.button whileTap={{ scale: 0.8 }} onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 flex items-center justify-center" style={{ color: 'var(--primary)' }}><Plus size={16} /></motion.button>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Info Taxa de Entrega (Regra R$ 60) */}
            {cartTotal < 60 && cartCount > 0 && (
                <div className="bg-gray-100 p-4 text-center">
                    <p className="text-xs text-gray-500 font-medium">Faltam {(60 - cartTotal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} para Entrega Grátis!</p>
                </div>
            )}

            {/* Seção Cupons (Estilo 99 Food/iFood) */}
            {cartCount > 0 && (
                <div className="bg-white p-4 mb-2">
                    <h3 className="font-bold text-gray-800 text-sm mb-3">Cupons e descontos</h3>
                    {!appliedCoupon ? (
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowCoupons(true)}
                                className="w-full flex items-center justify-between border rounded-lg py-3 px-4 transition-colors bg-white group hover:bg-gray-50"
                            >
                                <div className="flex items-center gap-2">
                                    <Tag className="text-gray-400 transition-colors" size={20} style={{ color: 'var(--primary)' }} />
                                    <span className="text-sm font-medium text-gray-700" style={{ color: 'var(--primary)' }}>Selecione um cupom</span>
                                </div>
                                <div className="bg-gray-100 text-xs font-bold px-3 py-1 rounded-full" style={{ color: 'var(--primary)' }}>
                                    {availableCoupons.length} disponíveis
                                </div>
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="text-green-600" size={20} />
                                <div>
                                    <p className="font-bold text-green-700 text-sm">{appliedCoupon.code}</p>
                                    <p className="text-green-600 text-xs text-left">Desconto aplicado</p>
                                </div>
                            </div>
                            <button onClick={removeCoupon} className="text-gray-400 text-sm underline active:text-gray-500">
                                Remover
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Rodapé Fixo (Tamanho 99 Food) */}
            <div className="fixed bottom-0 left-0 w-full bg-white border-t z-40 pb-4">
                <div className="p-4 flex flex-col gap-1">
                    <div className="flex justify-between items-center text-sm text-gray-500">
                        <span>Subtotal</span>
                        <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cartTotal)}</span>
                    </div>

                    {discountAmount > 0 && (
                        <div className="flex justify-between items-center text-sm font-medium text-green-600">
                            <span>Cupons de desconto</span>
                            <span className="flex items-center gap-1">
                                <CheckCircle2 size={14} />
                                -{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(discountAmount)}
                            </span>
                        </div>
                    )}

                    <div className="flex justify-between items-center mt-2 border-t pt-2">
                        <span className="text-gray-900 font-bold text-lg">Total</span>
                        <div className="text-right">
                            <span className="text-gray-900 font-black text-xl block">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cartTotal - discountAmount)}
                            </span>
                            {discountAmount > 0 && (
                                <span className="text-green-600 text-xs font-medium">Economizou {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(discountAmount)}</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="px-4">
                    <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={handleFinish}
                        disabled={cartCount === 0}
                        className="w-full text-white font-bold py-3.5 rounded-lg disabled:opacity-50 transition-colors hover:opacity-90"
                        style={{ backgroundColor: cartCount === 0 ? '' : 'var(--primary)' }}
                    >
                        CONTINUAR
                    </motion.button>
                </div>
            </div>

            {/* Modal de Registro (Gateway Fast Guest) */}
            <AnimatePresence>
                {showRegister && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 z-[100] flex justify-center items-end"
                    >
                        <motion.div
                            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="bg-white w-full max-w-md rounded-t-3xl p-6 flex flex-col"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6"></div>
                            <h2 className="text-2xl font-black mb-2" style={{ color: 'var(--primary)' }}>Quem é você?</h2>
                            <p className="text-gray-500 text-sm mb-6">Para agilizar seu pedido e não precisarmos criar senha, só preencha os dados abaixo e pronto!</p>

                            <div className="flex flex-col gap-4 mb-8">
                                <input
                                    type="text" placeholder="Qual o seu nome?"
                                    value={guestName} onChange={e => setGuestName(e.target.value)}
                                    className="p-4 border rounded-xl bg-gray-50 focus:bg-white focus:border-purple-600 outline-none w-full"
                                />
                                <input
                                    type="text" placeholder="WhatsApp (com DDD)" maxLength={15}
                                    value={guestPhone} onChange={e => setGuestPhone(e.target.value)}
                                    className="p-4 border rounded-xl bg-gray-50 focus:bg-white focus:border-purple-600 outline-none w-full"
                                />
                            </div>

                            <button
                                onClick={handleSaveGuest}
                                disabled={guestName.length < 3 || guestPhone.length < 10}
                                className="w-full text-white font-bold py-4 rounded-xl disabled:bg-gray-300 transition-colors hover:opacity-90 mt-4"
                                style={{ backgroundColor: (guestName.length < 3 || guestPhone.length < 10) ? '' : 'var(--primary)' }}
                            >
                                Confirmar e Ir para Entrega
                            </button>
                            <button
                                onClick={() => setShowRegister(false)}
                                className="w-full bg-white text-gray-500 font-bold py-3 mt-2 rounded-xl active:bg-gray-50"
                            >
                                Cancelar
                            </button>
                        </motion.div>
                    </motion.div>
                )}

                {/* Modal de Cupons (Bottom Sheet) */}
                {showCoupons && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 z-[100] flex justify-center items-end"
                        onClick={() => setShowCoupons(false)}
                    >
                        <motion.div
                            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="bg-white w-full max-w-md rounded-t-3xl flex flex-col max-h-[85vh] overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-4 border-b flex justify-between items-center bg-white sticky top-0 z-10">
                                <h2 className="text-lg font-bold text-gray-900">Meus Cupons</h2>
                                <button onClick={() => setShowCoupons(false)} className="text-gray-400 hover:text-gray-600 p-1">
                                    <CheckCircle2 size={24} className="opacity-0 hidden" /> {/* Espaçador para flex-between */}
                                    <ArrowLeft onClick={() => setShowCoupons(false)} size={24} className="rotate-180" />
                                </button>
                            </div>

                            <div className="p-4 overflow-y-auto bg-gray-50 flex-1 flex flex-col gap-3">
                                {availableCoupons.map((coupon, idx) => {
                                    const canUse = !coupon.minOrder || cartTotal >= coupon.minOrder;

                                    return (
                                        <div
                                            key={idx}
                                            onClick={() => canUse && handleApply(coupon.code)}
                                            className={`bg-white rounded-xl p-4 border flex gap-4 transition-colors ${canUse ? 'cursor-pointer hover:border-purple-300 shadow-sm' : 'opacity-60 grayscale cursor-not-allowed'}`}
                                        >
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${canUse ? 'bg-[#FFEB3B] text-black' : 'bg-gray-200 text-gray-500'}`}>
                                                <Tag size={20} />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-bold text-gray-900 text-base">{coupon.title}</h3>
                                                <p className="text-sm text-gray-500 line-clamp-2 leading-snug mt-0.5">{coupon.description}</p>

                                                {!canUse && (
                                                    <p className="text-xs text-red-500 font-bold mt-1.5 flex items-center gap-1">
                                                        Faltam {(coupon.minOrder - cartTotal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                    </p>
                                                )}

                                                {canUse && (
                                                    <p className="text-[10px] text-green-600 font-bold mt-2 uppercase tracking-wide">
                                                        Toque para aplicar
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </motion.div>
    );
}
