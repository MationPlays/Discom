
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getAuth} from 'firebase/auth'
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCeZP37OC45XXlL1NVVfY0aJ-2IoIQYzJo",
  authDomain: "gaming-community-4b82d.firebaseapp.com",
  databaseURL: "https://gaming-community-4b82d-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "gaming-community-4b82d",
  storageBucket: "gaming-community-4b82d.appspot.com",
  messagingSenderId: "460097583584",
  appId: "1:460097583584:web:2f7ac03bef229dcb5fd385"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app)

export {auth, app}