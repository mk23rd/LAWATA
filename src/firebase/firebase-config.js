import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCW0MIaLix6EuyG1t910OMxmBDkLhPocao",
  authDomain: "croudfundproject.firebaseapp.com",
  databaseURL: "https://croudfundproject-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "croudfundproject",
  storageBucket: "croudfundproject.firebasestorage.app",
  messagingSenderId: "878118431451",
  appId: "1:878118431451:web:0366c3c50bc489dc59fafe",
  measurementId: "G-45GEEDN8GT"
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;