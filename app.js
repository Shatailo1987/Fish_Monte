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
    initApp(user);
  } else {
    authScreen.style.display = "block";
    app.style.display = "none";
  }
});

function initApp(user) {

  const salesRef = collection(db, "users", user.uid, "sales");
  const buyersRef = collection(db, "users", user.uid, "buyers");
  const expensesRef = collection(db, "users", user.uid, "expenses");

  let weights = [];
  let items = [];
  let buyersCache = [];

  app.innerHTML = `
    <button id="tabSales">Продажі</button>
    <button id="tabExpenses">Витрати</button>
    <button id="logoutBtn">Вийти</button>
    <hr>
    <div id="content"></div>
  `;

  document.getElementById("logoutBtn").onclick = () => signOut(auth);

  const content = document.getElementById("content");

  /* ===================== ПРОДАЖІ ===================== */

  async function loadBuyers() {
    const snapshot = await getDocs(buyersRef);
    buyersCache = [];
    snapshot.forEach(doc => buyersCache.push(doc.data().name));
  }

  async function renderSales() {

    await loadBuyers();

    content.innerHTML = `
      <h2>Продаж</h2>

      <select id="buyerSelect">
        <option value="">-- Обрати покупця --</option>
        ${buyersCache.map(b => `<option>${b}</option>`).join("")}
      </select>

      <input id="newBuyer" placeholder="Новий покупець">

      <select id="fishType">
        <option>Короп</option>
        <option>Амур</option>
        <option>Товстолоб</option>
        <option>Карась</option>
        <option>Щука</option>
        <option>Окунь</option>
      </select>

      <input id="weightInput" type="number" placeholder="Наважка">
      <button id="addWeight">Додати</button>

      <div id="weightsList"></div>
      <div><b>Разом кг: <span id="totalKg">0</span></b></div>

      <input id="priceInput" type="number" placeholder="Ціна за кг">
      <button id="addFish">Додати рибу</button>

      <div id="itemsList"></div>
      <div><b>ЗАГАЛОМ: <span id="totalSum">0</span> грн</b></div>

      <button id="saveSale">Зберегти</button>

      <hr>
      <h3>Історія продажів</h3>
      <div id="salesList"></div>
    `;

    document.getElementById("addWeight").onclick = () => {
      const w = Number(weightInput.value);
      if (!w) return;
      weights.push(w);
      weightInput.value = "";
      renderWeights();
    };

    function renderWeights() {
      weightsList.innerHTML = weights.map(w => `<div>${w} кг</div>`).join("");
      totalKg.innerText = weights.reduce((a,b)=>a+b,0);
    }

    document.getElementById("addFish").onclick = () => {
      if (!weights.length) return;

      const kg = weights.reduce((a,b)=>a+b,0);
      const price = Number(priceInput.value);
      const fish = fishType.value;

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

    function renderItems() {
      itemsList.innerHTML = items.map(i =>
        `<div>${i.fish} — ${i.kg} кг × ${i.price} = ${i.sum} грн</div>`
      ).join("");

      totalSum.innerText = items.reduce((a,b)=>a+b.sum,0);
    }

    document.getElementById("saveSale").onclick = async () => {

      const selectedBuyer = buyerSelect.value;
      const newBuyer = newBuyerInput.value.trim();
      const buyer = selectedBuyer || newBuyer;

      if (!buyer || !items.length) return;

      if (!buyersCache.includes(buyer)) {
        await addDoc(buyersRef, { name: buyer });
      }

      await addDoc(salesRef, {
        buyer,
        items,
        totalKg: items.reduce((a,b)=>a+b.kg,0),
        totalSum: items.reduce((a,b)=>a+b.sum,0),
        date: new Date().toISOString()
      });

      items = [];
      renderItems();
    };

    onSnapshot(salesRef, snap => {
      salesList.innerHTML = "";
      snap.forEach(doc => {
        const d = doc.data();
        salesList.innerHTML += `
          <div>${new Date(d.date).toLocaleDateString()} — ${d.buyer} — ${d.totalSum} грн</div>
        `;
      });
    });
  }

  /* ===================== ВИТРАТИ ===================== */

  function renderExpenses() {

    content.innerHTML = `
      <h2>Витрати</h2>

      <select id="expenseCategory">
        <option>Корм</option>
        <option>Зарибок</option>
        <option>Пальне</option>
        <option>Зарплата Рибаки</option>
        <option>Ремонт</option>
        <option>Інше</option>
      </select>

      <input id="expenseSum" type="number" placeholder="Сума (грн)">
      <input id="expenseComment" placeholder="Коментар">

      <button id="saveExpense">Зберегти витрату</button>

      <hr>
      <h3>Історія витрат</h3>
      <div id="expensesList"></div>
      <div><b>ЗАГАЛЬНІ ВИТРАТИ: <span id="totalExpenses">0</span> грн</b></div>
    `;

    document.getElementById("saveExpense").onclick = async () => {

      const category = expenseCategory.value;
      const sum = Number(expenseSum.value);
      const comment = expenseComment.value;

      if (!sum) return;

      await addDoc(expensesRef, {
        category,
        sum,
        comment,
        date: new Date().toISOString()
      });

      expenseSum.value = "";
      expenseComment.value = "";
    };

    onSnapshot(expensesRef, snap => {

      expensesList.innerHTML = "";
      let total = 0;

      snap.forEach(doc => {
        const d = doc.data();
        total += d.sum;

        expensesList.innerHTML += `
          <div>${new Date(d.date).toLocaleDateString()} — ${d.category} — ${d.sum} грн</div>
        `;
      });

      totalExpenses.innerText = total;
    });
  }

  document.getElementById("tabSales").onclick = renderSales;
  document.getElementById("tabExpenses").onclick = renderExpenses;

  renderSales();
}
