import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { Banknote, ShoppingBag, TrendingUp, Calendar } from 'lucide-react';

export default function AdminDashboard() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('hoje'); // hoje, 7d, 15d, todos

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
                const snap = await getDocs(q);
                const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setOrders(data);
            } catch (err) {
                console.error("Erro ao buscar pedidos:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, []);

    // Função para filtrar pedidos por período
    const getFilteredOrders = () => {
        const now = new Date();
        return orders.filter(order => {
            if (!order.createdAt) return false;
            // createdAt.toDate() se for Timestamp do Firebase, ou converte string
            const orderDate = order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt);

            const diffTime = Math.abs(now - orderDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (period === 'hoje') return diffDays <= 1; // Pega ultimas 24h basicamente
            if (period === '7d') return diffDays <= 7;
            if (period === '15d') return diffDays <= 15;
            return true; // "todos"
        });
    };

    const filtered = getFilteredOrders();
    const totalRevenue = filtered.reduce((acc, curr) => acc + (curr.total || 0), 0);
    const orderCount = filtered.length;
    const ticketMedio = orderCount > 0 ? totalRevenue / orderCount : 0;

    if (loading) {
        return <div className="p-8 text-gray-500 font-medium">Carregando painel financeiro...</div>;
    }

    return (
        <div className="flex flex-col gap-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-gray-900">Visão Geral</h2>
                    <p className="text-gray-500 font-medium mt-1">Acompanhe as vendas e o faturamento do seu delivery.</p>
                </div>

                <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border">
                    {['hoje', '7d', '15d', 'todos'].map(p => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-colors ${period === p ? 'text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                            style={period === p ? { backgroundColor: 'var(--primary)' } : {}}
                        >
                            {p === 'todos' ? 'Todo Período' : p}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                            <Banknote size={24} />
                        </div>
                        <h3 className="text-gray-600 font-bold text-lg">Faturamento</h3>
                    </div>
                    <span className="text-4xl font-black text-gray-900">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRevenue)}
                    </span>
                    <p className="text-sm text-green-600 font-medium mt-2 flex items-center gap-1">
                        <TrendingUp size={16} /> Receita no período selecionado
                    </p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                            <ShoppingBag size={24} />
                        </div>
                        <h3 className="text-gray-600 font-bold text-lg">Pedidos Concluídos</h3>
                    </div>
                    <span className="text-4xl font-black text-gray-900">{orderCount}</span>
                    <p className="text-sm text-gray-500 font-medium mt-2 flex items-center gap-1">
                        <Calendar size={16} /> Apenas finalizados pagos
                    </p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                            <TrendingUp size={24} />
                        </div>
                        <h3 className="text-gray-600 font-bold text-lg">Ticket Médio</h3>
                    </div>
                    <span className="text-4xl font-black text-gray-900">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ticketMedio)}
                    </span>
                    <p className="text-sm text-gray-500 font-medium mt-2 flex items-center gap-1">
                        <Banknote size={16} /> Valor médio por pedido
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-4">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800 text-lg">Extrato de Vendas Recentes ({period})</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 text-sm">
                                <th className="p-4 font-bold">Data</th>
                                <th className="p-4 font-bold">Itens</th>
                                <th className="p-4 font-bold">Pagamento</th>
                                <th className="p-4 font-bold text-right">Valor</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.length === 0 ? (
                                <tr><td colSpan="4" className="p-8 text-center text-gray-500">Nenhuma venda encontrada neste período.</td></tr>
                            ) : (
                                filtered.map(o => (
                                    <tr key={o.id} className="hover:bg-gray-50 transition-colors text-sm">
                                        <td className="p-4 text-gray-700 whitespace-nowrap">
                                            {o.createdAt && o.createdAt.toDate ? o.createdAt.toDate().toLocaleString('pt-BR') : 'Data não registrada'}
                                        </td>
                                        <td className="p-4 text-gray-600 max-w-xs truncate">
                                            {o.items?.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${o.payment?.method === 'pix' ? 'bg-teal-100 text-teal-700' : 'bg-orange-100 text-orange-700'}`}>
                                                {o.payment?.method || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right font-bold text-gray-900">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(o.total || 0)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
