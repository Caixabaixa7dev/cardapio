import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDxByd1WfVyGSVlwQbnvd05lTJ2AxixJ5w",
    authDomain: "cardapio-f5b6e.firebaseapp.com",
    projectId: "cardapio-f5b6e",
    storageBucket: "cardapio-f5b6e.firebasestorage.app",
    messagingSenderId: "889279350354",
    appId: "1:889279350354:web:e2b8eb0f38b3a55e15818b"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default async function handler(req, res) {
    const host = req.headers.host || 'delivery.vercel.app';
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const siteUrl = `${protocol}://${host}`;

    let storeName = 'Nosso Delivery';
    let logoUrl = `${siteUrl}/temp_logo.webp`;
    let description = 'A melhor experiência em delivery, na velocidade do seu desejo!';

    try {
        const docRef = doc(db, 'settings', 'storeProfile');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.storeName) storeName = data.storeName;
            if (data.logoUrl) {
                if (data.logoUrl.startsWith('/')) {
                    logoUrl = `${siteUrl}${data.logoUrl}`;
                } else {
                    logoUrl = data.logoUrl;
                }
            }
            if (data.description) description = data.description;
        }
    } catch (error) {
        console.error("Error fetching store profile for OG Tags:", error);
    }

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>${storeName}</title>
    <meta name="description" content="${description}">
    
    <!-- Open Graph for Facebook, WhatsApp, Telegram -->
    <meta property="og:title" content="${storeName}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${logoUrl}">
    <meta property="og:url" content="${siteUrl}">
    <meta property="og:type" content="website">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    
    <!-- Twitter Meta Tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${storeName}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${logoUrl}">
</head>
<body>
    <script>
        // Redirect real browsers if they somehow hit this endpoint
        window.location.replace("/");
    </script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    // Cache at the Edge for 5 minutes, stale while revalidating
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=86400');
    res.status(200).send(html);
}
