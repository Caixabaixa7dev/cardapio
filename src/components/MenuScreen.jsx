import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ProductCard from './ProductCard';
import ProductModal from './ProductModal';
import CouponSplash from './CouponSplash';
import StoreFooter from './StoreFooter';
import { useCart } from '../context/CartContext';
import { db } from '../services/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';

export default function MenuScreen() {
    const [categoriesDB, setCategoriesDB] = useState([]);
    const [activeCategory, setActiveCategory] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const { addToCart } = useCart();

    useEffect(() => {
        const q = query(collection(db, 'categories'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ fbId: doc.id, ...doc.data() }));
            // Ordenar se houver IDs numéricos originais
            data.sort((a, b) => parseInt(a.id || 0) - parseInt(b.id || 0));
            setCategoriesDB(data);

            // Set initial active category if not set
            if (data.length > 0) {
                setActiveCategory(prev => prev ? prev : data[0].fbId);
            }
        });

        return () => unsubscribe();
    }, []);

    const categories = categoriesDB.map(c => ({ id: c.fbId, label: c.title }));
    const activeCategoryData = categoriesDB.find(c => c.fbId === activeCategory);
    const filteredProducts = activeCategoryData ? activeCategoryData.products : [];

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const item = {
        hidden: { opacity: 0, scale: 0.95, y: 10 },
        show: { opacity: 1, scale: 1, y: 0 }
    };

    return (
        <div className="flex flex-col flex-1 bg-gray-50">
            <CouponSplash />

            <div className="flex gap-3 overflow-x-auto p-4 no-scrollbar border-b bg-white sticky top-0 z-40">
                {categories.map(cat => (
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        key={cat.id}
                        className={`whitespace-nowrap px-4 py-1.5 rounded-full font-medium text-sm transition-colors ${activeCategory === cat.id
                            ? 'text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 border border-gray-200'
                            }`}
                        style={activeCategory === cat.id ? { backgroundColor: 'var(--primary)' } : {}}
                        onClick={() => setActiveCategory(cat.id)}
                    >
                        {cat.label}
                    </motion.button>
                ))}
            </div>

            <motion.div
                key={activeCategory || 'empty'} // Force re-render animation when category changes
                variants={container}
                initial="hidden"
                animate="show"
                className="flex flex-col gap-3 p-4"
            >
                {categoriesDB.length === 0 ? (
                    <div className="text-center p-8 text-gray-400 font-medium">Cardápio sendo atualizado...</div>
                ) : (
                    filteredProducts?.map(product => (
                        <motion.div key={product.id} variants={item}>
                            <ProductCard
                                product={product}
                                onClick={() => setSelectedProduct(product)}
                            />
                        </motion.div>
                    ))
                )}
            </motion.div>

            {/* Overlay de Customização (iFood Add-on flow) */}
            <ProductModal
                product={selectedProduct}
                isOpen={!!selectedProduct}
                onClose={() => setSelectedProduct(null)}
                onAdd={(itemWithAddons) => {
                    addToCart(itemWithAddons);
                    setSelectedProduct(null);
                }}
            />

            <StoreFooter />
        </div>
    );
}
