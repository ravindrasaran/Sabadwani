import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBpS6iyfjHtGFZ1QPvSvdxqTmhOpebF1Zs",
  authDomain: "sabadwani-app.firebaseapp.com",
  projectId: "sabadwani-app",
  storageBucket: "sabadwani-app.firebasestorage.app",
  messagingSenderId: "269129763640",
  appId: "1:269129763640:web:37c970f0ee87e7a932cfcd",
  measurementId: "G-NB2SXB8WGN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Database (यही सबसे ज़रूरी लाइन है)
export const db = getFirestore(app);