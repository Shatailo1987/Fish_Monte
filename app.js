import {
  collection,
  addDoc,
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

  async function loadBuyers() {
    const snap = await getDocs(buyersRef);
    buyersCache = [];
    snap.forEach(doc => buyersCache.push(doc.data()));
  }

  /* ================= ПРОДАЖІ ================= */

  async function renderSales() {

    await loadBuyers();

    content.innerHTML = `
      <h2>Продаж</h2>

      <select id="buyerSelect">
        <option value="">-- Обрати покупця --</option>
        ${buyersCache.map(b => `<option value="${b.phone}">
          ${b.name} (${b.phone})
        </option>`).join("")}
      </select>

      <h4>Новий покупець</h4>
      <input id="newBuyerName" placeholder="Імʼя">
      <input id="newBuyerPhone" placeholder="Телефон">

      <input id="saleAmount" type="number" placeholder="Сума">
      <button id="saveSale">Зберегти</button>

      <hr>
      <h3>Історія</h3>
      <div id="salesList"></div>
    `;

    document.getElementById("saveSale").onclick = async () => {

      const selectedPhone = buyerSelect.value;
      const newName = newBuyerName.value.trim();
      const newPhone = newBuyerPhone.value.trim();
      const amount = Number(saleAmount.value);

      if (!amount) return;

      let buyerName = "";
      let buyerPhone = "";

      if (selectedPhone) {
        const found = buyersCache.find(b => b.phone === selectedPhone);
        buyerName = found.name;
        buyerPhone = found.phone;
      } else {

        if (!newName || !newPhone) {
          alert("Вкажіть імʼя і телефон");
          return;
        }

        const existing = buyersCache.find(b => b.phone === newPhone);
        if (existing) {
          alert("Покупець з таким телефоном вже існує");
          return;
        }

        await addDoc(buyersRef, {
          name: newName,
          phone: newPhone
        });

        buyerName = newName;
        buyerPhone = newPhone;
      }

      await addDoc(salesRef, {
        buyerName,
        buyerPhone,
        amount,
        date: new Date().toISOString()
      });

      newBuyerName.value = "";
      newBuyerPhone.value = "";
      saleAmount.value = "";

      renderSales();
    };

    onSnapshot(salesRef, snap => {
      salesList.innerHTML = "";
      snap.forEach(doc => {
        const d = doc.data();
        salesList.innerHTML += `
          <div>
            ${new Date(d.date).toLocaleDateString()} — 
            ${d.buyerName} (${d.buyerPhone}) — 
            ${d.amount} грн
          </div>
        `;
      });
    });
  }

  /* ================= ВИТРАТИ ================= */

  function renderExpenses() {
    content.innerHTML = `
      <h2>Витрати</h2>
      <input id="expenseSum" type="number" placeholder="Сума">
      <button id="saveExpense">Зберегти</button>
      <div id="expensesList"></div>
    `;

    document.getElementById("saveExpense").onclick = async () => {
      const sum = Number(expenseSum.value);
      if (!sum) return;

      await addDoc(expensesRef, {
        sum,
        date: new Date().toISOString()
      });

      expenseSum.value = "";
    };

    onSnapshot(expensesRef, snap => {
      expensesList.innerHTML = "";
      snap.forEach(doc => {
        const d = doc.data();
        expensesList.innerHTML += `
          <div>${new Date(d.date).toLocaleDateString()} — ${d.sum} грн</div>
        `;
      });
    });
  }

  document.getElementById("tabSales").onclick = renderSales;
  document.getElementById("tabExpenses").onclick = renderExpenses;

  renderSales();
}
