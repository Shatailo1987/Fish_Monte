export async function renderAnalytics(content, salesRef, expensesRef, getDocs) {

content.innerHTML = `
<h2>Аналітика господарства</h2>

<div style="border:1px solid #ccc;padding:10px;margin:5px;">
💰 Виручка: <b id="income">0</b> грн
</div>

<div style="border:1px solid #ccc;padding:10px;margin:5px;">
📉 Витрати: <b id="expenses">0</b> грн
</div>

<div style="border:1px solid #ccc;padding:10px;margin:5px;">
📈 Прибуток: <b id="profit">0</b> грн
</div>

<div style="border:1px solid #ccc;padding:10px;margin:5px;">
🐟 Продано риби: <b id="soldKg">0</b> кг
</div>

<div style="border:1px solid #ccc;padding:10px;margin:5px;">
💲 Середня ціна кг: <b id="avgPrice">0</b> грн
</div>
`;

let income = 0;
let expenses = 0;
let soldKg = 0;

const salesSnap = await getDocs(salesRef);

salesSnap.forEach(doc => {

const d = doc.data();

income += d.totalSum || 0;
soldKg += d.totalKg || 0;

});

const expensesSnap = await getDocs(expensesRef);

expensesSnap.forEach(doc => {

const d = doc.data();
expenses += d.sum || 0;

});

const profit = income - expenses;
const avgPrice = soldKg ? Math.round(income / soldKg) : 0;

document.getElementById("income").innerText = income;
document.getElementById("expenses").innerText = expenses;
document.getElementById("profit").innerText = profit;
document.getElementById("soldKg").innerText = soldKg;
document.getElementById("avgPrice").innerText = avgPrice;

}
