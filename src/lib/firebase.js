// Import semua yang kita butuhin
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

// Config firebase kamu (ga perlu diubah)
const firebaseConfig = {
    apiKey: "AIzaSyCQN1E5KtNtw0uCex2bawe29W7SppBjX9o",
    authDomain: "typing-race-9390e.firebaseapp.com",
    databaseURL: "https://typing-race-9390e-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "typing-race-9390e",
    storageBucket: "typing-race-9390e.firebasestorage.app",
    messagingSenderId: "813382683888",
    appId: "1:813382683888:web:1916fe7a95d7142fff8635",
    measurementId: "G-7E91T2YXFF"
};

// Nyalain Firebase-nya
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getDatabase(app);
export const auth = getAuth(app);