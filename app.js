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

  app.innerHTML = `
    <button id="tabSales">Продажі</button>
    <button id="tabExpenses">Витрати</button>
    <button id="logoutBtn">Вийти</button>
    <hr>
    <div id="content"></div>
  `;

  document.getElementById("logoutBtn").onclick = () => signOut(auth);
  document.getElementById("tabSales").onclick = renderSales;
  document.getElementById("tabExpenses").onclick = renderExpenses;

  const content = document.getElementById("content");

  renderSales();

  /* ===================== ПРОДАЖІ 3.0 ===================== */

  async function renderSales() {

    let buyers = [];
    let weights = [];
    let items = [];

    const buyersSnap = await getDocs(buyersRef);
    buyersSnap.forEach(d => buyers.push(d.data()));

    content.innerHTML = `
      <h2>Продаж</h2>

      <select id="buyerSelect">
        <option value="">-- Обрати покупця --</option>
        ${buyers.map(b =>
          `<option value="${b.phone}">
            ${b.name} (${b.phone})
          </option>`).join("")}
      </select>

      <h4>Новий покупець</h4>
      <input id="newName" placeholder="Імʼя">
      <input id="newPhone" placeholder="Телефон">

      <hr>

      <select id="fishType">
        <option>Короп</option>
        <option>Амур</option>
        <option>Товстолоб</option>
        <option>Карась</option>
        <option>Щука</option>
        <option>Окунь</option>
      </select>

      <input id="weightInput" type="number" placeholder="Наважка кг">
      <button id="addWeight">Додати наважку</button>

      <div id="weightsList"></div>
      <div><b>Разом кг: <span id="totalKg">0</span></b></div>

      <input id="priceInput" type="number" placeholder="Ціна за кг">
      <button id="addFish">Додати рибу</button>

      <hr>

      <div id="itemsList"></div>
      <div><b>ЗАГАЛОМ: <span id="totalSum">0</span> грн</b></div>

      <button id="saveSale">Зберегти продаж</button>

      <hr>
      <h3>Історія</h3>
      <div id="salesList"></div>
    `;

    const renderWeights = () => {
      weightsList.innerHTML = weights.map(w => `<div>${w} кг</div>`).join("");
      totalKg.innerText = weights.reduce((a,b)=>a+b,0);
    };

    addWeight.onclick = () => {
      const w = Number(weightInput.value);
      if (!w) return;
      weights.push(w);
      weightInput.value = "";
      renderWeights();
    };

    const renderItems = () => {
      itemsList.innerHTML = items.map(i => `
        <div style="border:1px solid #ccc;padding:6px;margin:4px 0;">
          <b>${i.fish}</b><br>
          Наважки: ${i.weights.join(" + ")} = ${i.kg} кг<br>
          ${i.kg} × ${i.price} = ${i.sum} грн
        </div>
      `).join("");

      totalSum.innerText = items.reduce((a,b)=>a+b.sum,0);
    };

    addFish.onclick = () => {
      if (!weights.length) return;

      const kg = weights.reduce((a,b)=>a+b,0);
      const price = Number(priceInput.value);
      const fish = fishType.value;

      items.push({
        fish,
        weights: [...weights],
        kg,
        price,
        sum: kg * price
      });

      weights = [];
      renderWeights();
      renderItems();
    };

    saveSale.onclick = async () => {

      const selectedPhone = buyerSelect.value;
      const newNameVal = newName.value.trim();
      const newPhoneVal = newPhone.value.trim();

      if (!items.length) return;

      let buyerName = "";
      let buyerPhone = "";

      if (selectedPhone) {
        const b = buyers.find(x => x.phone === selectedPhone);
        buyerName = b.name;
        buyerPhone = b.phone;
      } else {

        if (!newNameVal || !newPhoneVal) {
          alert("Вкажіть імʼя та телефон");
          return;
        }

        const phoneExists = buyers.find(x => x.phone === newPhoneVal);
        if (phoneExists) {
          alert("Такий номер вже існує");
          return;
        }

        await addDoc(buyersRef, {
          name: newNameVal,
          phone: newPhoneVal
        });

        buyerName = newNameVal;
        buyerPhone = newPhoneVal;
      }

      await addDoc(salesRef, {
        buyerName,
        buyerPhone,
        items,
        totalKg: items.reduce((a,b)=>a+b.kg,0),
        totalSum: items.reduce((a,b)=>a+b.sum,0),
        date: new Date().toISOString()
      });

      items = [];
      renderItems();
      renderWeights();
    };

    onSnapshot(salesRef, snap => {
      salesList.innerHTML = "";
      snap.forEach(doc => {
        const d = doc.data();
        salesList.innerHTML += `
          <details style="border:1px solid #999;margin:5px;padding:5px;">
            <summary>
              ${new Date(d.date).toLocaleDateString()} —
              ${d.buyerName} (${d.buyerPhone}) —
              ${d.totalKg} кг —
              ${d.totalSum} грн
            </summary>
            ${d.items.map(i=>`
              <div style="margin-left:10px;">
                ${i.fish}: ${i.weights.join(" + ")} = ${i.kg} кг,
                ${i.sum} грн
              </div>
            `).join("")}
          </details>
        `;
      });
    });
  }

  /* ===================== ВИТРАТИ 3.0 ===================== */

function renderExpenses() {

  content.innerHTML = `
    <h2>Витрати</h2>

    <select id="expenseCategory">
      <option value="">-- Оберіть категорію --</option>
      <option>Корм</option>
      <option>Зарибок</option>
      <option>Пальне</option>
      <option>Зарплата Рибаки</option>
      <option>Ремонт</option>
      <option>Інше</option>
    </select>

    <div id="dynamicFields"></div>

    <button id="saveExpense">Зберегти</button>

    <hr>
    <h3>Історія витрат</h3>
    <div id="expensesList"></div>
    <div><b>ЗАГАЛЬНІ ВИТРАТИ: <span id="totalExpenses">0</span> грн</b></div>
  `;

  const expenseCategory = document.getElementById("expenseCategory");
  const dynamicFields = document.getElementById("dynamicFields");
  const expensesList = document.getElementById("expensesList");
  const totalExpenses = document.getElementById("totalExpenses");

  /* ================= ДИНАМІЧНІ ПОЛЯ ================= */

  expenseCategory.onchange = () => {

    const cat = expenseCategory.value;
    dynamicFields.innerHTML = "";

    /* ===== КОРМ ===== */
    if (cat === "Корм") {
      dynamicFields.innerHTML = `
        <input id="name" placeholder="Опис">
        <input id="weight" type="number" placeholder="Вага (кг)">
        <input id="sum" type="number" placeholder="Сума">
      `;
    }

    /* ===== ЗАРИБОК ===== */
    else if (cat === "Зарибок") {

      dynamicFields.innerHTML = `
        <select id="fishType">
          <option value="">-- Вид риби --</option>
          <option>Короп</option>
          <option>Товстолоб</option>
          <option>Білий амур</option>
          <option>Карась</option>
          <option>Щука</option>
          <option>Судак</option>
        </select>

        <input id="totalWeight" type="number" placeholder="Загальна вага (кг)">
        <input id="avgWeight" type="number" placeholder="Середня вага (г)">
        <input id="quantity" type="number" placeholder="Кількість (шт)" readonly>
        <input id="pricePerKg" type="number" placeholder="Ціна за кг">
        <input id="sum" type="number" placeholder="Сума" readonly>
      `;

      const totalWeight = document.getElementById("totalWeight");
      const avgWeight = document.getElementById("avgWeight");
      const quantity = document.getElementById("quantity");
      const pricePerKg = document.getElementById("pricePerKg");
      const sumInput = document.getElementById("sum");

      function calculate() {
        const totalKg = Number(totalWeight.value) || 0;
        const avgG = Number(avgWeight.value) || 0;
        const price = Number(pricePerKg.value) || 0;

        quantity.value = (totalKg > 0 && avgG > 0)
          ? Math.round((totalKg * 1000) / avgG)
          : "";

        sumInput.value = Math.round(totalKg * price);
      }

      totalWeight.oninput = calculate;
      avgWeight.oninput = calculate;
      pricePerKg.oninput = calculate;
    }

    /* ===== ЗАРПЛАТА РИБАКИ ===== */
    else if (cat === "Зарплата Рибаки") {

      dynamicFields.innerHTML = `
        <input id="fishermanName" placeholder="Прізвище рибака">
        <input id="salaryAmount" type="number" placeholder="Основна зарплата">

        <label>
          <input type="checkbox" id="usedOwnCar">
          Використовував власне авто
        </label>

        <input id="fuelCompensation" type="number"
               placeholder="Компенсація палива"
               disabled>

        <input id="sum" type="number"
               placeholder="Загальна сума"
               readonly>
      `;

      const salaryInput = document.getElementById("salaryAmount");
      const fuelInput = document.getElementById("fuelCompensation");
      const carCheckbox = document.getElementById("usedOwnCar");
      const sumInput = document.getElementById("sum");

      function calculateTotal() {
        const salary = Number(salaryInput.value) || 0;
        const fuel = Number(fuelInput.value) || 0;
        sumInput.value = salary + fuel;
      }

      salaryInput.oninput = calculateTotal;
      fuelInput.oninput = calculateTotal;

      carCheckbox.onchange = function () {
        fuelInput.disabled = !this.checked;
        if (!this.checked) fuelInput.value = "";
        calculateTotal();
      };
    }

    /* ===== ПРОСТІ КАТЕГОРІЇ ===== */
    else if (["Пальне", "Ремонт", "Інше"].includes(cat)) {
      dynamicFields.innerHTML = `
        <input id="name" placeholder="Опис">
        <input id="sum" type="number" placeholder="Сума">
      `;
    }
  };

  /* ================= ЗБЕРЕЖЕННЯ ================= */

  document.getElementById("saveExpense").onclick = async () => {

    try {

      const cat = expenseCategory.value;
      if (!cat) return alert("Оберіть категорію");

      const sum = Number(document.getElementById("sum")?.value);
      if (!sum || sum <= 0) return alert("Вкажіть суму");

      let data = {
        category: cat,
        sum: sum,
        date: new Date().toISOString()
      };

      if (cat === "Зарплата Рибаки") {
        data.fishermanName = document.getElementById("fishermanName")?.value || "";
        data.salaryAmount = Number(document.getElementById("salaryAmount")?.value) || 0;
        data.fuelCompensation = Number(document.getElementById("fuelCompensation")?.value) || 0;
      }

      await addDoc(expensesRef, data);

    } catch (err) {
      console.error(err);
      alert("Помилка збереження");
    }
  };

  /* ================= SNAPSHOT ================= */

  onSnapshot(expensesRef, snap => {

    expensesList.innerHTML = "";
    let total = 0;

    snap.forEach(doc => {

      const d = doc.data();
      total += d.sum || 0;

      let details = "";

      if (d.category === "Зарплата Рибаки") {
        details = `
          Рибак: ${d.fishermanName || "-"}<br>
          Зарплата: ${d.salaryAmount || 0} грн<br>
          Паливо: ${d.fuelCompensation || 0} грн
        `;
      }

      expensesList.innerHTML += `
        <div style="border:1px solid #ccc; padding:10px; margin:6px 0; border-radius:6px;">
          <b>${new Date(d.date).toLocaleDateString()}</b><br>
          Категорія: <b>${d.category}</b><br>
          ${details}
          <br>
          Сума: <b>${d.sum} грн</b>
        </div>
      `;
    });

    totalExpenses.innerText = total;
  });
}
