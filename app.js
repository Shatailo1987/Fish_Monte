import {
  collection,
  addDoc,
  doc,
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

function salesCol() {
  return collection(db, "users", currentUser.uid, "sales");
}

function expensesCol() {
  return collection(db, "users", currentUser.uid, "expenses");
}

/* ================= INIT ================= */

function initApp() {
  initTabs();
  initAnalytics();
  listenSales();
  listenExpenses();
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

/* ================= DATA CACHE ================= */

let salesData = [];
let expensesData = [];

/* ================= LISTENERS ================= */

function listenSales() {
  onSnapshot(salesCol(), snap => {
    salesData = [];
    snap.forEach(docSnap => {
      salesData.push(docSnap.data());
    });
    renderAnalytics();
  });
}

function listenExpenses() {
  onSnapshot(expensesCol(), snap => {
    expensesData = [];
    snap.forEach(docSnap => {
      expensesData.push(docSnap.data());
    });
    renderAnalytics();
  });
}

/* ================= АНАЛІТИКА ================= */

function initAnalytics() {
  analytics.innerHTML = `
  <div class="card">
    <h3>Фінансовий підсумок</h3>
    <div id="analyticsBox"></div>
  </div>

  <div class="card">
    <h3>Розбиття витрат по категоріях</h3>
    <div id="categoriesBox"></div>
  </div>

  <div class="card">
    <button id="exportBtn">📥 Експорт в Excel</button>
  </div>
  `;

  dashboard.innerHTML = `
  <div class="card">
    <h3>Панель керування</h3>
    <div id="dashboardBox"></div>
  </div>
  `;

  exportBtn.onclick = exportExcel;
}

function renderAnalytics() {
  const income = salesData.reduce((a, s) => a + (s.total || 0), 0);
  const cost = expensesData.reduce((a, e) => a + (e.sum || 0), 0);
  const totalKg = salesData.reduce((a, s) => a + (s.totalKg || 0), 0);
  const costPerKg = totalKg ? (cost / totalKg).toFixed(2) : 0;

  analyticsBox.innerHTML = `
    Дохід: ${income} грн<br>
    Витрати: ${cost} грн<br>
    <b>Чистий прибуток: ${income - cost} грн</b><br>
    Реалізовано: ${totalKg} кг<br>
    Собівартість 1 кг: ${costPerKg} грн
  `;

  /* ===== РОЗБИТТЯ ПО КАТЕГОРІЯХ ===== */

  const map = {};
  expensesData.forEach(e => {
    if (!map[e.category]) map[e.category] = 0;
    map[e.category] += e.sum || 0;
  });

  categoriesBox.innerHTML = Object.entries(map)
    .map(([k, v]) => `${k}: ${v} грн`)
    .join("<br>");

  /* ===== ПАНЕЛЬ ===== */

  dashboardBox.innerHTML = `
    Оборот: ${income} грн<br>
    Витрати: ${cost} грн<br>
    Прибуток: ${income - cost} грн<br>
    Реалізація: ${totalKg} кг<br>
    Собівартість 1 кг: ${costPerKg} грн
  `;
}

/* ================= EXCEL ================= */

function exportExcel() {

  const salesRows = [];
  salesData.forEach(s => {
    if (s.items) {
      s.items.forEach(i => {
        salesRows.push({
          Дата: s.date,
          Покупець: s.buyer,
          Риба: i.fish,
          Кг: i.kg,
          Ціна: i.price,
          Сума: i.sum
        });
      });
    }
  });

  const expensesRows = expensesData.map(e => ({
    Дата: e.date,
    Категорія: e.category,
    Сума: e.sum,
    Деталі: e.name || e.comment || ""
  }));

  const summaryRows = [
    { Показник: "Дохід", Значення: salesData.reduce((a, s) => a + (s.total || 0), 0) },
    { Показник: "Витрати", Значення: expensesData.reduce((a, e) => a + (e.sum || 0), 0) }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(salesRows), "Продажі");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expensesRows), "Витрати");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), "Підсумок");

  XLSX.writeFile(wb, "звіт_ставок.xlsx");
}
