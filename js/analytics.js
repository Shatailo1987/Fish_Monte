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
let fishDaily = {};
let profitDaily = {};

sales.forEach(s=>{

salesSum += s.totalSum || 0;

const date = new Date(s.date).toLocaleDateString();

if(!fishDaily[date]) fishDaily[date] = {};

s.items.forEach(i=>{

if(!fishDaily[date][i.fish]){
fishDaily[date][i.fish] = {
kg:0,
sum:0
};
}

fishDaily[date][i.fish].kg += i.kg;
fishDaily[date][i.fish].sum += i.sum;

});

if(!profitDaily[date]) profitDaily[date] = 0;
profitDaily[date] += s.totalSum || 0;

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

const date = new Date(e.date).toLocaleDateString();

if(!profitDaily[date]) profitDaily[date] = 0;

profitDaily[date] -= e.sum || 0;
});

const profit = salesSum - expensesSum;

document.getElementById("statSalesSum").innerText = salesSum + " грн";
document.getElementById("statExpensesSum").innerText = expensesSum + " грн";
document.getElementById("statProfit").innerText = profit + " грн";


const fishLabels = Object.keys(fishStats);
const fishData = Object.values(fishStats);

const fishCtx = document.getElementById("fishChart");

if(window.fishChart && typeof window.fishChart.destroy === "function"){
window.fishChart.destroy();

  const fishDates = Object.keys(fishDaily);

const fishMoney = fishDates.map(d=>{

let total = 0;

Object.values(fishDaily[d]).forEach(f=>{
total += f.sum;
});

return total;

});

const fishDailyCtx = document.getElementById("fishDailyChart");

if(window.fishDailyChart && typeof window.fishDailyChart.destroy === "function"){
window.fishDailyChart.destroy();
}

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

  const profitLabels = Object.keys(profitDaily);
const profitData = Object.values(profitDaily);

const profitCtx = document.getElementById("profitDailyChart");

if(window.profitDailyChart && typeof window.profitDailyChart.destroy === "function"){
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


const labels = Object.keys(daily);
const data = Object.values(daily);

const salesCtx = document.getElementById("salesChart");

if(window.salesChart && typeof window.salesChart.destroy === "function"){
window.salesChart.destroy();
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

}

}
