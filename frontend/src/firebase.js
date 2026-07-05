import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD0pyRnqqGg9xPVn1-uzHKJAALD0oeDcJg",
  authDomain: "persona-chat-app-6d0c4.firebaseapp.com",
  projectId: "persona-chat-app-6d0c4",
  storageBucket: "persona-chat-app-6d0c4.firebasestorage.app",
  messagingSenderId: "403577891803",
  appId: "1:403577891803:web:b366f01bf3ce74b35b15fe",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);