import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Settings, Save, Store, Palette, Image as ImageIcon, Instagram, AlignLeft, Clock, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminSettings() {
    const [storeName, setStoreName] = useState('');
    const [primaryColor, setPrimaryColor] = useState('#6B21A8');
    const [logoUrl, setLogoUrl] = useState('');
    const [coverColor, setCoverColor] = useState('#6B21A8');
    const [instagramUrl, setInstagramUrl] = useState('');
    const [description, setDescription] = useState('');
    const [operatingHours, setOperatingHours] = useState('');
    const [cnpj, setCnpj] = useState('');

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const docRef = doc(db, 'settings', 'storeProfile');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setStoreName(data.storeName || '');
                    setPrimaryColor(data.primaryColor || '#6B21A8');
                    setCoverColor(data.coverColor || data.primaryColor || '#6B21A8');
                    setLogoUrl(data.logoUrl || '');
                    setInstagramUrl(data.instagramUrl || '');
                    setDescription(data.description || 'A melhor experiência em delivery, na velocidade do seu desejo!');
                    setOperatingHours(data.operatingHours || 'Segunda a Domingo\n14:00 às 23:30');
                    setCnpj(data.cnpj || '46.196.439/0001-32');
                }
            } catch (err) {
                console.error("Erro ao buscar configurações:", err);
                toast.error("Erro ao carregar configurações.");
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const docRef = doc(db, 'settings', 'storeProfile');
            await setDoc(docRef, {
                storeName,
                primaryColor,
                coverColor,
                logoUrl,
                instagramUrl,
                description,
                operatingHours,
                cnpj,
                updatedAt: new Date()
            }, { merge: true });

            toast.success("Configurações salvas com sucesso!");
        } catch (err) {
            console.error("Erro ao salvar configurações:", err);
            toast.error("Erro ao salvar as configurações.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-gray-500 font-medium">Carregando configurações...</div>;
    }

    return (
        <div className="flex flex-col gap-6 animate-fade-in max-w-3xl">
            <div>
                <h2 className="text-3xl font-black text-gray-900 flex items-center gap-2">
                    <Settings size={32} />
                    Configurações da Loja
                </h2>
                <p className="text-gray-500 font-medium mt-1">Personalize o nome, cor e logotipo do seu aplicativo.</p>
            </div>

            <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 flex flex-col gap-6">

                {/* Store Name Input */}
                <div>
                    <label className="flex items-center gap-2 font-bold text-gray-800 mb-2">
                        <Store size={18} className="text-gray-500" />
                        Nome da Loja
                    </label>
                    <input
                        type="text"
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        placeholder="Ex: Açai Rino Delivery"
                        className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all font-medium text-gray-800"
                        required
                    />
                    <p className="text-xs text-gray-400 mt-2">Este nome aparecerá no cabeçalho, rodapé e títulos do site.</p>
                </div>

                {/* Logo URL Input */}
                <div>
                    <label className="flex items-center gap-2 font-bold text-gray-800 mb-2">
                        <ImageIcon size={18} className="text-gray-500" />
                        URL da Logomarca (Imagem)
                    </label>
                    <div className="flex gap-4 items-start">
                        <div className="flex-1">
                            <input
                                type="url"
                                value={logoUrl}
                                onChange={(e) => setLogoUrl(e.target.value)}
                                placeholder="https://exemplo.com/logo.png"
                                className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all font-medium text-gray-800"
                                required
                            />
                            <p className="text-xs text-gray-400 mt-2">Cole o link (URL) direto para a imagem do seu logotipo (Recomendado: 500x500px transparente).</p>
                        </div>
                        {logoUrl && (
                            <div className="w-16 h-16 shrink-0 rounded-xl border-2 border-dashed border-gray-300 overflow-hidden flex items-center justify-center bg-gray-50">
                                <img src={logoUrl} alt="Preview" className="w-full h-full object-contain" onError={(e) => e.target.style.display = 'none'} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Primary Color Picker */}
                <div>
                    <label className="flex items-center gap-2 font-bold text-gray-800 mb-2">
                        <Palette size={18} className="text-gray-500" />
                        Cor Principal (Tema)
                    </label>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <input
                                type="color"
                                value={primaryColor}
                                onChange={(e) => setPrimaryColor(e.target.value)}
                                className="w-16 h-16 rounded-xl cursor-pointer border-0 p-0 appearance-none bg-transparent"
                            />
                        </div>
                        <div className="flex-1 flex flex-col">
                            <input
                                type="text"
                                value={primaryColor}
                                onChange={(e) => setPrimaryColor(e.target.value)}
                                pattern="^#+([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$"
                                className="p-3 border border-gray-200 rounded-lg outline-none focus:border-purple-600 font-mono text-gray-600 uppercase w-32"
                            />
                            <p className="text-xs text-gray-400 mt-1">Clique no quadrado colorido ou digite o código HEX.</p>
                        </div>
                    </div>

                    {/* Color Preview */}
                    <div className="mt-4 p-4 rounded-xl flex items-center justify-between" style={{ backgroundColor: primaryColor }}>
                        <span className="text-white font-bold tracking-tight">Preview do Botão</span>
                        <div className="bg-white/20 px-3 py-1 rounded text-white text-sm font-medium">Ver Sacola</div>
                    </div>
                </div>

                {/* Cover Color Picker */}
                <div>
                    <label className="flex items-center gap-2 font-bold text-gray-800 mb-2">
                        <Palette size={18} className="text-gray-500" />
                        Cor do Cabeçalho Superior (Capa do App)
                    </label>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <input
                                type="color"
                                value={coverColor}
                                onChange={(e) => setCoverColor(e.target.value)}
                                className="w-16 h-16 rounded-xl cursor-pointer border-0 p-0 appearance-none bg-transparent"
                            />
                        </div>
                        <div className="flex-1 flex flex-col">
                            <input
                                type="text"
                                value={coverColor}
                                onChange={(e) => setCoverColor(e.target.value)}
                                pattern="^#+([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$"
                                className="p-3 border border-gray-200 rounded-lg outline-none focus:border-purple-600 font-mono text-gray-600 uppercase w-32"
                            />
                            <p className="text-xs text-gray-400 mt-1">Clique no quadrado colorido ou digite o código HEX.</p>
                        </div>
                    </div>

                    {/* Cover Preview */}
                    <div className="mt-4 p-4 h-24 rounded-t-[2rem] flex items-end justify-center" style={{ backgroundColor: coverColor }}>
                        <div className="bg-white p-2 w-3/4 rounded-t-2xl shadow-sm text-center font-bold text-[10px] text-gray-400">Resto do App</div>
                    </div>
                </div>

                <hr className="border-gray-100 my-2" />

                {/* Instagram URL Input */}
                <div>
                    <label className="flex items-center gap-2 font-bold text-gray-800 mb-2">
                        <Instagram size={18} className="text-gray-500" />
                        Link do Instagram
                    </label>
                    <input
                        type="url"
                        value={instagramUrl}
                        onChange={(e) => setInstagramUrl(e.target.value)}
                        placeholder="https://instagram.com/sua_loja"
                        className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all font-medium text-gray-800"
                    />
                    <p className="text-xs text-gray-400 mt-2">Exibido no botão do Instagram no topo do aplicativo.</p>
                </div>

                {/* Description Input */}
                <div>
                    <label className="flex items-center gap-2 font-bold text-gray-800 mb-2">
                        <AlignLeft size={18} className="text-gray-500" />
                        Descrição do Rodapé
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="A melhor experiência em delivery..."
                        rows="3"
                        className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all font-medium text-gray-800 resize-none"
                    />
                </div>

                {/* Operating Hours Input */}
                <div>
                    <label className="flex items-center gap-2 font-bold text-gray-800 mb-2">
                        <Clock size={18} className="text-gray-500" />
                        Horário de Funcionamento
                    </label>
                    <textarea
                        value={operatingHours}
                        onChange={(e) => setOperatingHours(e.target.value)}
                        placeholder="Segunda a Domingo&#10;14:00 às 23:30"
                        rows="3"
                        className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all font-medium text-gray-800 resize-none"
                    />
                    <p className="text-xs text-gray-400 mt-2">Aparece na página de Informações / Rodapé do App.</p>
                </div>

                {/* CNPJ Input */}
                <div>
                    <label className="flex items-center gap-2 font-bold text-gray-800 mb-2">
                        <FileText size={18} className="text-gray-500" />
                        CNPJ
                    </label>
                    <input
                        type="text"
                        value={cnpj}
                        onChange={(e) => setCnpj(e.target.value)}
                        placeholder="00.000.000/0001-00"
                        className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all font-medium text-gray-800"
                    />
                </div>

                <hr className="border-gray-100 my-2" />

                {/* Save Button */}
                <button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl hover:bg-black disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
                >
                    <Save size={20} />
                    {saving ? "Salvando..." : "Salvar Configurações"}
                </button>
            </form>
        </div>
    );
}
