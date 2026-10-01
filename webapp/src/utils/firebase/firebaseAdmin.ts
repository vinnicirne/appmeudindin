import { getApps, initializeApp, cert, getApp } from 'firebase-admin/app';
import { getMessaging, Messaging } from 'firebase-admin/messaging';

let appInstance = null;

if (!getApps().length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'meu-dindin-46845';

  if (privateKey && clientEmail) {
    try {
      appInstance = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    } catch (error) {
      console.error('Firebase admin initialization error:', error);
    }
  }
} else {
  appInstance = getApp();
}

export const adminMessaging: Messaging | null = appInstance ? getMessaging(appInstance) : null;
