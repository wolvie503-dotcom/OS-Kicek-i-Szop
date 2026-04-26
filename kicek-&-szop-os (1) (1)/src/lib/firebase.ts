// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA0U--4ii5qjjP9PCUc1aIaMaemzXiMcmY",
  authDomain: "kicek-i-szop-os.firebaseapp.com",
  projectId: "kicek-i-szop-os",
  storageBucket: "kicek-i-szop-os.firebasestorage.app",
  messagingSenderId: "693705509043",
  appId: "1:693705509043:web:61aa7e30df6256fb8b08c6",
  measurementId: "G-T66WQYK565"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
