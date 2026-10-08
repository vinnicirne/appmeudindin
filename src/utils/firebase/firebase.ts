import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, getToken, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAaqCfyvVXRFyPjCZ8slK1rfcbKt5E2ixo",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "meu-dindin-46845.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "meu-dindin-46845",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "meu-dindin-46845.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "204395222070",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:204395222070:web:1096d8cdac6c9778a73497"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const requestForToken = async (): Promise<{ token: string | null; error?: string }> => {
  try {
    if (typeof window === 'undefined') return { token: null, error: 'Execução no servidor' };

    const supported = await isSupported();
    if (!supported) {
      console.warn('O navegador não suporta Firebase Messaging.');
      return { token: null, error: 'Navegador não suporta notificações Push' };
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { token: null, error: 'Permissão não concedida no navegador' };
    }

    const messaging = getMessaging(app);

    // Registra explicitamente o Service Worker do Firebase
    let registration: ServiceWorkerRegistration | undefined = undefined;
    if ('serviceWorker' in navigator) {
      try {
        registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        await navigator.serviceWorker.ready;
      } catch (swErr) {
        console.warn('Não foi possível registrar explicitamente o SW, tentando padrão:', swErr);
      }
    }

    const currentToken = await getToken(messaging, { 
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || 'BKZuJ5WD0SesPlNJUE7FJkLNZqbKpbtvzTQITljisBvtneQ84qS35F9dDoAyaNoo_-KWAHD_bLUxCW0tYMPIQi8',
      serviceWorkerRegistration: registration
    });
    
    if (currentToken) {
      return { token: currentToken };
    } else {
      return { token: null, error: 'Não foi possível gerar a chave de notificação FCM' };
    }
  } catch (error: any) {
    console.error('Erro ao obter token do FCM:', error);
    return { token: null, error: error?.message || 'Erro inesperado no Firebase' };
  }
};

export const onMessageListener = (callback: (payload: any) => void) => {
  if (typeof window !== 'undefined') {
    const messaging = getMessaging(app);
    import("firebase/messaging").then(({ onMessage }) => {
      onMessage(messaging, (payload) => {
        callback(payload);
      });
    });
  }
};

export { app };
