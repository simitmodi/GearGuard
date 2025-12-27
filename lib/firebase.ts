import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

// Initialize Firebase variables
let app: any;
let auth: any;
let db: any;
let analytics: any;

try {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };

  // Check if any required keys are missing (values will be undefined if env var is missing)
  const configValues = Object.entries(firebaseConfig);
  const missingKeys = configValues
    .filter(([key, value]) => !value && key !== 'measurementId') // measurementId is optional
    .map(([key]) => key);

  if (missingKeys.length > 0) {
    console.warn(
      `Firebase configuration missing for keys: ${missingKeys.join(", ")}. Check .env.local`
    );
  }

  // Initialize Firebase
  // Check if all required config values are present to avoid internal firebase error
  if (missingKeys.length === 0) {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);

    if (typeof window !== "undefined") {
      isSupported().then((supported) => {
        if (supported) {
          analytics = getAnalytics(app);
        }
      });
    }
  } else {
    console.warn("Skipping Firebase initialization due to missing config.");
    const createErrorProxy = (name: string) => new Proxy({}, {
      get: (_target, prop) => {
        // Allow 'then' to prevent confusing "Promise-like" checks from crashing if awaited
        if (prop === 'then') return undefined;
        throw new Error(`Firebase ${name} is not initialized because configuration is missing. Check .env.local.`);
      }
    });
    app = createErrorProxy("app");
    auth = createErrorProxy("auth");
    db = createErrorProxy("db");
    analytics = createErrorProxy("analytics");
  }

} catch (error) {
  console.error("Firebase initialization error:", error);
}

export { app, auth, db, analytics };
