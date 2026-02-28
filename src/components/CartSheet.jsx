import { useCart } from '../context/CartContext';
import { ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CartSheet({ onCheckout }) {
    const { cartCount, cartTotal } = useCart();

    if (cartCount === 0) return null;

    return (
        <AnimatePresence>
            {cartCount > 0 && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-4 left-0 right-0 z-50 px-4 flex justify-center w-full max-w-md mx-auto"
                >
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={onCheckout}
                        className="w-full text-white rounded-xl shadow-[0_8px_30px_rgb(255,43,98,0.3)] p-4 flex items-center justify-between font-bold"
                        style={{ backgroundColor: 'var(--primary)' }}
                    >
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <ShoppingBag size={24} />
                                <span
                                    className="absolute -top-1 -right-2 bg-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2"
                                    style={{ color: 'var(--primary)', borderColor: 'var(--primary)' }}
                                >
                                    {cartCount}
                                </span>
                            </div>
                            <span>Ver Carrinho</span>
                        </div>
                        <span className="bg-white/20 px-3 py-1 rounded-lg text-sm">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cartTotal)}
                        </span>
                    </motion.button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
