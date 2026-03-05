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

<h3>Продажі риби по днях</h3>
<canvas id="fishDailyChart" height="120"></canvas>

<h3>Прибуток по днях</h3>
<canvas id="profitDailyChart" height="120"></canvas>

<h3>Кг риби по днях</h3>
<canvas id="fishKgDailyChart" height="120"></canvas>
`;

const filter = document.getElementById("periodFilter");
filter.addEventListener("change", loadData);

loadData();

async function loadData(){

const salesSnap = await getDocs(salesRef);
const expSnap = await getDocs(expensesRef);

let sales = [];
let expenses = [];

salesSnap.forEach(d=>sales.push(d.data()));
expSnap.forEach(d=>expenses.push(d.data()));

let salesSum = 0;
let expensesSum = 0;

let fishStats = {};
let daily = {};
let fishDaily = {};
let profitDaily = {};
let fishKgDaily = {};

/* ПРОДАЖІ */

sales.forEach(s=>{

salesSum += s.totalSum || 0;

const date = new Date(s.date).toLocaleDateString();

if(!daily[date]) daily[date] = 0;
daily[date] += s.totalSum || 0;

if(!profitDaily[date]) profitDaily[date] = 0;
profitDaily[date] += s.totalSum || 0;

s.items.forEach(i=>{

if(!fishStats[i.fish]) fishStats[i.fish] = 0;
fishStats[i.fish] += i.kg;

/* кг по днях */

if(!fishKgDaily[date]){
fishKgDaily[date] = {};
}

if(!fishKgDaily[date][i.fish]){
fishKgDaily[date][i.fish] = 0;
}

fishKgDaily[date][i.fish] += i.kg;

/* існуючий код */

if(!fishDaily[date]) fishDaily[date] = {};

if(!fishDaily[date][i.fish]){
fishDaily[date][i.fish] = {kg:0,sum:0};
}

fishDaily[date][i.fish].kg += i.kg;
fishDaily[date][i.fish].sum += i.sum;

});

});

/* ВИТРАТИ */

expenses.forEach(e=>{

expensesSum += e.sum || 0;

const date = new Date(e.date).toLocaleDateString();

if(!profitDaily[date]) profitDaily[date] = 0;
profitDaily[date] -= e.sum || 0;

});

const profit = salesSum - expensesSum;

document.getElementById("statSalesSum").innerText = salesSum + " грн";
document.getElementById("statExpensesSum").innerText = expensesSum + " грн";
document.getElementById("statProfit").innerText = profit + " грн";

/* ГРАФІК РИБИ */

const fishLabels = Object.keys(fishStats);
const fishData = Object.values(fishStats);

const fishCtx = document.getElementById("fishChart");

if (window.fishChart && typeof window.fishChart.destroy === "function") {
window.fishChart.destroy();
}

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

/* ВИРУЧКА */

const labels = Object.keys(daily);
const data = Object.values(daily);

const salesCtx = document.getElementById("salesChart");

if (window.fishDailyChart && typeof window.fishDailyChart.destroy === "function") {
window.fishDailyChart.destroy();
}

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

/* ПРОДАЖІ РИБИ ПО ДНЯХ */

const fishDates = Object.keys(fishDaily);

const fishMoney = fishDates.map(d=>{
let total = 0;
Object.values(fishDaily[d]).forEach(f=>total += f.sum);
return total;
});

const fishDailyCtx = document.getElementById("fishDailyChart");

if(window.fishDailyChart) window.fishDailyChart.destroy();

window.fishDailyChart = new Chart(fishDailyCtx,{
type:"bar",
data:{
labels:fishDates,
datasets:[{
label:"Продажі риби (грн)",
data:fishMoney
}]
},
options:{responsive:true}
});

/* ПРИБУТОК */

const profitLabels = Object.keys(profitDaily);
const profitData = Object.values(profitDaily);

const profitCtx = document.getElementById("profitDailyChart");

if (window.profitDailyChart && typeof window.profitDailyChart.destroy === "function") {
window.profitDailyChart.destroy();
}

window.profitDailyChart = new Chart(profitCtx,{
type:"line",
data:{
labels:profitLabels,
datasets:[{
label:"Прибуток (грн)",
data:profitData,
borderWidth:3,
tension:0.3
}]
},
options:{responsive:true}
});

/* КГ РИБИ ПО ДНЯХ */

const kgDates = Object.keys(fishKgDaily);

const fishTypes = ["Короп","Амур","Товстолоб","Карась","Щука","Окунь"];

const datasets = fishTypes.map(fish=>{
return {
label: fish,
data: kgDates.map(d=>{
return fishKgDaily[d][fish] || 0;
})
};
});

const kgCtx = document.getElementById("fishKgDailyChart");

if (window.fishKgDailyChart && typeof window.fishKgDailyChart.destroy === "function") {
window.fishKgDailyChart.destroy();
}

window.fishKgDailyChart = new Chart(kgCtx,{
type:"line",
data:{
labels:kgDates,
datasets:datasets
},
options:{
responsive:true,
interaction:{mode:"index",intersect:false}
}
});

}

}
