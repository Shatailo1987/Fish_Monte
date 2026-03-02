import {
  collection,
  addDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth = window.firebaseAuth;
const db = window.firebaseDB;
const {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} = window.firebaseFns;

const authScreen = document.getElementById("authScreen");
const app = document.getElementById("app");
const authError = document.getElementById("authError");

document.getElementById("registerBtn").onclick = async () => {
  try {
    await createUserWithEmailAndPassword(auth, email.value, password.value);
  } catch (error) {
    authError.innerText = error.message;
  }
};

document.getElementById("loginBtn").onclick = async () => {
  try {
    await signInWithEmailAndPassword(auth, email.value, password.value);
  } catch (error) {
    authError.innerText = error.message;
  }
};

document.getElementById("logoutBtn").onclick = () => signOut(auth);

onAuthStateChanged(auth, user => {
  if (user) {
    authScreen.style.display = "none";
    app.style.display = "block";
    initSales(user);
  } else {
    authScreen.style.display = "block";
    app.style.display = "none";
  }
});

function initSales(user) {

  app.innerHTML = `
    <h2>Продажі</h2>

    <input id="buyerName" placeholder="Покупець">
    <input id="saleAmount" type="number" placeholder="Сума (грн)">
    <button id="saveSale">Зберегти продаж</button>

    <h3>Історія</h3>
    <div id="salesList"></div>

    <button id="logoutBtn">Вийти</button>
  `;

  document.getElementById("logoutBtn").onclick = () => signOut(auth);

  const salesRef = collection(db, "users", user.uid, "sales");

  document.getElementById("saveSale").onclick = async () => {
    const buyer = document.getElementById("buyerName").value;
    const amount = Number(document.getElementById("saleAmount").value);

    if (!buyer || !amount) return;

    await addDoc(salesRef, {
      buyer,
      amount,
      date: new Date().toISOString()
    });

    document.getElementById("buyerName").value = "";
    document.getElementById("saleAmount").value = "";
  };

  onSnapshot(salesRef, snapshot => {
    const list = document.getElementById("salesList");
    list.innerHTML = "";

    snapshot.forEach(doc => {
      const data = doc.data();
      const date = new Date(data.date).toLocaleDateString();

      list.innerHTML += `
        <div>
          ${date} — ${data.buyer} — ${data.amount} грн
        </div>
      `;
    });
  });
}
