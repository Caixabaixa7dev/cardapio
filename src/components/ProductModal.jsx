import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Minus, Check } from 'lucide-react';

export default function ProductModal({ product, isOpen, onClose, onAdd }) {
    if (!isOpen || !product) return null;

    // Estado guarda as seleções de cada grupo de customização
    // ex: { "base": { "b1": {item, qtd: 1} }, "free_addons": {...} }
    const [selections, setSelections] = useState({});
    const [observation, setObservation] = useState('');

    // Reset se trocar de produto
    useEffect(() => {
        if (isOpen) {
            setSelections({});
            setObservation('');
        }
    }, [isOpen, product]);

    const handleSelectOption = (groupId, option, delta, isCheckbox, groupMax) => {
        setSelections(prev => {
            const groupSelections = prev[groupId] || {};
            const currentQty = groupSelections[option.id]?.qty || 0;
            const newQty = Math.max(0, currentQty + delta);

            // Checkbox logic (toggle 0 ou 1)
            if (isCheckbox) {
                const isSelected = currentQty > 0;
                // Se maximo for 1 e eu clicar num não selecionado, desmarco os outros
                if (!isSelected && groupMax === 1) {
                    return { ...prev, [groupId]: { [option.id]: { option, qty: 1 } } };
                }

                // Se não é radio (max > 1), só deixo marcar até o max
                const totalInGroup = Object.values(groupSelections).reduce((acc, curr) => acc + curr.qty, 0);
                if (!isSelected && totalInGroup >= groupMax) {
                    return prev; // já atingiu max
                }

                const nextState = { ...groupSelections };
                if (isSelected) {
                    delete nextState[option.id];
                } else {
                    nextState[option.id] = { option, qty: 1 };
                }
                return { ...prev, [groupId]: nextState };
            }

            // Stepper logic (+ / -)
            const totalInGroupProps = Object.keys(groupSelections).filter(k => k !== option.id);
            const totalOthers = totalInGroupProps.reduce((acc, k) => acc + groupSelections[k].qty, 0);

            if (newQty + totalOthers > groupMax) return prev;

            const nextState = { ...groupSelections };
            if (newQty === 0) {
                delete nextState[option.id];
            } else {
                nextState[option.id] = { option, qty: newQty };
            }

            return { ...prev, [groupId]: nextState };
        });
    };

    // Validations & Calcs
    const calculateExtras = () => {
        let total = 0;
        Object.values(selections).forEach(group => {
            Object.values(group).forEach(sel => {
                total += sel.option.price * sel.qty;
            });
        });
        return total;
    };

    const isGroupValid = (group) => {
        const groupSelections = selections[group.id] || {};
        const totalSelected = Object.values(groupSelections).reduce((acc, val) => acc + val.qty, 0);
        return totalSelected >= group.min && totalSelected <= group.max;
    };

    const isFormValid = !product.customizations || product.customizations.every(isGroupValid);
    const finalPrice = product.price + calculateExtras();

    const handleConfirm = () => {
        if (!isFormValid) return;

        // Flat array of chosen options just to save in cart
        const chosenOptions = [];
        Object.keys(selections).forEach(groupId => {
            Object.values(selections[groupId]).forEach(sel => {
                for (let i = 0; i < sel.qty; i++) {
                    chosenOptions.push(sel.option);
                }
            });
        });

        // Monta ID unico no carrinho usando json string das opcoes sortadas
        const sortedIds = chosenOptions.map(o => o.id).sort().join(',');
        const cartItem = {
            ...product,
            id: `${product.id}_${sortedIds}_${Date.now()}`, // UUID mock unique for same addons diff obs
            cartId: `${product.id}_${Date.now()}`,
            basePrice: product.price,
            price: finalPrice,
            customOptions: chosenOptions,
            observation: observation.trim()
        };

        onAdd(cartItem);
        onClose();
    };


    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-0 z-[100] bg-white flex flex-col font-sans h-[100dvh]"
            >
                {/* Imagem Cover / Header */}
                <div className="relative h-64 bg-gray-200 shrink-0">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />

                    {/* Botão de Fechar fixo em cima da imagem */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 left-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md active:scale-90 transition-transform"
                        style={{ color: 'var(--primary)' }}
                    >
                        <ArrowLeft size={24} />
                    </button>
                </div>

                {/* Conteudo Rolável */}
                <div className="flex-1 overflow-y-auto pb-24 bg-gray-50">
                    {/* Info Básica */}
                    <div className="bg-white p-4 mb-2 shadow-sm">
                        <h1 className="text-xl font-bold text-gray-900 leading-tight">{product.name}</h1>
                        {product.description && (
                            <p className="text-sm text-gray-500 mt-2 leading-relaxed">{product.description}</p>
                        )}
                        <p className="font-black text-xl mt-3" style={{ color: 'var(--primary)' }}>
                            A partir de {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                        </p>
                    </div>

                    {/* Lista de Customizações */}
                    {product.customizations?.map((group) => {
                        const valid = isGroupValid(group);
                        const groupSelections = selections[group.id] || {};
                        const totalSelected = Object.values(groupSelections).reduce((acc, curr) => acc + curr.qty, 0);
                        const isMaxReached = totalSelected >= group.max;

                        return (
                            <div key={group.id} className="bg-white p-4 mb-2 shadow-sm">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-base">{group.title}</h3>
                                        <p className="text-xs text-gray-500 mt-1">{group.subtitle}</p>
                                    </div>
                                    {group.min > 0 && (
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-wide ${valid ? 'bg-gray-100 text-gray-600' : 'bg-gray-800 text-white'}`}>
                                            {valid ? 'Opcional' : 'Obrigatório'}
                                        </span>
                                    )}
                                </div>

                                <div className="flex flex-col gap-0 divide-y">
                                    {group.options.map(option => {
                                        const qty = groupSelections[option.id]?.qty || 0;
                                        // O iFood usa checkbox/radio (clicando na row inteira) pra grupos onde não se pode repetir o mesmo item varias vezes
                                        // ou stepper. Assumiremos Stepper apenas para itens Pagos e Checkbox para os free/bases.
                                        const isCheckbox = option.price === 0;

                                        return (
                                            <div
                                                key={option.id}
                                                className={`flex items-center justify-between py-4 ${isCheckbox ? 'cursor-pointer active:bg-gray-50' : ''}`}
                                                onClick={() => {
                                                    if (isCheckbox) handleSelectOption(group.id, option, 0, true, group.max);
                                                }}
                                            >
                                                <div className="flex-1 pr-4">
                                                    <p className="text-sm font-medium text-gray-700">{option.name}</p>
                                                    {option.price > 0 && (
                                                        <p className="text-sm font-medium" style={{ color: 'var(--primary)' }}>+ {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(option.price)}</p>
                                                    )}
                                                </div>

                                                {/* Controles (Checkbox vs Stepper) */}
                                                <div>
                                                    {isCheckbox ? (
                                                        <div
                                                            className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${qty > 0 ? 'text-white' : 'border-gray-300'}`}
                                                            style={qty > 0 ? { backgroundColor: 'var(--primary)', borderColor: 'var(--primary)' } : {}}
                                                        >
                                                            {qty > 0 && <Check size={16} strokeWidth={3} />}
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center bg-gray-50 border rounded-lg h-10 w-24">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleSelectOption(group.id, option, -1, false, group.max); }}
                                                                className={`flex-1 flex justify-center items-center text-gray-500 transition-colors hover:bg-gray-50 ${qty === 0 ? 'opacity-30' : ''}`}
                                                                style={qty > 0 ? { color: 'var(--primary)' } : {}}
                                                                disabled={qty === 0}
                                                            >
                                                                <Minus size={18} />
                                                            </button>
                                                            <span className="w-6 text-center text-sm font-medium">{qty}</span>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleSelectOption(group.id, option, 1, false, group.max); }}
                                                                className={`flex-1 flex justify-center items-center transition-colors hover:bg-gray-50 ${isMaxReached ? 'opacity-30' : ''}`}
                                                                style={{ color: 'var(--primary)' }}
                                                                disabled={isMaxReached}
                                                            >
                                                                <Plus size={18} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}

                    {/* Observações */}
                    <div className="bg-white p-4 mb-2 shadow-sm">
                        <h3 className="font-bold text-gray-800 text-base mb-3">Observações?</h3>
                        <textarea
                            value={observation}
                            onChange={(e) => setObservation(e.target.value)}
                            placeholder="Observações sobre o produto"
                            className="w-full border rounded-lg p-3 text-sm text-gray-700 outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition-shadow resize-none h-24 bg-gray-50 focus:bg-white"
                        />
                    </div>
                </div>

                {/* Rodapé Fixo */}
                <div className="fixed bottom-0 w-full bg-white border-t p-4 z-50">
                    <motion.button
                        whileTap={{ scale: isFormValid ? 0.96 : 1 }}
                        disabled={!isFormValid}
                        onClick={handleConfirm}
                        className="w-full text-white font-bold py-3.5 rounded-lg disabled:opacity-50 disabled:bg-gray-300 transition-colors flex justify-between items-center px-4 hover:opacity-90"
                        style={{ backgroundColor: !isFormValid ? '' : 'var(--primary)' }}
                    >
                        <span>Adicionar</span>
                        <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(finalPrice)}</span>
                    </motion.button>
                </div>

            </motion.div>
        </AnimatePresence>
    );
}
