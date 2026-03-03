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

  // ===== ДИНАМІЧНІ ПОЛЯ =====
  expenseCategory.onchange = () => {

    const cat = expenseCategory.value;
    dynamicFields.innerHTML = "";

    // ---- КОРМ ----
    if (cat === "Корм") {
      dynamicFields.innerHTML = `
        <select id="subType">
          <option value="">-- Тип корму --</option>
          <option>Комбікорм</option>
          <option>Зерно</option>
          <option>Відходи</option>
          <option>Доставка</option>
        </select>

        <div id="grainBlock"></div>

        <input id="name" placeholder="Назва">
        <input id="weight" type="number" placeholder="Вага (кг)">
        <input id="sum" type="number" placeholder="Сума">
      `;

      const subType = document.getElementById("subType");
      const grainBlock = document.getElementById("grainBlock");

      subType.onchange = () => {
        if (subType.value === "Зерно" || subType.value === "Відходи") {
          grainBlock.innerHTML = `
            <select id="grainType">
              <option value="">-- Оберіть зерно --</option>
              <option>Ячмінь</option>
              <option>Пшениця</option>
              <option>Кукурудза</option>
              <option>Соняшник</option>
              <option>Сорго</option>
              <option>Гречка</option>
              <option>Горох</option>
              <option>Пшоно</option>
            </select>
          `;
        } else {
          grainBlock.innerHTML = "";
        }
      };
    }

    // ---- ЗАРИБОК ----
    if (cat === "Зарибок") {
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

        <input id="quantity" type="number" placeholder="Кількість (шт)">
        <input id="avgWeight" type="number" placeholder="Середня вага (г)">
        <input id="pricePerKg" type="number" placeholder="Ціна за кг">
        <input id="sum" type="number" placeholder="Сума" readonly>
      `;

      const quantity = document.getElementById("quantity");
      const avgWeight = document.getElementById("avgWeight");
      const pricePerKg = document.getElementById("pricePerKg");
      const sumInput = document.getElementById("sum");

      function calculateSum() {
        const qty = Number(quantity.value) || 0;
        const weight = Number(avgWeight.value) || 0;
        const price = Number(pricePerKg.value) || 0;
        const totalKg = (qty * weight) / 1000;
        sumInput.value = Math.round(totalKg * price);
      }

      quantity.oninput = calculateSum;
      avgWeight.oninput = calculateSum;
      pricePerKg.oninput = calculateSum;
    }

    // ---- ПАЛЬНЕ / РЕМОНТ / ІНШЕ ----
    if (["Пальне", "Ремонт", "Інше", "Зарплата Рибаки"].includes(cat)) {
      dynamicFields.innerHTML = `
        <input id="name" placeholder="Опис">
        <input id="sum" type="number" placeholder="Сума">
      `;
    }
  };

  // ===== ЗБЕРЕЖЕННЯ =====
  document.getElementById("saveExpense").onclick = async () => {

    try {

      const cat = expenseCategory.value;
      if (!cat) {
        alert("Оберіть категорію");
        return;
      }

      const sum = Number(document.getElementById("sum")?.value);
      if (!sum || sum <= 0) {
        alert("Вкажіть суму");
        return;
      }

      let data = {
        category: cat,
        sum: sum,
        date: new Date().toISOString()
      };

      if (cat === "Корм") {
        data.subType = document.getElementById("subType")?.value || "";
        data.name = document.getElementById("name")?.value || "";
        data.weight = Number(document.getElementById("weight")?.value) || 0;
        data.grainType = document.getElementById("grainType")?.value || "";
      }

      if (cat === "Зарибок") {
        data.fishType = document.getElementById("fishType")?.value || "";
        data.quantity = Number(document.getElementById("quantity")?.value) || 0;
        data.avgWeight = Number(document.getElementById("avgWeight")?.value) || 0;
        data.pricePerKg = Number(document.getElementById("pricePerKg")?.value) || 0;
      }

      if (["Пальне", "Ремонт", "Інше", "Зарплата Рибаки"].includes(cat)) {
        data.name = document.getElementById("name")?.value || "";
      }

      await addDoc(expensesRef, data);

    } catch (err) {
      console.error("FIRESTORE ERROR:", err);
      alert("Помилка збереження");
    }
  };

  // ===== SNAPSHOT =====
onSnapshot(expensesRef, snap => {

  expensesList.innerHTML = "";
  let total = 0;

  // Отримуємо масив і сортуємо нові зверху
  const docs = [];
  snap.forEach(doc => {
    docs.push({ id: doc.id, ...doc.data() });
  });

  docs.sort((a,b) => new Date(b.date) - new Date(a.date));

  docs.forEach(d => {

    total += d.sum || 0;

    expensesList.innerHTML += `
      <div style="border:1px solid #ccc; padding:10px; margin:6px 0; border-radius:6px;">
        <b>${new Date(d.date).toLocaleDateString()}</b><br>
        Категорія: ${d.category}<br>
        Сума: <b>${d.sum} грн</b>
        <br><br>
        <button onclick="deleteExpense('${d.id}')">🗑 Видалити</button>
      </div>
    `;
  });

  totalExpenses.innerText = total;
});
window.deleteExpense = async function(id) {

  if (!confirm("Видалити запис?")) return;

  const { deleteDoc, doc } = await import(
    "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js"
  );

  await deleteDoc(doc(db, "users", auth.currentUser.uid, "expenses", id));
};
}
}
