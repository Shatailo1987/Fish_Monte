export async function renderSales(content, buyersRef, salesRef, getDocs, addDoc, onSnapshot, deleteDoc, doc, updateDoc) {

let buyers = [];
let weights = [];
let items = [];
let editingSaleId = null;
let editingItemIndex = null;

const buyersSnap = await getDocs(buyersRef);
buyersSnap.forEach(d => buyers.push(d.data()));

content.innerHTML = `
<h2>Продаж</h2>

<select id="buyerSelect">
<option value="">-- Обрати покупця --</option>
${buyers.map(b => `<option value="${b.phone}">${b.name} (${b.phone})</option>`).join("")}
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
<h3>Історія продажів</h3>

<div style="margin-bottom:10px">

З:
<input type="date" id="dateFrom">

По:
<input type="date" id="dateTo">

<button id="filterSales">Фільтр</button>

</div>

<div id="salesList"></div>
`;

const buyerSelect = document.getElementById("buyerSelect");
const newName = document.getElementById("newName");
const newPhone = document.getElementById("newPhone");

const fishType = document.getElementById("fishType");
const weightInput = document.getElementById("weightInput");
const addWeightBtn = document.getElementById("addWeight");

const weightsList = document.getElementById("weightsList");
const totalKg = document.getElementById("totalKg");

const priceInput = document.getElementById("priceInput");
const addFishBtn = document.getElementById("addFish");

const itemsList = document.getElementById("itemsList");
const totalSum = document.getElementById("totalSum");

const saveSaleBtn = document.getElementById("saveSale");
const salesList = document.getElementById("salesList");
const dateFrom = document.getElementById("dateFrom");
const dateTo = document.getElementById("dateTo");
const filterBtn = document.getElementById("filterSales");

function renderWeights(){

weightsList.innerHTML =
weights.map((w,i)=>`
<div>
${fishType.value}

<input 
type="number"
value="${w}"
style="width:80px"
onchange="updateWeight(${i}, this.value)"
> кг
</div>
`).join("");

window.updateWeight = function(index,value){
weights[index] = Number(value);
renderWeights();
}

totalKg.innerText =
weights.length ? weights.reduce((a,b)=>a+b,0) : 0;

}

addWeightBtn.addEventListener("click", () => {

const w = Number(weightInput.value);

if(!w) return;

weights.push(w);

weightInput.value = "";

renderWeights();

});

function renderItems(){

itemsList.innerHTML = items.map((i,index) => `
<div style="border:1px solid #ccc;padding:6px;margin:4px 0;">

<div style="display:flex;justify-content:space-between;align-items:center">

<div onclick="selectItem(${index})" style="cursor:pointer">

<b>${i.fish}</b><br>

${i.weights.join(" + ")} = ${i.kg} кг<br>

${i.kg} × ${i.price} = ${i.sum} грн

</div>

<button onclick="deleteItem(${index})">❌</button>

</div>

</div>
`).join("");

totalSum.innerText =
items.reduce((a,b)=>a+b.sum,0);

}

window.selectItem = function(index){

editingItemIndex = index;

const item = items[index];

fishType.value = item.fish;
priceInput.value = item.price;

weights = [...item.weights];

renderWeights();

}

window.deleteItem = function(index){

const fish = items[index].fish;

if(!confirm("Видалити " + fish + " з продажу?")) return;

items.splice(index,1);

renderItems();

}

addFishBtn.addEventListener("click", () => {

if(!weights.length) return;

const kg = weights.reduce((a,b)=>a+b,0);
const price = Number(priceInput.value);
const fish = fishType.value;

if(editingItemIndex !== null){

items[editingItemIndex] = {
fish,
weights:[...weights],
kg,
price,
sum:kg*price
};

editingItemIndex = null;

}else{

items.push({
fish,
weights:[...weights],
kg,
price,
sum:kg*price
});

}

weights = [];

renderWeights();
renderItems();

});

saveSaleBtn.addEventListener("click", async () => {

const selectedPhone = buyerSelect.value;
const newNameVal = newName.value.trim();
const newPhoneVal = newPhone.value.trim();

if(!items.length) return;

let buyerName="";
let buyerPhone="";

if(selectedPhone){

const b = buyers.find(x=>x.phone===selectedPhone);

buyerName=b.name;
buyerPhone=b.phone;

}else{

if(!newNameVal || !newPhoneVal){
alert("Вкажіть імʼя та телефон");
return;
}

await addDoc(buyersRef,{
name:newNameVal,
phone:newPhoneVal
});

buyerName=newNameVal;
buyerPhone=newPhoneVal;

}

const saleData = {
buyerName,
buyerPhone,
items,
totalKg:items.reduce((a,b)=>a+b.kg,0),
totalSum:items.reduce((a,b)=>a+b.sum,0),
date:new Date().toISOString()
};

if(editingSaleId !== null){

await updateDoc(doc(salesRef, editingSaleId), saleData);
editingSaleId = null;

}else{

await addDoc(salesRef, saleData);

}

items=[];

renderItems();
renderWeights();
priceInput.value = "";
weightInput.value = "";
fishType.selectedIndex = 0;

});

onSnapshot(salesRef,snap=>{

salesList.innerHTML="";

let totalKg = 0;
let totalMoney = 0;
let count = 0;

snap.forEach(d=>{

const data = d.data();

totalKg += data.totalKg || 0;
totalMoney += data.totalSum || 0;
count++;

salesList.innerHTML += `
<details style="border:1px solid #999;margin:5px;padding:5px;">

<summary>
${new Date(data.date).toLocaleDateString()} —
${data.buyerName} (${data.buyerPhone}) —
${data.totalKg} кг —
${data.totalSum} грн
</summary>

<div style="margin:5px 0;">
<button onclick="editSale('${d.id}')">✏️ Редагувати</button>
<button onclick="deleteSale('${d.id}')">🗑 Видалити</button>
</div>

${data.items.map(i => `

<div style="margin-left:10px;">
${i.fish}:
${i.weights.join(" + ")}
= ${i.kg} кг
(наважок: ${i.weights.length})
</div>

`).join("")}

</details>
`;

});

const kgEl = document.getElementById("statKg");
const moneyEl = document.getElementById("statMoney");
const salesEl = document.getElementById("statSales");

if(kgEl) kgEl.innerText = totalKg;
if(moneyEl) moneyEl.innerText = totalMoney + " грн";
if(salesEl) salesEl.innerText = count;

});

window.deleteSale = async function(id){

if(!confirm("Видалити цей продаж?")) return;

await deleteDoc(doc(salesRef, id));

}
  
window.editSale = async function(id){

editingSaleId = id;
editingItemIndex = null;

const snap = await getDocs(salesRef);

snap.forEach(d=>{
if(d.id === id){

const data = d.data();

/* завантажуємо всі позиції */
items = data.items || [];

/* очищаємо форму */
weights = [];
priceInput.value = "";
renderWeights();
renderItems();

/* показуємо першу рибу для редагування */
if(items.length){

fishType.value = items[0].fish;
priceInput.value = items[0].price;
weights = [...items[0].weights];

renderWeights();

}

}
});

};
}
