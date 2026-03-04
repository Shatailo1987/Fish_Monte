import {
  collection,
  addDoc,
  onSnapshot,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { initAuth } from "./js/auth.js";
import { renderSales } from "./js/sales.js";
import { renderExpenses } from "./js/expenses.js";
import { renderAnalytics } from "./js/analytics.js";

const auth = window.firebaseAuth;
const db = window.firebaseDB;
const {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} = window.firebaseFns;

initAuth(auth, initApp);

function initApp(user) {

  const salesRef = collection(db, "users", user.uid, "sales");
  const buyersRef = collection(db, "users", user.uid, "buyers");
  const expensesRef = collection(db, "users", user.uid, "expenses");

 app.innerHTML = `
<button id="tabSales">Продажі</button>
<button id="tabExpenses">Витрати</button>
<button id="tabAnalytics">Аналітика</button>
<button id="logoutBtn">Вийти</button>
<hr>
<div id="content"></div>
`;

const content = document.getElementById("content");

document.getElementById("tabSales").onclick =
() => renderSales(content, buyersRef, salesRef, getDocs, addDoc, onSnapshot);

document.getElementById("tabExpenses").onclick =
() => renderExpenses(content, expensesRef, salesRef, getDocs, addDoc, onSnapshot);

document.getElementById("tabAnalytics").onclick =
() => renderAnalytics(content, salesRef, expensesRef, getDocs);

}

  renderSales(content, buyersRef, salesRef, getDocs, addDoc, onSnapshot);

