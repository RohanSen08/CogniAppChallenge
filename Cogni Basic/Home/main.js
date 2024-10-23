document.addEventListener('DOMContentLoaded', function () {
    // Handle "Get Started" button click
    document.querySelector('.cta').addEventListener('click', function() {
        window.location.href = '#services'; // Redirect to the services section
    });

    // Handle "Sign in" button click
    document.querySelector('.Sign-in').addEventListener('click', function() {
        // For demonstration, this just logs to the console. You should replace it with your actual sign-in logic
        console.log('Sign in button clicked');
        // Example: window.location.href = 'sign-in.html'; // Redirect to the sign-in page
    });

    // Smooth scrolling for navigation links
    document.querySelectorAll('nav a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
});

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-analytics.js";
import {getAuth} from  "https://www.gstatic.com/firebasejs/10.12.3/firebase-analytics.js"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA6cKN_WTmdeguyy9OD_SzksenND29AOfw",
  authDomain: "cogni-learning-48304.firebaseapp.com",
  projectId: "cogni-learning-48304",
  storageBucket: "cogni-learning-48304.appspot.com",
  messagingSenderId: "416972988433",
  appId: "1:416972988433:web:816a48ce9735349ba411b0",
  measurementId: "G-1ZE6N944QJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);