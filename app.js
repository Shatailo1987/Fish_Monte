import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth = window.firebaseAuth;
const db = window.firebaseDB;
const {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} = window.firebaseFns;

let currentUser = null;
let buyersCache = [];

/* ================= AUTH ================= */

registerBtn.onclick = async () => {
  await createUserWithEmailAndPassword(auth, email.value, password.value);
};

loginBtn.onclick = async () => {
  await signInWithEmailAndPassword(auth, email.value, password.value);
};

logoutBtn.onclick = () => signOut(auth);

onAuthStateChanged(auth, user => {
  if (user) {
    currentUser = user;
    authScreen.classList.add("hidden");
    app.classList.remove("hidden");
    initApp();
  } else {
    authScreen.classList.remove("hidden");
    app.classList.add("hidden");
  }
});

/* ================= COLLECTIONS ================= */

function salesCol() {
  return collection(db, "users", currentUser.uid, "sales");
}

function buyersCol() {
  return collection(db, "users", currentUser.uid, "buyers");
}

/* ================= INIT ================= */

function initApp() {
  initTabs();
  initSales();
  listenBuyers();
}

/* ================= TABS ================= */

function initTabs() {
  document.querySelectorAll(".tabs button").forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll(".tab").forEach(t => t.classList.add("hidden"));
      document.getElementById(btn.dataset.tab).classList.remove("hidden");
    };
  });
}

/* ================= BUYERS ================= */

function listenBuyers() {
  onSnapshot(buyersCol(), snap => {
    buyersCache = [];
    snap.forEach(docSnap => {
      buyersCache.push({ id: docSnap.id, ...docSnap.data() });
    });
    renderBuyerSelect();
  });
}

function renderBuyerSelect() {
  const select = document.getElementById("buyerSelect");
  if (!select) return;

  select.innerHTML = `<option value="">-- Обрати покупця --</option>`;
  buyersCache.forEach(b => {
    select.innerHTML += `<option value="${b.name}">${b.name}</option>`;
  });
}

async function addBuyerIfNotExists(name) {
  if (!name) return;

  const exists = buyersCache.find(b => b.name === name);
  if (!exists) {
    await addDoc(buyersCol(), { name });
  }
}

/* ================= SALES ================= */

let weights = [];
let saleItems = [];

function initSales() {
  sales.innerHTML = `
  <div class="card">
    <h3>Новий продаж</h3>

    <select id="buyerSelect"></select>
    <input id="buyerInput" placeholder="Або вписати нового">

    <select id="fishType">
      <option>Короп</option>
      <option>Амур</option>
      <option>Товстолоб</option>
      <option>Карась</option>
      <option>Щука</option>
      <option>Окунь</option>
    </select>

    <input id="weightInput" type="number" placeholder="Наважка (кг)">
    <button id="addWeightBtn">Додати наважку</button>

    <div id="weightsBox"></div>
    <div><b>Разом: <span id="totalKg">0</span> кг</b></div>

    <input id="priceInput" type="number" placeholder="Ціна за кг">
    <button id="addFishBtn">Додати рибу</button>

    <div id="saleItemsBox"></div>
    <div><b>ЗАГАЛОМ: <span id="saleTotal">0</span> грн</b></div>

    <button id="saveSaleBtn">Зберегти</button>
  </div>
  `;

  addWeightBtn.onclick = addWeight;
  addFishBtn.onclick = addFish;
  saveSaleBtn.onclick = saveSale;

  renderBuyerSelect();
}

/* ================= НАВАЖКИ ================= */

function addWeight() {
  const w = Number(weightInput.value);
  if (!w) return;
  weights.push(w);
  weightInput.value = "";
  renderWeights();
}

function renderWeights() {
  weightsBox.innerHTML = "";
  weights.forEach((w, i) => {
    weightsBox.innerHTML += `
      <div>${w} кг 
        <button onclick="removeWeight(${i})">x</button>
      </div>`;
  });
  totalKg.innerText = weights.reduce((a, b) => a + b, 0);
}

window.removeWeight = function (i) {
  weights.splice(i, 1);
  renderWeights();
};

/* ================= ДОДАТИ РИБУ ================= */

function addFish() {
  if (!weights.length) return;

  const kg = weights.reduce((a, b) => a + b, 0);
  const price = Number(priceInput.value);
  const fish = fishType.value;

  saleItems.push({
    fish,
    kg,
    price,
    sum: kg * price
  });

  weights = [];
  renderWeights();
  renderSaleItems();
}

function renderSaleItems() {
  saleItemsBox.innerHTML = "";
  let total = 0;

  saleItems.forEach((item, i) => {
    total += item.sum;
    saleItemsBox.innerHTML += `
      <div>
        ${item.fish} — ${item.kg} кг × ${item.price} = ${item.sum} грн
        <button onclick="removeFish(${i})">x</button>
      </div>
    `;
  });

  saleTotal.innerText = total;
}

window.removeFish = function (i) {
  saleItems.splice(i, 1);
  renderSaleItems();
};

/* ================= ЗБЕРЕГТИ ПРОДАЖ ================= */

async function saveSale() {
  const selectedBuyer = buyerSelect.value;
  const newBuyer = buyerInput.value.trim();
  const buyerName = selectedBuyer || newBuyer;

  if (!buyerName || !saleItems.length) return;

  await addBuyerIfNotExists(buyerName);

  const total = saleItems.reduce((a, b) => a + b.sum, 0);
  const totalKg = saleItems.reduce((a, b) => a + b.kg, 0);

  await addDoc(salesCol(), {
    date: new Date().toISOString().slice(0, 10),
    buyer: buyerName,
    items: saleItems,
    total,
    totalKg
  });

  saleItems = [];
  renderSaleItems();
}
