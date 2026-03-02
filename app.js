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
let editingExpenseId = null;
let expensesData = [];

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

/* ================= COLLECTION ================= */

function expensesCol() {
  return collection(db, "users", currentUser.uid, "expenses");
}

/* ================= INIT ================= */

function initApp() {
  initTabs();
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

/* ================= EXPENSES ================= */

function initExpenses() {
  expenses.innerHTML = `
  <div class="card">
    <h3>Нова / Редагування витрати</h3>

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

function renderExpenseForm(data = null) {
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
      <input id="feedName" placeholder="Назва">
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
      <input id="stockFish" placeholder="Вид">
      <input id="stockQty" type="number" placeholder="Кількість">
      <input id="stockWeight" type="number" placeholder="Вага">
      <input id="stockSum" type="number" placeholder="Сума">
    `;
  }

  if (cat === "Пальне") {
    html = `
      <input id="fuelSum" type="number" placeholder="Сума">
      <input id="fuelComment" placeholder="Коментар">
    `;
  }

  if (cat === "Ремонт") {
    html = `
      <input id="repairName" placeholder="Опис">
      <input id="repairSum" type="number" placeholder="Сума">
    `;
  }

  expenseDynamic.innerHTML = html;

  if (data) fillExpenseForm(data);
}

function fillExpenseForm(data) {
  expenseCategory.value = data.category;
  renderExpenseForm();

  if (data.category === "Корм") {
    feedType.value = data.type || "";
    feedName.value = data.name || "";
    feedWeight.value = data.weight || "";
    feedSum.value = data.sum || "";
  }

  if (data.category === "Зарибок") {
    stockType.value = data.type || "";
    stockFish.value = data.fish || "";
    stockQty.value = data.qty || "";
    stockWeight.value = data.weight || "";
    stockSum.value = data.sum || "";
  }

  if (data.category === "Пальне") {
    fuelSum.value = data.sum || "";
    fuelComment.value = data.comment || "";
  }

  if (data.category === "Ремонт") {
    repairName.value = data.name || "";
    repairSum.value = data.sum || "";
  }
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

  if (cat === "Ремонт") {
    data.name = repairName.value;
    data.sum = Number(repairSum.value);
  }

  if (editingExpenseId) {
    await updateDoc(
      doc(db, "users", currentUser.uid, "expenses", editingExpenseId),
      data
    );
    editingExpenseId = null;
  } else {
    await addDoc(expensesCol(), data);
  }
}

function listenExpenses() {
  onSnapshot(expensesCol(), snap => {
    expensesHistory.innerHTML = "";
    expensesData = [];

    snap.forEach(docSnap => {
      const e = docSnap.data();
      expensesData.push({ id: docSnap.id, ...e });

      expensesHistory.innerHTML += `
        <div>
          ${e.date} — ${e.category} — ${e.sum} грн
          <button onclick="editExpense('${docSnap.id}')">✏</button>
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

window.editExpense = function (id) {
  const expense = expensesData.find(e => e.id === id);
  editingExpenseId = id;
  fillExpenseForm(expense);
};
