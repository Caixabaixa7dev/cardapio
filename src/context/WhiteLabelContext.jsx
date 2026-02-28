import { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const WhiteLabelContext = createContext({});

export function WhiteLabelProvider({ children }) {
    const [settings, setSettings] = useState({
        storeName: 'Carregando...',
        primaryColor: '#6B21A8',
        coverColor: '#6B21A8',
        logoUrl: '/temp_logo.webp', // fallback image
        instagramUrl: '',
        description: 'A melhor experiência em delivery, na velocidade do seu desejo!',
        operatingHours: 'Segunda a Domingo\n14:00 às 23:30',
        cnpj: '46.196.439/0001-32'
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const docRef = doc(db, 'settings', 'storeProfile');

        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const newSettings = {
                    storeName: data.storeName || 'Sua Loja',
                    primaryColor: data.primaryColor || '#6B21A8',
                    coverColor: data.coverColor || data.primaryColor || '#6B21A8',
                    logoUrl: data.logoUrl || '/temp_logo.webp',
                    instagramUrl: data.instagramUrl || '',
                    description: data.description || 'A melhor experiência em delivery, na velocidade do seu desejo!',
                    operatingHours: data.operatingHours || 'Segunda a Domingo\n14:00 às 23:30',
                    cnpj: data.cnpj || '46.196.439/0001-32'
                };
                setSettings(newSettings);

                // Aplica a cor no CSS Global
                document.documentElement.style.setProperty('--primary', newSettings.primaryColor);
                document.documentElement.style.setProperty('--cover', newSettings.coverColor);
            } else {
                // Configuração padrão se não existir no banco
                document.documentElement.style.setProperty('--primary', '#6B21A8');
                document.documentElement.style.setProperty('--cover', '#6B21A8');
                setSettings({
                    storeName: 'Nova Loja',
                    primaryColor: '#6B21A8',
                    coverColor: '#6B21A8',
                    logoUrl: '/temp_logo.webp',
                    instagramUrl: '',
                    description: 'A melhor experiência em delivery, na velocidade do seu desejo!',
                    operatingHours: 'Segunda a Domingo\n14:00 às 23:30',
                    cnpj: '46.196.439/0001-32'
                });
            }
            setLoading(false);
        }, (error) => {
            console.error("Erro ao escutar configurações:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <WhiteLabelContext.Provider value={{ settings, loading }}>
            {children}
        </WhiteLabelContext.Provider>
    );
}

export function useWhiteLabel() {
    return useContext(WhiteLabelContext);
}
