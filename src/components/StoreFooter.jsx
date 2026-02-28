import { MapPin, Clock, CreditCard, Smartphone, ShieldCheck } from 'lucide-react';
import { useWhiteLabel } from '../context/WhiteLabelContext';

export default function StoreFooter() {
    const { settings } = useWhiteLabel();

    return (
        <footer id="store-footer" className="bg-white pt-8 pb-32 px-4 shadow-inner mt-4">
            <div className="flex flex-col items-center justify-center gap-2 mb-6 text-center">
                <img src={settings?.logoUrl || "/temp_logo.webp"} alt={settings?.storeName} className="w-16 h-16 rounded-full border-2" style={{ borderColor: 'var(--primary)' }} />
                <h3 className="font-black text-gray-800 text-lg tracking-tight">{settings?.storeName || 'Loja Delivery'}</h3>
                <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
                    {settings?.description || 'A melhor experiência em delivery, na velocidade do seu desejo!'}
                </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 mb-6 border divide-y divide-gray-200">
                <div className="flex items-start gap-3 pb-3">
                    <Clock size={20} className="shrink-0 mt-0.5" style={{ color: 'var(--primary)' }} />
                    <div>
                        <p className="font-bold text-gray-700 text-sm">Horário de Funcionamento</p>
                        <p className="text-gray-500 text-xs mt-0.5 whitespace-pre-wrap">{settings?.operatingHours || 'Segunda a Domingo\n14:00 às 23:30'}</p>
                    </div>
                </div>

                <div className="flex items-start gap-3 pt-3">
                    <CreditCard size={20} className="shrink-0 mt-0.5" style={{ color: 'var(--primary)' }} />
                    <div className="w-full">
                        <p className="font-bold text-gray-700 text-sm">Formas de Pagamento</p>
                        <div className="flex gap-2 mt-2 flex-wrap">
                            <span className="bg-white border rounded text-[10px] font-bold px-2 py-1 text-gray-600 flex items-center gap-1"><Smartphone size={12} /> Pix</span>
                            <span className="bg-white border rounded text-[10px] font-bold px-2 py-1 text-gray-600 flex items-center gap-1"><CreditCard size={12} /> Crédito</span>
                            <span className="bg-white border rounded text-[10px] font-bold px-2 py-1 text-gray-600 flex items-center gap-1"><CreditCard size={12} /> Débito</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="text-center flex flex-col items-center gap-2">
                <ShieldCheck size={28} className="text-gray-300" />
                <p className="text-[11px] text-gray-400 font-medium">
                    Plataforma segura e selo de qualidade {settings?.storeName || 'Loja Delivery'}.<br />
                    CNPJ: {settings?.cnpj || '46.196.439/0001-32'}
                </p>
            </div>

            <div className="text-center mt-8 border-t pt-4">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                    © {new Date().getFullYear()} {settings?.storeName || 'Loja Delivery'}
                </p>
            </div>
        </footer>
    );
}
