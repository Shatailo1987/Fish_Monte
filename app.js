import {
  collection,
  addDoc,
  onSnapshot,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { initAuth } from "./js/auth.js";
import { renderSales } from "./js/sales.js";
import { renderExpenses } from "./js/expenses.js";
import { renderAnalytics } from "./js/analytics.js";

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

initAuth(auth, initApp);

function initApp(user) {

  const salesRef = collection(db, "users", user.uid, "sales");
  const buyersRef = collection(db, "users", user.uid, "buyers");
  const expensesRef = collection(db, "users", user.uid, "expenses");

 app.innerHTML = `
<button id="tabSales">Продажі</button>
<button id="tabExpenses">Витрати</button>
<button id="tabAnalytics">Аналітика</button>
<button id="logoutBtn">Вийти</button>
<hr>
<div id="content"></div>
`;

const content = document.getElementById("content");

document.getElementById("tabSales").onclick =
() => renderSales(content, buyersRef, salesRef, getDocs, addDoc, onSnapshot);

document.getElementById("tabExpenses").onclick =
() => renderExpenses(content, expensesRef, salesRef, getDocs, addDoc, onSnapshot);

document.getElementById("tabAnalytics").onclick =
() => renderAnalytics(content, salesRef, expensesRef, getDocs);

  renderSales(content, buyersRef, salesRef, getDocs, addDoc, onSnapshot);

  // ================= ДИНАМІЧНІ ПОЛЯ =================
  expenseCategory.onchange = () => {

    const cat = expenseCategory.value;
    dynamicFields.innerHTML = "";

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

    // Розрахунок кількості
    if (totalKg > 0 && avgG > 0) {
      quantity.value = Math.round((totalKg * 1000) / avgG);
    } else {
      quantity.value = "";
    }

    // Розрахунок суми
    sumInput.value = Math.round(totalKg * price);
  }

  totalWeight.oninput = calculate;
  avgWeight.oninput = calculate;
  pricePerKg.oninput = calculate;
}

    if (cat === "Зарплата Рибаки") {

  dynamicFields.innerHTML = `
    <input id="workerName" placeholder="ПІБ рибалки">

    <select id="salaryType">
      <option value="fixed">Фіксована сума</option>
      <option value="percent">% від продажів (на сьогодні)</option>
    </select>

    <div id="salaryInputBlock"></div>

    <label style="display:block;margin-top:10px;">
      <input type="checkbox" id="fuelCheckbox">
      Компенсація пального
    </label>

    <div id="fuelBlock"></div>

    <input id="sum" type="hidden">

    <input id="comment" placeholder="Коментар (необов'язково)">
  `;

  const salaryType = document.getElementById("salaryType");
  const salaryInputBlock = document.getElementById("salaryInputBlock");
  const fuelCheckbox = document.getElementById("fuelCheckbox");
  const fuelBlock = document.getElementById("fuelBlock");
  const sumInput = document.getElementById("sum");

  let baseSalary = 0;
  let fuelAmount = 0;

  function updateTotal() {
    sumInput.value = baseSalary + fuelAmount;
  }

  async function calculatePercent(percent) {
    const snap = await getDocs(salesRef);
    let totalSales = 0;

    snap.forEach(doc => {
      totalSales += doc.data().totalSum || 0;
    });

    baseSalary = Math.round((totalSales * percent) / 100);
    updateTotal();
  }

 function renderSalaryInput() {

  if (salaryType.value === "fixed") {

    salaryInputBlock.innerHTML = `
      <input id="fixedSum" type="number" placeholder="Введіть суму">
    `;

    const fixedInput = document.getElementById("fixedSum");

    fixedInput.addEventListener("input", () => {
      baseSalary = Number(fixedInput.value) || 0;
      updateTotal();
    });

  }

  if (salaryType.value === "percent") {

    salaryInputBlock.innerHTML = `
      <input id="percentValue" type="number" placeholder="% від продажів">
    `;

    const percentInput = document.getElementById("percentValue");

    percentInput.addEventListener("input", async () => {
      const percent = Number(percentInput.value) || 0;
      await calculatePercent(percent);
      updateTotal();
    });

  }

}

  renderSalaryInput();
  salaryType.onchange = renderSalaryInput;

  fuelCheckbox.onchange = () => {
    if (fuelCheckbox.checked) {
      fuelBlock.innerHTML = `
        <input id="fuelAmount" type="number" placeholder="Сума за пальне">
      `;

      document.getElementById("fuelAmount").oninput = e => {
        fuelAmount = Number(e.target.value) || 0;
        updateTotal();
      };

    } else {
      fuelBlock.innerHTML = "";
      fuelAmount = 0;
      updateTotal();
    }
  };
}
    
    if (["Пальне", "Ремонт", "Інше"].includes(cat)) {
  dynamicFields.innerHTML = `
    <input id="name" placeholder="Опис">
    <input id="sum" type="number" placeholder="Сума">
  `;
    }
  };

  // ================= ЗБЕРЕЖЕННЯ =================
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
      
      if (["Пальне", "Ремонт", "Інше"].includes(cat)) {
  data.name = document.getElementById("name")?.value || "";
}
      
      if (cat === "Корм") {
        data.subType = document.getElementById("subType")?.value || "";
        data.weight = Number(document.getElementById("weight")?.value) || 0;
        data.grainType = document.getElementById("grainType")?.value || "";
      }

if (cat === "Зарибок") {
  data.fishType = document.getElementById("fishType")?.value || "";
  data.totalWeight = Number(document.getElementById("totalWeight")?.value) || 0;  // ← ОСЬ ЦЕГО НЕ БУЛО
  data.avgWeight = Number(document.getElementById("avgWeight")?.value) || 0;
  data.quantity = Number(document.getElementById("quantity")?.value) || 0;
  data.pricePerKg = Number(document.getElementById("pricePerKg")?.value) || 0;
}

     if (cat === "Зарплата Рибаки") {
  data.workerName = document.getElementById("workerName")?.value || "";
  data.salaryType = document.getElementById("salaryType")?.value || "";
  data.comment = document.getElementById("comment")?.value || "";

  if (data.salaryType === "fixed") {
    data.fixedSum = Number(document.getElementById("fixedSum")?.value) || 0;
  }

  if (data.salaryType === "percent") {
    data.percentValue = Number(document.getElementById("percentValue")?.value) || 0;
  }

 data.fuelCompensation = document.getElementById("fuelCheckbox")?.checked || false;

const fuelField = document.getElementById("fuelAmount");
data.fuelAmount = data.fuelCompensation && fuelField ? Number(fuelField.value) : 0;
}

if (cat === "Зарплата Рибаки") {
  data.sum = baseSalary + fuelAmount;
}

await addDoc(expensesRef, data);

    } catch (err) {
      console.error(err);
      alert("Помилка збереження");
    }
  };

  // ================= SNAPSHOT =================
 onSnapshot(expensesRef, snap => {

  expensesList.innerHTML = "";
  let totalFuelCompensation = 0;
  let totalSalary = 0;
  let total = 0;

    const docs = [];
    snap.forEach(doc => {
      docs.push({ id: doc.id, ...doc.data() });
    });

    docs.sort((a,b) => new Date(b.date) - new Date(a.date));

    docs.forEach(d => {

      total += d.sum || 0;

      let details = "";

      if (["Пальне", "Ремонт", "Інше"].includes(d.category)) {
  details = `
    Опис: ${d.name || "-"}<br>
  `;
}

      if (d.category === "Корм") {
        if (d.subType === "Зерно" || d.subType === "Відходи") {
          details = `Тип: ${d.subType} (${d.grainType || "-"})<br>
                     Вага: ${d.weight || 0} кг`;
        } else {
          details = `Тип: ${d.subType}<br>
                     Вага: ${d.weight || 0} кг`;
        }
      }

      if (d.category === "Зарибок") {
        details = `
  Вид: ${d.fishType}<br>
  Загальна вага: ${d.totalWeight || 0} кг<br>
  Середня вага: ${d.avgWeight || 0} г<br>
  Кількість: ${d.quantity || 0} шт
`;
      }

if (d.category === "Зарплата Рибаки") {

if (d.salaryType === "fixed") {
    totalSalary += d.fixedSum || 0;
}

if (d.salaryType === "percent") {
    totalSalary += d.sum || 0;
}

if (d.fuelCompensation) {
    totalFuelCompensation += d.fuelAmount || 0;
}
        
let salaryText = "";

if (d.salaryType === "fixed") {
  salaryText = "Зарплата: " + (d.fixedSum || 0) + " грн";
}

if (d.salaryType === "percent") {
  salaryText = d.percentValue + "% від продажів";
}

details = `
  Рибалка: ${d.workerName}<br>
  ${salaryText}<br>
  ${d.fuelCompensation ? "Пальне: " + d.fuelAmount + " грн<br>" : ""}
  ${d.comment ? "Коментар: " + d.comment : ""}
`;
}
      
      expensesList.innerHTML += `
        <div style="border:1px solid #ccc; padding:10px; margin:6px 0; border-radius:6px;">
          <b>${new Date(d.date).toLocaleDateString()}</b><br>
         Категорія: <b style="color:#2c7">${d.category}</b><br>
          ${details}
          <br>
          Сума: <b>${d.sum} грн</b>
          <br><br>
          <button onclick="deleteExpense('${d.id}')">🗑 Видалити</button>
        </div>
      `;
    });

  totalExpenses.innerText = total;
  document.getElementById("totalFuel").innerText = totalFuelCompensation;
  document.getElementById("totalSalary").innerText = totalSalary;
  });

}
  
} 
