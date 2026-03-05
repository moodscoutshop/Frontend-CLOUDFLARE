/**
 * Firebase Client SDK Configuration
 * Initializes Firebase app, auth, and Google provider for frontend use.
 */
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyBclKGqvMITXt8EjAZSrdJp_guwu4nOUZ0",
  authDomain: "moodscout-8a4fe.firebaseapp.com",
  projectId: "moodscout-8a4fe",
  storageBucket: "moodscout-8a4fe.firebasestorage.app",
  messagingSenderId: "505414919856",
  appId: "1:505414919856:web:ebecf85aebf9fe5ab2bd75",
  measurementId: "G-31X26SQ84D"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Initialize analytics only in browser environments
let analytics = null;
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch (_) {
    // Analytics may fail in some environments
  }
}

export { app, auth, googleProvider, analytics };
export default app;
