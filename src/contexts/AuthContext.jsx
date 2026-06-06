import { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { ref, set, get, serverTimestamp } from 'firebase/database';
import { auth, db } from '../lib/firebase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen ke perubahan auth state
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        
        // Ambil username dari Firebase
        try {
          const userRef = ref(db, `users/${firebaseUser.uid}`);
          const snapshot = await get(userRef);
          if (snapshot.exists()) {
            const userData = snapshot.val();
            setUsername(userData.username);
            setIsLoggedIn(true);
          } else {
            // User ada di Auth tapi tidak ada di Database
            console.warn('User data not found in database');
            setIsLoggedIn(false);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setIsLoggedIn(false);
        }
        setLoading(false);
      } else {
        setUser(null);
        setUsername(null);
        setIsLoggedIn(false);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const register = async (email, password, newUsername) => {
    try {
      // Validasi input
      if (!newUsername || newUsername.trim().length < 3) {
        throw new Error('Username minimal 3 karakter');
      }
      if (newUsername.trim().length > 20) {
        throw new Error('Username maksimal 20 karakter');
      }
      if (!email || !password) {
        throw new Error('Email dan password harus diisi');
      }
      if (password.length < 6) {
        throw new Error('Password minimal 6 karakter');
      }

      // Buat akun Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Simpan data user ke Firebase Realtime Database
      const userRef = ref(db, `users/${firebaseUser.uid}`);
      await set(userRef, {
        username: newUsername.trim(),
        email: email,
        coins: 100,
        createdAt: serverTimestamp(),
        vehicles: ['car1'],
        equippedVehicle: 'car1'
      });

      setUser(firebaseUser);
      setUsername(newUsername.trim());
      setIsLoggedIn(true);

      return { success: true };
    } catch (error) {
      console.error('Register error:', error);
      
      // Translate error messages ke bahasa Indonesia
      let errorMessage = error.message;
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email sudah terdaftar';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Format email tidak valid';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password minimal 6 karakter';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Koneksi internet bermasalah';
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const login = async (email, password) => {
    try {
      if (!email || !password) {
        throw new Error('Email dan password harus diisi');
      }

      // Sign in ke Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Ambil username dari Firebase Database
      const userRef = ref(db, `users/${firebaseUser.uid}`);
      const snapshot = await get(userRef);
      
      if (snapshot.exists()) {
        const userData = snapshot.val();
        setUser(firebaseUser);
        setUsername(userData.username);
        setIsLoggedIn(true);
        return { success: true };
      } else {
        throw new Error('Data pengguna tidak ditemukan');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Translate error messages ke bahasa Indonesia
      let errorMessage = error.message;
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Email tidak terdaftar';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Password salah';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Format email tidak valid';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'Akun ini telah dinonaktifkan';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Koneksi internet bermasalah';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Terlalu banyak percobaan login. Coba lagi nanti';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Email atau password salah';
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUsername(null);
      setIsLoggedIn(false);
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    username,
    isLoggedIn,
    loading,
    register,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
