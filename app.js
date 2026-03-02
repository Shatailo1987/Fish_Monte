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
    currentUser = null;
    authScreen.classList.remove("hidden");
    app.classList.add("hidden");
  }
});

/* ================= INIT ================= */

function initApp() {
  initTabs();
  initSales();
  initExpenses();
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

/* ================= COLLECTIONS ================= */

function salesCollection() {
  return collection(db, "users", currentUser.uid, "sales");
}

function expensesCollection() {
  return collection(db, "users", currentUser.uid, "expenses");
}

/* ================= SALES (скорочено) ================= */

let weights = [];
let saleItems = [];

function initSales() {
  sales.innerHTML = `
  <div class="card">
    <h3>Продажі</h3>
    <div id="salesHistory"></div>
  </div>
  `;
  listenSales();
}

function listenSales() {
  onSnapshot(salesCollection(), snap => {
    salesHistory.innerHTML = "";
    snap.forEach(docSnap => {
      const s = docSnap.data();
      salesHistory.innerHTML += `
        <div>
          ${s.date} — ${s.buyer} — ${s.total} грн
        </div><hr>
      `;
    });
  });
}

/* ================= EXPENSES ================= */

function initExpenses() {
  expenses.innerHTML = `
  <div class="card">
    <h3>Нова витрата</h3>

    <select id="expenseCategory">
      <option>Корм</option>
      <option>Зарибок</option>
      <option>Пальне</option>
      <option>Зарплата Охорона</option>
      <option>Зарплата Рибаки</option>
      <option>Харчування</option>
      <option>Ремонт</option>
    </select>

    <div id="expenseDynamic"></div>

    <button id="saveExpenseBtn">Зберегти</button>
  </div>

  <div class="card">
    <h3>Історія витрат</h3>
    <div id="expensesHistory"></div>
  </div>
  `;

  expenseCategory.onchange = renderExpenseForm;
  saveExpenseBtn.onclick = saveExpense;

  renderExpenseForm();
  listenExpenses();
}

function renderExpenseForm() {
  const cat = expenseCategory.value;
  let html = "";

  if (cat === "Корм") {
    html = `
      <select id="feedType">
        <option>Комбікорм</option>
        <option>Зерно</option>
        <option>Відходи</option>
        <option>Доставка</option>
      </select>
      <input id="feedName" placeholder="Назва / яке зерно / які відходи">
      <input id="feedWeight" type="number" placeholder="Вага (кг)">
      <input id="feedSum" type="number" placeholder="Сума">
    `;
  }

  if (cat === "Зарибок") {
    html = `
      <select id="stockType">
        <option>Мальок</option>
        <option>Транспорт</option>
      </select>
      <select id="stockFish">
        <option>Короп</option>
        <option>Амур</option>
        <option>Товстолоб</option>
        <option>Щука</option>
        <option>Судак</option>
      </select>
      <input id="stockQty" type="number" placeholder="Кількість (шт)">
      <input id="stockWeight" type="number" placeholder="Вага (кг)">
      <input id="stockSum" type="number" placeholder="Сума">
    `;
  }

  if (cat === "Пальне") {
    html = `
      <input id="fuelSum" type="number" placeholder="Сума">
      <input id="fuelComment" placeholder="Коментар">
    `;
  }

  if (cat === "Зарплата Охорона") {
    html = `
      <input id="guardMonth" placeholder="Місяць">
      <input id="guardDays" type="number" placeholder="Дні">
      <input id="guardSum" type="number" placeholder="Сума">
    `;
  }

  if (cat === "Зарплата Рибаки") {
    html = `
      <input id="fisherName" placeholder="Прізвище">
      <input id="fisherSum" type="number" placeholder="Сума">
      <input id="fisherFuel" type="number" placeholder="Пальне">
    `;
  }

  if (cat === "Харчування") {
    html = `
      <input id="foodPortions" type="number" placeholder="Порції">
      <input id="foodPrice" type="number" placeholder="Ціна">
    `;
  }

  if (cat === "Ремонт") {
    html = `
      <input id="repairName" placeholder="Опис">
      <input id="repairSum" type="number" placeholder="Сума">
    `;
  }

  expenseDynamic.innerHTML = html;
}

async function saveExpense() {
  const cat = expenseCategory.value;

  let data = {
    date: new Date().toISOString().slice(0, 10),
    category: cat
  };

  if (cat === "Корм") {
    data.type = feedType.value;
    data.name = feedName.value;
    data.weight = Number(feedWeight.value || 0);
    data.sum = Number(feedSum.value);
  }

  if (cat === "Зарибок") {
    data.type = stockType.value;
    data.fish = stockFish.value;
    data.qty = Number(stockQty.value || 0);
    data.weight = Number(stockWeight.value || 0);
    data.sum = Number(stockSum.value);
  }

  if (cat === "Пальне") {
    data.sum = Number(fuelSum.value);
    data.comment = fuelComment.value;
  }

  if (cat === "Зарплата Охорона") {
    data.month = guardMonth.value;
    data.days = Number(guardDays.value);
    data.sum = Number(guardSum.value);
  }

  if (cat === "Зарплата Рибаки") {
    data.name = fisherName.value;
    data.sum = Number(fisherSum.value);
    data.fuel = Number(fisherFuel.value || 0);
  }

  if (cat === "Харчування") {
    const portions = Number(foodPortions.value);
    const price = Number(foodPrice.value);
    data.sum = portions * price;
  }

  if (cat === "Ремонт") {
    data.name = repairName.value;
    data.sum = Number(repairSum.value);
  }

  await addDoc(expensesCollection(), data);
}

function listenExpenses() {
  onSnapshot(expensesCollection(), snap => {
    expensesHistory.innerHTML = "";
    snap.forEach(docSnap => {
      const e = docSnap.data();
      expensesHistory.innerHTML += `
        <div>
          ${e.date} — ${e.category} — ${e.sum} грн
          <button onclick="deleteExpense('${docSnap.id}')">🗑</button>
        </div>
        <hr>
      `;
    });
  });
}

window.deleteExpense = async function (id) {
  await deleteDoc(doc(db, "users", currentUser.uid, "expenses", id));
};
