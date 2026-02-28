import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Store } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function IFoodDeliveryScreen() {
    const navigate = useNavigate();
    const [method, setMethod] = useState('delivery'); // 'pickup' | 'delivery'

    // Address State
    const [cep, setCep] = useState('');
    const [address, setAddress] = useState({
        logradouro: '',
        bairro: '',
        localidade: '',
        numero: '',
        complemento: ''
    });

    // Masks
    const handleCepChange = async (e) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length > 5) val = val.replace(/^(\d{5})(\d)/, '$1-$2');
        setCep(val);

        // Call ViaCEP when 8 digits are typed
        const unmaskedVal = val.replace('-', '');
        if (unmaskedVal.length === 8) {
            try {
                // Tentativa 1: BrasilAPI (Melhor para CORS e Rate Limits)
                const res = await fetch(`https://brasilapi.com.br/api/cep/v1/${unmaskedVal}`);
                if (!res.ok) throw new Error('BrasilAPI failed');
                const data = await res.json();

                setAddress(prev => ({
                    ...prev,
                    logradouro: data.street || '',
                    bairro: data.neighborhood || '',
                    localidade: data.city || ''
                }));
                toast.success("Endereço encontrado! Faltam apenas os detalhes.", { duration: 4000 });

            } catch (errBrasil) {
                // Tentativa 2: ViaCEP (Fallback)
                try {
                    const resVia = await fetch(`https://viacep.com.br/ws/${unmaskedVal}/json/`);
                    const dataVia = await resVia.json();
                    if (!dataVia.erro) {
                        setAddress(prev => ({
                            ...prev,
                            logradouro: dataVia.logradouro || '',
                            bairro: dataVia.bairro || '',
                            localidade: dataVia.localidade || ''
                        }));
                        toast.success("Endereço encontrado! Faltam apenas os detalhes.", { duration: 4000 });
                    } else {
                        toast.error("CEP não encontrado", { duration: 2000 });
                    }
                } catch (errVia) {
                    console.error('CEP fetching errors:', errBrasil, errVia);
                    toast.error("Erro ao buscar CEP. Verifique a conexão.", { duration: 2000 });
                }
            }
        }
    };

    const isFormValid = method === 'pickup' ||
        (cep.length === 9 && address.numero.length > 0 && address.logradouro.length > 0);

    const handleContinue = () => {
        // Save address info to context or state (for now just passing via navigation state)
        navigate('/payment', { state: { method, address: method === 'delivery' ? { ...address, cep } : null } });
    };

    return (
        <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="flex flex-col min-h-screen bg-gray-50 pb-24 font-sans"
        >
            <header className="sticky top-0 z-50 bg-white shadow-sm flex items-center justify-between p-4 mb-2">
                <button onClick={() => navigate(-1)} className="p-1 rounded-full active:bg-gray-100 transition-colors" style={{ color: 'var(--primary)' }}>
                    <ArrowLeft size={24} />
                </button>
                <h1 className="font-bold text-gray-800 text-lg flex-1 text-center">Como deseja receber?</h1>
                <div style={{ width: 32 }}></div>
            </header>

            <div className="p-4 bg-white flex flex-col gap-4 flex-1">
                {/* Metodos */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <button
                        onClick={() => setMethod('delivery')}
                        className={`border rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all ${method === 'delivery' ? 'bg-gray-50 shadow-sm' : 'border-gray-200 text-gray-500'}`}
                        style={method === 'delivery' ? { borderColor: 'var(--primary)', color: 'var(--primary)' } : {}}
                    >
                        <MapPin size={32} />
                        <span className="font-medium text-sm">Entregar em casa</span>
                    </button>

                    <button
                        onClick={() => setMethod('pickup')}
                        className={`border rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all ${method === 'pickup' ? 'bg-gray-50 shadow-sm' : 'border-gray-200 text-gray-500'}`}
                        style={method === 'pickup' ? { borderColor: 'var(--primary)', color: 'var(--primary)' } : {}}
                    >
                        <Store size={32} />
                        <span className="font-medium text-sm">Retirar no balcão</span>
                    </button>
                </div>

                {/* Formulario de Endereco (ViaCEP) */}
                {method === 'delivery' && (
                    <div className="flex flex-col gap-3 animate-fade-in">
                        <h3 className="font-bold text-gray-800 mb-2">Endereço de entrega</h3>

                        <input
                            type="text"
                            placeholder="CEP (00000-000)"
                            maxLength={9}
                            value={cep}
                            onChange={handleCepChange}
                            className="p-4 border rounded-lg w-full bg-gray-50 outline-none focus:border-purple-600 focus:bg-white transition-colors"
                        />

                        <div className="flex gap-2 w-full">
                            <input
                                type="text"
                                placeholder="Rua / Logradouro"
                                value={address.logradouro}
                                onChange={(e) => setAddress({ ...address, logradouro: e.target.value })}
                                className="p-4 border rounded-lg flex-1 bg-gray-50 text-gray-800 outline-none focus:border-purple-600 focus:bg-white transition-colors"
                            />
                            <input
                                type="text"
                                placeholder="Nº"
                                value={address.numero}
                                onChange={(e) => setAddress({ ...address, numero: e.target.value.replace(/\D/g, '') })}
                                className="p-4 border rounded-lg w-24 bg-gray-50 outline-none focus:border-purple-600 focus:bg-white transition-colors"
                            />
                        </div>

                        <input
                            type="text"
                            placeholder="Complemento (Apto, Bloco, etc)"
                            value={address.complemento}
                            onChange={(e) => setAddress({ ...address, complemento: e.target.value })}
                            className="p-4 border rounded-lg w-full bg-gray-50 outline-none focus:border-purple-600 focus:bg-white transition-colors"
                        />

                        <div className="flex gap-2 w-full">
                            <input
                                type="text"
                                placeholder="Bairro"
                                value={address.bairro}
                                onChange={(e) => setAddress({ ...address, bairro: e.target.value })}
                                className="p-4 border rounded-lg flex-1 bg-gray-50 text-gray-800 outline-none focus:border-purple-600 focus:bg-white transition-colors"
                            />
                            <input
                                type="text"
                                placeholder="Cidade"
                                value={address.localidade}
                                onChange={(e) => setAddress({ ...address, localidade: e.target.value })}
                                className="p-4 border rounded-lg flex-1 bg-gray-50 text-gray-800 outline-none focus:border-purple-600 focus:bg-white transition-colors"
                            />
                        </div>
                    </div>
                )}

                {method === 'pickup' && (
                    <div className="p-4 bg-gray-100 rounded-lg text-center text-sm text-gray-600 my-4 animate-fade-in">
                        Você deverá se dirigir até nosso balcão para retirar seu pedido assim que ele estiver pronto.
                    </div>
                )}
            </div>

            {/* Rodapé Fixo */}
            <div className="fixed bottom-0 w-full max-w-md bg-white border-t p-4 z-50">
                <button
                    onClick={handleContinue}
                    disabled={!isFormValid}
                    className="w-full text-white font-bold py-3.5 rounded-md disabled:bg-gray-300 disabled:text-gray-500 transition-colors hover:opacity-90"
                    style={{ backgroundColor: !isFormValid ? '' : 'var(--primary)' }}
                >
                    Continuar
                </button>
            </div>
        </motion.div>
    );
}
