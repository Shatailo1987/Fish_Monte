import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, onSnapshot } 
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth = window.firebaseAuth;
const db = window.firebaseDB;
const { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } = window.firebaseFns;

/* ===== AUTH ===== */

document.getElementById("registerBtn").onclick = async () => {
  await createUserWithEmailAndPassword(auth,
    email.value,
    password.value
  );
};

document.getElementById("loginBtn").onclick = async () => {
  await signInWithEmailAndPassword(auth,
    email.value,
    password.value
  );
};

document.getElementById("logoutBtn").onclick = () => signOut(auth);

onAuthStateChanged(auth, user => {
  if(user){
    authScreen.classList.add("hidden");
    app.classList.remove("hidden");
    loadAll();
  } else {
    authScreen.classList.remove("hidden");
    app.classList.add("hidden");
  }
});

/* ===== SALES ===== */

async function addSale(data){
  await addDoc(collection(db,"sales"),data);
}

function listenSales(){
  onSnapshot(collection(db,"sales"), snap=>{
    let html="<div class='card'><h3>Продажі</h3>";
    snap.forEach(doc=>{
      const s=doc.data();
      html+=`<div>${s.date} — ${s.buyer} — ${s.total} грн</div>`;
    });
    html+="</div>";
    sales.innerHTML=html;
  });
}

/* ===== EXPENSES ===== */

async function addExpense(data){
  await addDoc(collection(db,"expenses"),data);
}

function listenExpenses(){
  onSnapshot(collection(db,"expenses"), snap=>{
    let html="<div class='card'><h3>Витрати</h3>";
    snap.forEach(doc=>{
      const e=doc.data();
      html+=`<div>${e.date} — ${e.category} — ${e.sum} грн</div>`;
    });
    html+="</div>";
    expenses.innerHTML=html;
  });
}

/* ===== DASHBOARD ===== */

function loadDashboard(){
  onSnapshot(collection(db,"sales"), salesSnap=>{
    onSnapshot(collection(db,"expenses"), expSnap=>{
      let income=0,cost=0;
      salesSnap.forEach(d=>income+=d.data().total||0);
      expSnap.forEach(d=>cost+=d.data().sum||0);
      dashboard.innerHTML=`
        <div class="card">
          Оборот: ${income} грн<br>
          Витрати: ${cost} грн<br>
          Прибуток: ${income-cost} грн
        </div>`;
    });
  });
}

/* ===== LOAD ===== */

function loadAll(){
  listenSales();
  listenExpenses();
  loadDashboard();
}
