import { useState, useEffect, useRef } from 'react';
import { db, storage } from '../services/firebase';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { acaiRinoMenu, baseCustomizations } from '../data/acaiRinoMenu';
import { Pencil, Trash2, Plus, Image as ImageIcon, Save, X, Store } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminMenu() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [migrating, setMigrating] = useState(false);

    const [editingCategory, setEditingCategory] = useState(null);
    const [editingProduct, setEditingProduct] = useState(null);

    // Form states
    const [catName, setCatName] = useState('');
    const [prodData, setProdData] = useState({ name: '', description: '', price: 0, image: '', customizations: [] });
    const [uploadingImage, setUploadingImage] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchMenu();
    }, []);

    const fetchMenu = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, 'categories'));
            const data = snap.docs.map(doc => ({ fbId: doc.id, ...doc.data() }));
            // Ordenar por ID original ou nome se necessário
            data.sort((a, b) => parseInt(a.id || 0) - parseInt(b.id || 0));
            setCategories(data);
        } catch (e) {
            toast.error("Erro ao carregar cardápio: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSeedDb = async () => {
        setMigrating(true);
        try {
            toast.info("Iniciando migração do cardápio local para o Firebase...");
            const batch = [];
            for (const cat of acaiRinoMenu) {
                // Add category explicitly
                const docRef = doc(collection(db, 'categories'));
                batch.push(setDoc(docRef, cat));
            }
            await Promise.all(batch);
            toast.success("Cardápio importado com sucesso!");
            fetchMenu();
        } catch (e) {
            toast.error("Erro na importação: " + e.message);
        } finally {
            setMigrating(false);
        }
    };

    const handleSaveCategory = async () => {
        if (!catName.trim()) return;
        try {
            if (editingCategory.fbId) {
                await updateDoc(doc(db, 'categories', editingCategory.fbId), { title: catName });
                toast.success('Categoria atualizada!');
            } else {
                await addDoc(collection(db, 'categories'), { id: Date.now().toString(), title: catName, products: [] });
                toast.success('Categoria criada!');
            }
            setEditingCategory(null);
            fetchMenu();
        } catch (e) {
            toast.error("Erro ao salvar: " + e.message);
        }
    };

    const handleDeleteCategory = async (fbId) => {
        if (window.confirm("Certeza que deseja excluir esta categoria inteira?")) {
            try {
                await deleteDoc(doc(db, 'categories', fbId));
                toast.success('Categoria excluída!');
                fetchMenu();
            } catch (e) {
                toast.error("Erro: " + e.message);
            }
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingImage(true);
        try {
            const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    toast.info(`Fazendo upload: ${Math.round(progress)}%`, { id: 'upload-toast' });
                },
                (error) => {
                    toast.error("Erro no upload: " + error.message, { id: 'upload-toast' });
                    setUploadingImage(false);
                },
                async () => {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    setProdData(prev => ({ ...prev, image: downloadURL }));
                    toast.success('Imagem enviada com sucesso!', { id: 'upload-toast' });
                    setUploadingImage(false);
                }
            );
        } catch (err) {
            toast.error("Erro ao processar imagem: " + err.message);
            setUploadingImage(false);
        }
    };

    const handleSaveProduct = async () => {
        if (!prodData.name.trim() || !editingProduct.catFbId) return;

        try {
            const catDoc = categories.find(c => c.fbId === editingProduct.catFbId);
            let updatedProducts = [...catDoc.products];

            if (editingProduct.isNew) {
                updatedProducts.push({
                    id: Date.now().toString(),
                    name: prodData.name,
                    description: prodData.description,
                    price: parseFloat(prodData.price),
                    image: prodData.image,
                    customizations: [] // Mantendo vazio por padrão no form básico
                });
            } else {
                const index = updatedProducts.findIndex(p => p.id === editingProduct.prodId);
                if (index !== -1) {
                    updatedProducts[index] = {
                        ...updatedProducts[index],
                        name: prodData.name,
                        description: prodData.description,
                        price: parseFloat(prodData.price),
                        image: prodData.image,
                        customizations: prodData.customizations || []
                    };
                }
            }

            await updateDoc(doc(db, 'categories', editingProduct.catFbId), { products: updatedProducts });
            toast.success('Produto salvo com sucesso!');
            setEditingProduct(null);
            fetchMenu();
        } catch (e) {
            toast.error("Erro ao salvar produto: " + e.message);
        }
    };

    const handleDeleteProduct = async (catFbId, prodId) => {
        if (window.confirm("Deseja excluir este produto?")) {
            try {
                const catDoc = categories.find(c => c.fbId === catFbId);
                const updatedProducts = catDoc.products.filter(p => p.id !== prodId);
                await updateDoc(doc(db, 'categories', catFbId), { products: updatedProducts });
                toast.success('Produto excluído!');
                fetchMenu();
            } catch (e) {
                toast.error("Erro: " + e.message);
            }
        }
    };

    if (loading) return <div className="p-8 text-gray-500 font-medium">Carregando cardápio...</div>;

    if (categories.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-96 bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
                <Store size={48} className="text-gray-300 mb-4" />
                <h2 className="text-2xl font-black text-gray-900 mb-2">Cardápio Vazio</h2>
                <p className="text-gray-500 max-w-sm mb-6">Parece que você ainda não migrou o cardápio local para o banco de dados.</p>
                <button
                    onClick={handleSeedDb}
                    disabled={migrating}
                    className="text-white font-bold px-6 py-3 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 hover:opacity-90"
                    style={{ backgroundColor: 'var(--primary)' }}
                >
                    {migrating ? 'Migrando dados...' : 'Importar Cardápio Padrão'}
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 animate-fade-in pb-20">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h2 className="text-2xl font-black text-gray-900">Gerenciador de Cardápio</h2>
                    <p className="text-gray-500 font-medium">Categorias e Produtos refletem em tempo real.</p>
                </div>
                <button
                    onClick={() => { setEditingCategory({ isNew: true }); setCatName(''); }}
                    className="bg-gray-100 font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-200 transition-colors"
                    style={{ color: 'var(--primary)' }}
                >
                    <Plus size={18} /> Nova Categoria
                </button>
            </div>

            {categories.map((cat) => (
                <div key={cat.fbId} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Category Header */}
                    <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-black text-lg text-gray-800">{cat.title}</h3>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => { setEditingCategory({ fbId: cat.fbId, title: cat.title }); setCatName(cat.title); }}
                                className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                                style={{ hover: { color: 'var(--primary)' } }}
                            >
                                <Pencil size={18} />
                            </button>
                            <button
                                onClick={() => handleDeleteCategory(cat.fbId)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Products List */}
                    <div className="p-4 flex flex-col gap-3">
                        {cat.products?.map(prod => (
                            <div key={prod.id} className="flex items-center gap-4 p-3 border rounded-xl hover:bg-gray-50 transition-colors">
                                <img src={prod.image} alt={prod.name} className="w-16 h-16 object-cover rounded-lg border bg-gray-100" />
                                <div className="flex-1">
                                    <h4 className="font-bold text-gray-900 text-sm">{prod.name}</h4>
                                    <p className="text-xs text-gray-500 line-clamp-1">{prod.description}</p>
                                    <p className="text-sm font-black text-green-600 mt-1">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(prod.price)}
                                    </p>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={() => {
                                            setEditingProduct({ catFbId: cat.fbId, prodId: prod.id, isNew: false });
                                            setProdData({
                                                name: prod.name,
                                                description: prod.description,
                                                price: prod.price,
                                                image: prod.image || '',
                                                customizations: prod.customizations || []
                                            });
                                        }}
                                        className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <Pencil size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteProduct(cat.fbId, prod.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        <button
                            onClick={() => { setEditingProduct({ catFbId: cat.fbId, isNew: true }); setProdData({ name: '', description: '', price: 0, image: '', customizations: [] }); }}
                            className="mt-2 text-sm text-gray-500 font-bold border-2 border-dashed rounded-xl p-3 flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
                        >
                            <Plus size={16} /> Adicionar Produto em {cat.title}
                        </button>
                    </div>
                </div>
            ))}

            {/* Modal de Categoria */}
            {editingCategory && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl animate-fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-xl">{editingCategory.isNew ? 'Nova Categoria' : 'Editar Categoria'}</h3>
                            <button onClick={() => setEditingCategory(null)} className="text-gray-400"><X size={24} /></button>
                        </div>
                        <input
                            type="text"
                            placeholder="Nome da categoria (Ex: Promoções)"
                            value={catName}
                            onChange={e => setCatName(e.target.value)}
                            className="w-full border rounded-xl p-3 outline-none focus:border-purple-600 focus:bg-gray-50 mb-6"
                        />
                        <button
                            onClick={handleSaveCategory}
                            disabled={!catName.trim()}
                            className="w-full text-white font-bold py-3 rounded-xl disabled:bg-gray-300 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                            style={{ backgroundColor: !catName.trim() ? '' : 'var(--primary)' }}
                        >
                            <Save size={18} /> Salvar
                        </button>
                    </div>
                </div>
            )}

            {/* Modal de Produto */}
            {editingProduct && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl animate-fade-in max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-xl">{editingProduct.isNew ? 'Novo Produto' : 'Editar Produto'}</h3>
                            <button onClick={() => setEditingProduct(null)} className="text-gray-400"><X size={24} /></button>
                        </div>

                        <div className="flex flex-col gap-4">
                            {/* Image Upload Area */}
                            <div className="flex flex-col items-center gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100 mb-2">
                                {prodData.image ? (
                                    <div className="relative group">
                                        <img src={prodData.image} alt="Preview" className="w-32 h-32 object-cover rounded-xl border bg-white shadow-sm" />
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="absolute inset-0 bg-black/60 text-white font-bold rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            Novo Upload
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col justify-center items-center text-gray-400 hover:text-purple-600 hover:border-purple-300 hover:bg-purple-100 transition-colors bg-white shadow-sm"
                                    >
                                        <ImageIcon size={32} className="mb-2" />
                                        <span className="text-xs font-bold px-2 text-center text-gray-500">Enviar Foto</span>
                                    </button>
                                )}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageUpload}
                                    accept="image/*"
                                    className="hidden"
                                />

                                <div className="w-full mt-2">
                                    <p className="text-[10px] text-gray-400 font-bold mb-1 text-center">OU COLE O LINK DA IMAGEM:</p>
                                    <input
                                        type="text"
                                        placeholder="https://sua-imagem.com/foto.jpg"
                                        value={prodData.image}
                                        onChange={e => setProdData({ ...prodData, image: e.target.value })}
                                        className="w-full border rounded-lg p-3 text-sm outline-none focus:border-purple-600 focus:bg-white bg-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 mb-1 block">Nome do Produto</label>
                                <input
                                    type="text" value={prodData.name} onChange={e => setProdData({ ...prodData, name: e.target.value })}
                                    className="w-full border rounded-lg p-3 outline-none focus:border-purple-600 focus:bg-gray-50"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 mb-1 block">Preço (R$)</label>
                                <input
                                    type="number" step="0.01" value={prodData.price} onChange={e => setProdData({ ...prodData, price: e.target.value })}
                                    className="w-full border rounded-lg p-3 outline-none focus:border-purple-600 focus:bg-gray-50"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 mb-1 block">Descrição</label>
                                <textarea
                                    value={prodData.description} onChange={e => setProdData({ ...prodData, description: e.target.value })}
                                    rows="3"
                                    className="w-full border rounded-lg p-3 outline-none focus:border-purple-600 focus:bg-gray-50 resize-none"
                                />
                            </div>

                            {/* Adicionais & Customizações */}
                            <div className="border-t border-gray-100 pt-4 mt-2">
                                <label className="text-xs font-bold text-gray-800 mb-3 block">Adicionais e Customizações</label>

                                <div className="flex flex-wrap gap-2 mb-4">
                                    <button
                                        onClick={() => {
                                            const template = baseCustomizations.find(c => c.id === 'base');
                                            if (template) setProdData(p => ({ ...p, customizations: [...(p.customizations || []), JSON.parse(JSON.stringify(template))] }));
                                        }}
                                        className="text-[10px] bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg font-bold border border-blue-100 hover:bg-blue-100 transition-colors"
                                    >
                                        + Base (Açai/Sorvete)
                                    </button>
                                    <button
                                        onClick={() => {
                                            const template = baseCustomizations.find(c => c.id === 'free_addons');
                                            if (template) setProdData(p => ({ ...p, customizations: [...(p.customizations || []), JSON.parse(JSON.stringify({ ...template, max: 4 }))] }));
                                        }}
                                        className="text-[10px] bg-green-50 text-green-700 px-3 py-1.5 rounded-lg font-bold border border-green-100 hover:bg-green-100 transition-colors"
                                    >
                                        + Adicionais Padrão (Grátis)
                                    </button>
                                    <button
                                        onClick={() => {
                                            const template = baseCustomizations.find(c => c.id === 'paid_addons');
                                            if (template) setProdData(p => ({ ...p, customizations: [...(p.customizations || []), JSON.parse(JSON.stringify(template))] }));
                                        }}
                                        className="text-[10px] bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg font-bold border border-purple-100 hover:bg-purple-100 transition-colors"
                                    >
                                        + Turbinadas (Pagos)
                                    </button>
                                </div>

                                {prodData.customizations?.length > 0 && (
                                    <div className="flex flex-col gap-3">
                                        {prodData.customizations.map((cust, cIdx) => (
                                            <div key={cIdx} className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                                                <div className="flex justify-between items-center mb-2">
                                                    <input
                                                        type="text"
                                                        value={cust.title}
                                                        onChange={e => {
                                                            const newCust = [...prodData.customizations];
                                                            newCust[cIdx].title = e.target.value;
                                                            setProdData(p => ({ ...p, customizations: newCust }));
                                                        }}
                                                        className="font-bold text-sm text-gray-800 bg-transparent border-b border-gray-300 outline-none w-2/3 pb-1"
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            const newCust = [...prodData.customizations];
                                                            newCust.splice(cIdx, 1);
                                                            setProdData(p => ({ ...p, customizations: newCust }));
                                                        }}
                                                        className="text-red-500 p-1 hover:bg-red-50 rounded"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>

                                                <div className="flex gap-2 mb-3">
                                                    <div className="text-[10px] text-gray-500">Mín:
                                                        <input type="number" value={cust.min} onChange={e => {
                                                            const newCust = [...prodData.customizations];
                                                            newCust[cIdx].min = parseInt(e.target.value) || 0;
                                                            setProdData(p => ({ ...p, customizations: newCust }));
                                                        }} className="w-10 border rounded ml-1 px-1 py-0.5" />
                                                    </div>
                                                    <div className="text-[10px] text-gray-500">Máx:
                                                        <input type="number" value={cust.max} onChange={e => {
                                                            const newCust = [...prodData.customizations];
                                                            newCust[cIdx].max = parseInt(e.target.value) || 0;
                                                            setProdData(p => ({ ...p, customizations: newCust }));
                                                        }} className="w-10 border rounded ml-1 px-1 py-0.5" />
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1 no-scrollbar">
                                                    {cust.options?.map((opt, oIdx) => (
                                                        <div key={oIdx} className="flex items-center gap-2 bg-white border rounded-lg p-1.5">
                                                            <input
                                                                type="text"
                                                                value={opt.name}
                                                                onChange={e => {
                                                                    const newCust = [...prodData.customizations];
                                                                    newCust[cIdx].options[oIdx].name = e.target.value;
                                                                    setProdData(p => ({ ...p, customizations: newCust }));
                                                                }}
                                                                placeholder="Nome do Item"
                                                                className="flex-1 text-xs border-none outline-none font-medium text-gray-700"
                                                            />
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                value={opt.price}
                                                                onChange={e => {
                                                                    const newCust = [...prodData.customizations];
                                                                    newCust[cIdx].options[oIdx].price = parseFloat(e.target.value) || 0;
                                                                    setProdData(p => ({ ...p, customizations: newCust }));
                                                                }}
                                                                placeholder="R$ 0,00"
                                                                className="w-16 text-[11px] font-bold text-green-600 border-none outline-none text-right bg-gray-50 rounded px-1"
                                                            />
                                                            <button
                                                                onClick={() => {
                                                                    const newCust = [...prodData.customizations];
                                                                    newCust[cIdx].options.splice(oIdx, 1);
                                                                    setProdData(p => ({ ...p, customizations: newCust }));
                                                                }}
                                                                className="text-gray-400 hover:text-red-500 transition-colors ml-1"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        const newCust = [...prodData.customizations];
                                                        if (!newCust[cIdx].options) newCust[cIdx].options = [];
                                                        newCust[cIdx].options.push({ id: `new_${Date.now()}`, name: 'Novo Item', price: 0 });
                                                        setProdData(p => ({ ...p, customizations: newCust }));
                                                    }}
                                                    className="w-full mt-2 text-[10px] font-bold py-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                                    style={{ color: 'var(--primary)' }}
                                                >
                                                    + Criar Item Vazio
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={handleSaveProduct}
                            disabled={!prodData.name.trim() || uploadingImage}
                            className="w-full mt-6 text-white font-bold py-3.5 rounded-xl disabled:bg-gray-300 flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                            style={{ backgroundColor: (!prodData.name.trim() || uploadingImage) ? '' : 'var(--primary)' }}
                        >
                            <Save size={20} /> Salvar Produto
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
