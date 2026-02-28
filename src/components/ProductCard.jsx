import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProductCard({ product, onClick }) {

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex p-4 gap-4 h-36">
            <div className="flex-1 flex flex-col justify-between">
                <div>
                    <h3 className="font-bold text-gray-800 text-sm mb-1">{product.name}</h3>
                    <p className="text-xs text-gray-500 line-clamp-2 leading-snug">{product.description}</p>
                </div>
                <div className="flex justify-between items-end mt-2">
                    <span className="font-bold text-gray-900">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                    </span>
                    <motion.button
                        whileTap={{ scale: 0.8 }}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center bg-white shadow-sm"
                        onClick={onClick}
                        aria-label="Adicionar"
                    >
                        <Plus size={18} style={{ color: 'var(--primary)' }} />
                    </motion.button>
                </div>
            </div>
            <img src={product.image} alt={product.name} className="w-24 h-24 object-cover rounded-xl shrink-0" />
        </div>
    );
}
