// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAYQ093hbU99HFw5Wr_w7CoiU8MPcl_OD8",
  authDomain: "bpl-lieo-queuing-system.firebaseapp.com",
  projectId: "bpl-lieo-queuing-system",
  storageBucket: "bpl-lieo-queuing-system.firebasestorage.app",
  messagingSenderId: "1025728386919",
  appId: "1:1025728386919:web:b3eec7f3fee8e7e7ad01c2",
  measurementId: "G-K6WZJG2SS9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);