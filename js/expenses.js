export function renderExpenses(content, expensesRef, salesRef, getDocs, addDoc, onSnapshot) {

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
<div><b>Компенсація пального: <span id="totalFuel">0</span> грн</b></div>
<div><b>Зарплата рибалкам: <span id="totalSalary">0</span> грн</b></div>
`;

const expenseCategory = document.getElementById("expenseCategory");
const dynamicFields = document.getElementById("dynamicFields");
const expensesList = document.getElementById("expensesList");
const totalExpenses = document.getElementById("totalExpenses");

expenseCategory.onchange = () => {

const cat = expenseCategory.value;
dynamicFields.innerHTML = "";

if (["Пальне","Ремонт","Інше"].includes(cat)){

dynamicFields.innerHTML=`
<input id="name" placeholder="Опис">
<input id="sum" type="number" placeholder="Сума">
`;

}

};

document.getElementById("saveExpense").onclick = async ()=>{

const cat = expenseCategory.value;

if(!cat) return alert("Оберіть категорію");

const sum = Number(document.getElementById("sum")?.value);

if(!sum) return alert("Вкажіть суму");

let data = {
category:cat,
sum:sum,
date:new Date().toISOString()
};

data.name = document.getElementById("name")?.value || "";

await addDoc(expensesRef,data);

};

onSnapshot(expensesRef,snap=>{

let total = 0;

expensesList.innerHTML="";

snap.forEach(doc=>{

const d = doc.data();

total += d.sum || 0;

expensesList.innerHTML += `
<div style="border:1px solid #ccc;padding:10px;margin:6px 0;">
<b>${new Date(d.date).toLocaleDateString()}</b><br>
Категорія: ${d.category}<br>
Опис: ${d.name || "-"}<br>
Сума: <b>${d.sum}</b> грн
</div>
`;

});

totalExpenses.innerText = total;

});

}
