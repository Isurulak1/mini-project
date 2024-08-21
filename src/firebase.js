// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBXBZ7iPEV4hHCP2xib44ul70XTLvk-AUk",
  authDomain: "mini-project-65fbd.firebaseapp.com",
  projectId: "mini-project-65fbd",
  storageBucket: "mini-project-65fbd.appspot.com",
  messagingSenderId: "1050105289090",
  appId: "1:1050105289090:web:eb2beac5837a8b1b1ed79b"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
