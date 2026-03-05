export async function renderAnalytics(content, salesRef, expensesRef, getDocs){

content.innerHTML = `
<h2>Аналітика</h2>

<div style="margin-bottom:15px;">
Фільтр періоду:
<select id="periodFilter">
<option value="all">Весь час</option>
<option value="today">Сьогодні</option>
<option value="week">7 днів</option>
<option value="month">30 днів</option>
</select>
</div>

<div class="dashboard">
<div class="card stat">
<div class="statTitle">Продажі</div>
<div class="statValue" id="statSalesSum">0</div>
</div>

<div class="card stat">
<div class="statTitle">Витрати</div>
<div class="statValue" id="statExpensesSum">0</div>
</div>

<div class="card stat">
<div class="statTitle">Прибуток</div>
<div class="statValue" id="statProfit">0</div>
</div>
</div>

<h3>Продажі по рибі</h3>
<canvas id="fishChart" height="120"></canvas>

<h3>Виручка по днях</h3>
<canvas id="salesChart" height="120"></canvas>
`;

const filter = document.getElementById("periodFilter");

filter.addEventListener("change", loadData);

loadData();

async function loadData(){

const salesSnap = await getDocs(salesRef);
const expSnap = await getDocs(expensesRef);

const now = new Date();

let sales = [];
let expenses = [];

salesSnap.forEach(d=>{
sales.push(d.data());
});

expSnap.forEach(d=>{
expenses.push(d.data());
});

if(filter.value !== "all"){

sales = sales.filter(s=>{
const date = new Date(s.date);
return checkPeriod(date);
});

expenses = expenses.filter(e=>{
const date = new Date(e.date);
return checkPeriod(date);
});

}

function checkPeriod(date){

if(filter.value==="today"){

return date.toDateString() === now.toDateString();

}

if(filter.value==="week"){

const diff = (now-date)/(1000*60*60*24);
return diff <= 7;

}

if(filter.value==="month"){

const diff = (now-date)/(1000*60*60*24);
return diff <= 30;

}

return true;

}

let salesSum = 0;
let fishStats = {};
let daily = {};

sales.forEach(s=>{

salesSum += s.totalSum || 0;

const date = new Date(s.date).toLocaleDateString();

if(!daily[date]) daily[date] = 0;
daily[date] += s.totalSum || 0;

s.items.forEach(i=>{

if(!fishStats[i.fish]) fishStats[i.fish] = 0;

fishStats[i.fish] += i.kg;

});

});

let expensesSum = 0;

expenses.forEach(e=>{
expensesSum += e.sum || 0;
});

const profit = salesSum - expensesSum;

document.getElementById("statSalesSum").innerText = salesSum + " грн";
document.getElementById("statExpensesSum").innerText = expensesSum + " грн";
document.getElementById("statProfit").innerText = profit + " грн";


const fishLabels = Object.keys(fishStats);
const fishData = Object.values(fishStats);

const fishCtx = document.getElementById("fishChart");

if(window.fishChart) window.fishChart.destroy();

window.fishChart = new Chart(fishCtx,{
type:"bar",
data:{
labels:fishLabels,
datasets:[{
label:"Кг",
data:fishData
}]
},
options:{responsive:true}
});


const labels = Object.keys(daily);
const data = Object.values(daily);

const salesCtx = document.getElementById("salesChart");

if(window.salesChart) window.salesChart.destroy();

window.salesChart = new Chart(salesCtx,{
type:"line",
data:{
labels:labels,
datasets:[{
label:"Виручка",
data:data,
borderWidth:3,
tension:0.3
}]
},
options:{responsive:true}
});

}

}
