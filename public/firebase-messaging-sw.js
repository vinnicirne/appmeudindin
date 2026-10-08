importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: new URL(location).searchParams.get('apiKey'),
  projectId: new URL(location).searchParams.get('projectId'),
  messagingSenderId: new URL(location).searchParams.get('messagingSenderId'),
  appId: new URL(location).searchParams.get('appId'),
};

// Fallback just in case URL params fail
if (!firebaseConfig.apiKey) {
  firebaseConfig.apiKey = "AIzaSyAaqCfyvVXRFyPjCZ8slK1rfcbKt5E2ixo";
  firebaseConfig.projectId = "meu-dindin-46845";
  firebaseConfig.messagingSenderId = "204395222070";
  firebaseConfig.appId = "1:204395222070:web:1096d8cdac6c9778a73497";
}

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Mensagem recebida em background ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon.jpg', // Caminho pro ícone do app
    badge: '/icon.jpg'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});