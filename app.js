import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
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

let currentUser = null;

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

const salesCol = () => collection(db, "users", currentUser.uid, "sales");
const buyersCol = () => collection(db, "users", currentUser.uid, "buyers");
const expensesCol = () => collection(db, "users", currentUser.uid, "expenses");
const fishersCol = () => collection(db, "users", currentUser.uid, "fishers");

/* ================= INIT ================= */

function initApp() {
  initTabs();
  initSales();
  initExpenses();
  listenBuyers();
  listenFishers();
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

let buyersCache = [];

function listenBuyers() {
  onSnapshot(buyersCol(), snap => {
    buyersCache = [];
    snap.forEach(d => buyersCache.push({ id: d.id, ...d.data() }));
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
  if (!buyersCache.find(b => b.name === name)) {
    await addDoc(buyersCol(), { name });
  }
}

/* ================= FISHERS ================= */

let fishersCache = [];

function listenFishers() {
  onSnapshot(fishersCol(), snap => {
    fishersCache = [];
    snap.forEach(d => fishersCache.push({ id: d.id, ...d.data() }));
    renderFisherSelect();
  });
}

function renderFisherSelect() {
  const select = document.getElementById("fisherSelect");
  if (!select) return;
  select.innerHTML = `<option value="">-- Обрати рибака --</option>`;
  fishersCache.forEach(f => {
    select.innerHTML += `<option value="${f.name}">${f.name}</option>`;
  });
}

async function addFisherIfNotExists(name) {
  if (!fishersCache.find(f => f.name === name)) {
    await addDoc(fishersCol(), { name });
  }
}

/* ================= SALES ================= */

let weights = [];
let saleItems = [];

function initSales() {
  sales.innerHTML = `
  <div class="card">
    <h3>Продаж</h3>

    <select id="buyerSelect"></select>
    <input id="buyerInput" placeholder="Новий покупець">

    <select id="fishType">
      <option>Короп</option>
      <option>Амур</option>
      <option>Товстолоб</option>
      <option>Карась</option>
      <option>Щука</option>
      <option>Окунь</option>
    </select>

    <input id="weightInput" type="number" placeholder="Наважка">
    <button id="addWeightBtn">Додати</button>

    <div id="weightsBox"></div>
    <div><b>Разом кг: <span id="totalKg">0</span></b></div>

    <input id="priceInput" type="number" placeholder="Ціна">
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
      <div>${w} кг <button onclick="removeWeight(${i})">x</button></div>`;
  });
  totalKg.innerText = weights.reduce((a, b) => a + b, 0);
}

window.removeWeight = i => {
  weights.splice(i, 1);
  renderWeights();
};

function addFish() {
  if (!weights.length) return;

  const kg = weights.reduce((a, b) => a + b, 0);
  const price = Number(priceInput.value);

  saleItems.push({
    fish: fishType.value,
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
        ${item.fish} — ${item.kg} кг × ${item.price}
        <button onclick="removeFish(${i})">x</button>
      </div>`;
  });
  saleTotal.innerText = total;
}

window.removeFish = i => {
  saleItems.splice(i, 1);
  renderSaleItems();
};

async function saveSale() {
  const buyer = buyerSelect.value || buyerInput.value.trim();
  if (!buyer || !saleItems.length) return;

  await addBuyerIfNotExists(buyer);

  const total = saleItems.reduce((a, b) => a + b.sum, 0);
  const totalKg = saleItems.reduce((a, b) => a + b.kg, 0);

  await addDoc(salesCol(), {
    date: new Date().toISOString().slice(0, 10),
    buyer,
    items: saleItems,
    total,
    totalKg
  });

  saleItems = [];
  renderSaleItems();
}

/* ================= EXPENSES ================= */

function initExpenses() {
  expenses.innerHTML = `
  <div class="card">
    <h3>Зарплата Рибаки</h3>

    <select id="fisherSelect"></select>
    <input id="fisherInput" placeholder="Новий рибак">
    <input id="fisherSum" type="number" placeholder="Зарплата">
    <input id="fisherFuel" type="number" placeholder="Пальне">

    <button id="saveFisherSalaryBtn">Зберегти</button>
  </div>

  <div class="card">
    <h3>Історія зарплат</h3>
    <div id="expensesHistory"></div>
  </div>
  `;

  saveFisherSalaryBtn.onclick = saveFisherSalary;
  renderFisherSelect();
  listenFisherSalaries();
}

async function saveFisherSalary() {
  const name = fisherSelect.value || fisherInput.value.trim();
  if (!name) return;

  await addFisherIfNotExists(name);

  await addDoc(expensesCol(), {
    date: new Date().toISOString().slice(0, 10),
    category: "Зарплата Рибаки",
    name,
    sum: Number(fisherSum.value),
    fuel: Number(fisherFuel.value || 0)
  });
}

function listenFisherSalaries() {
  onSnapshot(expensesCol(), snap => {
    expensesHistory.innerHTML = "";
    snap.forEach(d => {
      const e = d.data();
      if (e.category === "Зарплата Рибаки") {
        expensesHistory.innerHTML += `
          <div>
            ${e.date} — ${e.name} — ${e.sum} грн
            <button onclick="deleteExpense('${d.id}')">🗑</button>
          </div><hr>`;
      }
    });
  });
}

window.deleteExpense = async id => {
  await deleteDoc(doc(db, "users", currentUser.uid, "expenses", id));
};
