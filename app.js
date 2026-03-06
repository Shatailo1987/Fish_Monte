import {
  collection,
  addDoc,
  onSnapshot,
  getDocs,
  deleteDoc,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { initAuth } from "./js/auth.js";
import { renderSales } from "./js/sales.js";
import { renderExpenses } from "./js/expenses.js";
import { renderAnalytics } from "./js/analytics.js";

const auth = window.firebaseAuth;
const db = window.firebaseDB;
const { signOut } = window.firebaseFns;

const app = document.getElementById("app");

initAuth(auth, initApp);

function initApp(user) {

const salesRef = collection(db, "users", user.uid, "sales");
const buyersRef = collection(db, "users", user.uid, "buyers");
const expensesRef = collection(db, "users", user.uid, "expenses");

app.innerHTML = `

<div class="dashboard">

<div class="card stat">

<div class="statTitle">Кг продано</div>

<div class="statValue" id="statKg">0</div>

<div id="statFishBreakdown"
style="
margin-top:6px;
font-size:12px;
color:#666;
line-height:1.4;
">
</div>

</div>

<div class="card stat">
<div class="statTitle">Виручка</div>
<div class="statValue" id="statMoney">0</div>
</div>

<div class="card stat">
<div class="statTitle">Продажів</div>
<div class="statValue" id="statSales">0</div>
</div>

<div class="card stat">
<div class="statTitle">ТОП покупець сьогодні</div>
<div class="statValue" id="topBuyer">—</div>
</div>

<div class="card stat">
<div class="statTitle">ТОП риба сьогодні</div>
<div class="statValue" id="topFish">—</div>
</div>

</div>

<div class="tabs">
<button id="tabSales">Продажі</button>
<button id="tabExpenses">Витрати</button>
<button id="tabAnalytics">Аналітика</button>
<button id="logoutBtn">Вийти</button>
</div>

<div id="content"></div>
`;

const content = document.getElementById("content");

document.getElementById("logoutBtn").onclick = () => signOut(auth);

document.getElementById("tabSales").onclick =
() => renderSales(content, buyersRef, salesRef, getDocs, addDoc, onSnapshot, deleteDoc, doc, updateDoc);

document.getElementById("tabExpenses").onclick =
() => renderExpenses(content, expensesRef, salesRef, getDocs, addDoc, onSnapshot);

document.getElementById("tabAnalytics").onclick =
() => renderAnalytics(content, salesRef, expensesRef, getDocs);


onSnapshot(salesRef, snap => {

let totalKg = 0;
let totalMoney = 0;
let count = 0;
  
let fishStats = {};
let buyerStats = {};

snap.forEach(d => {

const s = d.data();

totalKg += s.totalKg || 0;
totalMoney += s.totalSum || 0;
count++;

/* рахуємо рибу */

if(s.items){

s.items.forEach(i=>{

if(!fishStats[i.fish]){
fishStats[i.fish] = 0;
}

fishStats[i.fish] += i.kg;

});

}

});

const kgEl = document.getElementById("statKg");
const moneyEl = document.getElementById("statMoney");
const salesEl = document.getElementById("statSales");

if(kgEl) kgEl.innerText = totalKg;
if(moneyEl) moneyEl.innerText = totalMoney + " грн";
if(salesEl) salesEl.innerText = count;

const fishDiv = document.getElementById("statFishBreakdown");

if(fishDiv){

fishDiv.innerHTML = Object.entries(fishStats)
.map(([fish,kg]) => fish + " — " + kg + " кг")
.join("<br>");

}

});


renderSales(content, buyersRef, salesRef, getDocs, addDoc, onSnapshot, deleteDoc, doc, updateDoc);

}
