// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDKZFDxNfAH2Y1g7pMJb46MYoh40u7Bd_o",
  authDomain: "signsenseai.firebaseapp.com",
  projectId: "signsenseai",
  storageBucket: "signsenseai.firebasestorage.app",
  messagingSenderId: "390913442904",
  appId: "1:390913442904:web:3bcdbac6e205c14e48762d",
  measurementId: "G-BKGQN64TSM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app)
export const db = getFirestore(app)