import { initializeApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBpS6iyfjHtGFZ1QPvSvdxqTmhOpebF1Zs",
  authDomain: "sabadwani-app.firebaseapp.com",
  projectId: "sabadwani-app",
  storageBucket: "sabadwani-app.firebasestorage.app",
  messagingSenderId: "269129763640",
  appId: "1:269129763640:web:37c970f0ee87e7a932cfcd",
};

let db: any = null;
let auth: any = null;
let storage: any = null;

if (firebaseConfig.apiKey) {
  const app = initializeApp(firebaseConfig);
  
  
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()})
  });
  auth = getAuth(app);
  storage = getStorage(app);
}

export { db, auth, storage };
