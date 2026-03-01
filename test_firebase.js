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

async function main() {
    try {
        const docRef = doc(db, 'settings', 'storeProfile');
        const docSnap = await getDoc(docRef);
        console.log("Firebase DB Data:");
        console.log(docSnap.data());
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

main();
