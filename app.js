import {
  collection,
  addDoc,
  onSnapshot,
  getDocs
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

  let weights = [];
  let items = [];
  let buyersCache = [];

  const salesRef = collection(db, "users", user.uid, "sales");
  const buyersRef = collection(db, "users", user.uid, "buyers");

  app.innerHTML = `
    <h2>Продаж</h2>

    <select id="buyerSelect">
      <option value="">-- Обрати покупця --</option>
    </select>

    <input id="newBuyer" placeholder="Або новий покупець">

    <select id="fishType">
      <option>Короп</option>
      <option>Амур</option>
      <option>Товстолоб</option>
      <option>Карась</option>
      <option>Щука</option>
      <option>Окунь</option>
    </select>

    <input id="weightInput" type="number" placeholder="Наважка (кг)">
    <button id="addWeight">Додати наважку</button>

    <div id="weightsList"></div>
    <div><b>Разом кг: <span id="totalKg">0</span></b></div>

    <input id="priceInput" type="number" placeholder="Ціна за кг">
    <button id="addFish">Додати рибу</button>

    <h3>Позиції</h3>
    <div id="itemsList"></div>
    <div><b>ЗАГАЛОМ: <span id="totalSum">0</span> грн</b></div>

    <button id="saveSale">Зберегти продаж</button>

    <hr>
    <h3>Історія</h3>
    <div id="salesList"></div>

    <button id="logoutBtn">Вийти</button>
  `;

  document.getElementById("logoutBtn").onclick = () => signOut(auth);

  /* ===== BUYERS ===== */

  const loadBuyers = async () => {
    const snapshot = await getDocs(buyersRef);
    buyersCache = [];
    const select = document.getElementById("buyerSelect");
    select.innerHTML = `<option value="">-- Обрати покупця --</option>`;

    snapshot.forEach(doc => {
      const name = doc.data().name;
      buyersCache.push(name);
      select.innerHTML += `<option value="${name}">${name}</option>`;
    });
  };

  const addBuyerIfNotExists = async (name) => {
    if (!buyersCache.includes(name)) {
      await addDoc(buyersRef, { name });
      buyersCache.push(name);
    }
  };

  loadBuyers();

  /* ===== НАВАЖКИ ===== */

  const renderWeights = () => {
    const list = document.getElementById("weightsList");
    list.innerHTML = "";
    let total = 0;

    weights.forEach((w, i) => {
      total += w;
      list.innerHTML += `<div>${w} кг</div>`;
    });

    document.getElementById("totalKg").innerText = total;
  };

  document.getElementById("addWeight").onclick = () => {
    const w = Number(document.getElementById("weightInput").value);
    if (!w) return;
    weights.push(w);
    document.getElementById("weightInput").value = "";
    renderWeights();
  };

  /* ===== ПОЗИЦІЇ ===== */

  const renderItems = () => {
    const list = document.getElementById("itemsList");
    list.innerHTML = "";
    let total = 0;

    items.forEach(item => {
      total += item.sum;
      list.innerHTML += `
        <div>
          ${item.fish} — ${item.kg} кг × ${item.price} = ${item.sum} грн
        </div>`;
    });

    document.getElementById("totalSum").innerText = total;
  };

  document.getElementById("addFish").onclick = () => {
    if (!weights.length) return;

    const kg = weights.reduce((a, b) => a + b, 0);
    const price = Number(document.getElementById("priceInput").value);
    const fish = document.getElementById("fishType").value;

    items.push({
      fish,
      kg,
      price,
      sum: kg * price
    });

    weights = [];
    renderWeights();
    renderItems();
  };

  /* ===== ЗБЕРЕГТИ ===== */

  document.getElementById("saveSale").onclick = async () => {

    const selectedBuyer = document.getElementById("buyerSelect").value;
    const newBuyer = document.getElementById("newBuyer").value.trim();
    const buyer = selectedBuyer || newBuyer;

    if (!buyer || !items.length) return;

    await addBuyerIfNotExists(buyer);

    const totalKg = items.reduce((a, b) => a + b.kg, 0);
    const totalSum = items.reduce((a, b) => a + b.sum, 0);

    await addDoc(salesRef, {
      buyer,
      items,
      totalKg,
      totalSum,
      date: new Date().toISOString()
    });

    items = [];
    renderItems();
    document.getElementById("newBuyer").value = "";
    document.getElementById("buyerSelect").value = "";
  };

  /* ===== ІСТОРІЯ ===== */

  onSnapshot(salesRef, snapshot => {
    const list = document.getElementById("salesList");
    list.innerHTML = "";

    snapshot.forEach(doc => {
      const data = doc.data();
      const date = new Date(data.date).toLocaleDateString();

      list.innerHTML += `
        <div>
          ${date} — ${data.buyer} — ${data.totalKg} кг — ${data.totalSum} грн
        </div>
      `;
    });
  });
}
