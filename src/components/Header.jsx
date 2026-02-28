import { ArrowLeft, Instagram, Info, MapPin, Star, Bike, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useWhiteLabel } from '../context/WhiteLabelContext';

export default function Header({ onViewChange, currentView }) {
    const { settings } = useWhiteLabel();
    const [userLocation, setUserLocation] = useState('Buscando localização...');
    const [distance, setDistance] = useState('1,6km');

    useEffect(() => {
        // Fetch approximate location based on IP (No permission required, fast)
        fetch('https://get.geojs.io/v1/ip/geo.json')
            .then(res => res.json())
            .then(data => {
                if (data.city && data.region) {
                    // Mapping some states to abbreviations if needed, or just use what comes back. Data.region usually comes as full name in some APIs, let's keep it simple.
                    setUserLocation(`${data.city} - ${data.region}`);
                    // Simulate a random distance between 0.5km and 8.5km to make it look realistic for the demo
                    setDistance(`${(Math.random() * 8 + 0.5).toFixed(1).replace('.', ',')}km`);
                } else {
                    setUserLocation('São José do Rio Preto - SP'); // Fallback
                }
            })
            .catch(() => {
                setUserLocation('São José do Rio Preto - SP'); // Fallback on error
            });
    }, []);
    return (
        <div className="bg-gray-50 flex flex-col mb-2 relative">
            {/* Capa / Background Superior */}
            <div className="h-32 w-full relative transition-colors" style={{ backgroundColor: 'var(--cover)' }}>
                {currentView === 'checkout' && (
                    <button
                        className="absolute top-4 left-4 z-50 flex items-center gap-2 bg-black/20 hover:bg-black/30 backdrop-blur px-3 py-1.5 rounded-full transition-colors"
                        onClick={() => onViewChange('menu')}
                    >
                        <ArrowLeft color="white" size={20} />
                        <span className="font-bold text-white text-sm">Voltar</span>
                    </button>
                )}
            </div>

            {/* Container Branco com as Informações da Loja */}
            <div className="bg-white rounded-t-[2rem] -mt-6 pt-12 pb-4 px-4 flex flex-col items-center shadow-sm relative z-10">

                {/* Logo Centralizada sobrepondo a borda */}
                <div className="absolute -top-14 left-1/2 -translate-x-1/2 rounded-full p-1 bg-white shadow-md">
                    <img
                        src={settings?.logoUrl || "/temp_logo.webp"}
                        alt={settings?.storeName || "Loja Delivery"}
                        className="w-24 h-24 rounded-full object-cover border-4"
                        style={{ borderColor: 'var(--primary)' }}
                    />
                </div>

                <h1 className="text-2xl font-black mt-2 tracking-tight" style={{ color: 'var(--primary)' }}>
                    {settings?.storeName || 'Loja Delivery'}
                </h1>

                {/* Botões Sociais e de Informação */}
                <div className="flex gap-3 mt-3 mb-4">
                    {settings?.instagramUrl && (
                        <a
                            href={settings.instagramUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="w-10 h-10 rounded-full border flex items-center justify-center hover:opacity-80 transition-opacity bg-white shadow-sm"
                            style={{ color: 'var(--primary)', borderColor: 'var(--primary)' }}
                        >
                            <Instagram size={20} />
                        </a>
                    )}
                    <button
                        onClick={() => document.getElementById('store-footer')?.scrollIntoView({ behavior: 'smooth' })}
                        className="w-10 h-10 rounded-full border flex items-center justify-center hover:opacity-80 transition-opacity bg-white shadow-sm"
                        style={{ color: 'var(--primary)', borderColor: 'var(--primary)' }}
                    >
                        <Info size={20} />
                    </button>
                </div>

                {/* Grid de Informações de Entrega */}
                <div className="w-full max-w-sm flex flex-col gap-2 text-sm text-gray-600 font-medium">
                    {/* Linha 1: Pedido Mínimo e Tempo */}
                    <div className="flex items-center justify-center gap-4">
                        <span className="flex items-center gap-1.5"><Wallet size={16} className="text-gray-400" /> Pedido Mín r$ 10,00</span>
                        <span className="text-gray-300">•</span>
                        <span className="flex items-center gap-1.5 text-blue-600 font-bold border border-blue-200 rounded-full px-2 py-0.5 bg-blue-50">
                            <Bike size={16} /> 30-50 min <span className="text-green-600">Grátis</span>
                        </span>
                    </div>

                    {/* Linha 2: Localização */}
                    <div className="flex items-center justify-center gap-1.5 line-clamp-1">
                        <MapPin size={16} className="text-gray-400 shrink-0" />
                        <span className="truncate">{userLocation} <span className="text-gray-400">•</span> <span className="text-blue-600 underline decoration-blue-300 underline-offset-2 shrink-0">{distance} de você</span></span>
                    </div>

                    {/* Linha 3: Avaliação */}
                    <div className="flex items-center justify-center mt-1">
                        <span className="flex items-center gap-1 font-bold text-gray-800 bg-gray-50 border px-3 py-1 rounded-full">
                            <Star size={16} className="text-yellow-400 fill-yellow-400" /> 4,9
                            <span className="text-gray-400 font-normal ml-1">(2.136 avaliações)</span>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
