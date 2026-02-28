import { useEffect } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Store, LogOut, TrendingUp, Database, Settings } from 'lucide-react';
import { useWhiteLabel } from '../context/WhiteLabelContext';

export default function AdminLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const { settings } = useWhiteLabel();

    useEffect(() => {
        const isAuth = localStorage.getItem('@acaiRino:adminAuth');
        if (!isAuth) {
            navigate('/admin');
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('@acaiRino:adminAuth');
        navigate('/admin');
    };

    const navItems = [
        { path: '/admin/dashboard', icon: <TrendingUp size={20} />, label: 'Faturamento' },
        { path: '/admin/menu', icon: <Store size={20} />, label: 'Cardápio' },
        { path: '/admin/colheita', icon: <Database size={20} />, label: 'Colheita' },
        { path: '/admin/settings', icon: <Settings size={20} />, label: 'Configurações' }
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
            {/* Sidebar Desktop / Navbar Mobile */}
            <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-gray-200 flex flex-col">
                <div className="p-6 flex items-center justify-between md:justify-center border-b border-gray-100">
                    <h1 className="font-black text-2xl flex items-center gap-2" style={{ color: 'var(--primary)' }}>
                        <LayoutDashboard size={24} />
                        Admin
                    </h1>
                </div>

                <nav className="flex-1 p-4 flex flex-row md:flex-col gap-2 overflow-x-auto">
                    {navItems.map(item => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap ${location.pathname === item.path
                                ? 'font-bold shadow-sm'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium'
                                }`}
                            style={location.pathname === item.path ? { backgroundColor: 'color-mix(in srgb, var(--primary) 10%, white)', color: 'var(--primary)' } : {}}
                        >
                            {item.icon}
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-100 hidden md:block">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-red-500 hover:bg-red-50 w-full px-4 py-3 rounded-xl transition-colors font-medium"
                    >
                        <LogOut size={20} />
                        Sair do Painel
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center md:hidden shrink-0">
                    <span className="font-bold text-gray-800">{settings?.storeName || 'Painel'}</span>
                    <button onClick={handleLogout} className="text-red-500"><LogOut size={20} /></button>
                </header>
                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    <div className="max-w-6xl mx-auto">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
}
