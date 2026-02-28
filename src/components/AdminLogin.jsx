import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminLogin() {
    const [user, setUser] = useState('');
    const [pass, setPass] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        if (user === 'caixa' && pass === 'caixa') {
            localStorage.setItem('@acaiRino:adminAuth', 'true');
            navigate('/admin/dashboard');
        } else {
            setError('Usuário ou senha incorretos.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-sm border border-gray-100"
            >
                <div className="flex justify-center mb-6">
                    <div
                        className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center transition-colors"
                        style={{ color: 'var(--primary)' }}
                    >
                        <Lock size={32} />
                    </div>
                </div>

                <h1 className="text-2xl font-black text-center text-gray-900 mb-2">Acesso Restrito</h1>
                <p className="text-center text-gray-500 text-sm mb-8">Faça login para gerenciar o cardápio e ver os relatórios.</p>

                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Usuário"
                            value={user}
                            onChange={(e) => setUser(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl outline-none focus:bg-white focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition-all text-gray-800 font-medium"
                        />
                    </div>

                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="password"
                            placeholder="Senha"
                            value={pass}
                            onChange={(e) => setPass(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl outline-none focus:bg-white focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition-all text-gray-800 font-medium"
                        />
                    </div>

                    {error && (
                        <p className="text-red-500 text-xs font-bold text-center mt-1">{error}</p>
                    )}

                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        type="submit"
                        className="w-full text-white font-bold py-3.5 rounded-xl shadow-md transition-colors mt-2 hover:opacity-90"
                        style={{ backgroundColor: 'var(--primary)' }}
                    >
                        Entrar no Painel
                    </motion.button>
                </form>
            </motion.div>
        </div>
    );
}
