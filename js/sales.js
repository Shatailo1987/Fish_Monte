export async function renderSales(content, buyersRef, salesRef, getDocs, addDoc, onSnapshot, deleteDoc, doc, updateDoc) {

let buyers = [];
let weights = [];
let items = [];
let editingSaleId = null;
let editingItemIndex = null;

const buyersSnap = await getDocs(buyersRef);
buyersSnap.forEach(d => buyers.push(d.data()));
const unique = [];
const phones = new Set();

buyers.forEach(b=>{
if(!phones.has(b.phone)){
phones.add(b.phone);
unique.push(b);
}
});

buyers = unique;
  
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
<hr>
<h3>Рейтинг покупців</h3>
<div id="buyersRating"></div>
`;

const buyerSelect = document.getElementById("buyerSelect");
const newName = document.getElementById("newName");
const newPhone = document.getElementById("newPhone");

const fishType = document.getElementById("fishType");
fishType.addEventListener("change",()=>{
priceInput.value = fishPrices[fishType.value] || "";
});

const fishColors = {
"Короп":"#d1f2eb",
"Амур":"#d6eaf8",
"Товстолоб":"#fdebd0",
"Карась":"#f9e79f",
"Щука":"#fadbd8",
"Окунь":"#e8daef"
};
  
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
<div style="display:flex;align-items:center;margin:4px 0">

<span style="width:80px">${fishType.value}</span>

<input 
type="number"
value="${w}"
style="width:80px;margin-right:6px"
onchange="updateWeight(${i}, this.value)"
> кг

<button onclick="removeWeight(${i})">❌</button>

</div>
`).join("");

window.updateWeight = function(index,value){
weights[index] = Number(value);
renderWeights();
}

window.removeWeight = function(index){
weights.splice(index,1);
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

  /* перевіряємо чи покупець вже є */

const existingBuyer = buyers.find(b => b.phone === newPhoneVal);

if(existingBuyer){

    /* використовуємо існуючого */
buyerName = existingBuyer.name;
buyerPhone = existingBuyer.phone;

}else{

    /* створюємо нового */
await addDoc(buyersRef,{
name:newNameVal,
phone:newPhoneVal
});

buyerName = newNameVal;
buyerPhone = newPhoneVal;

}

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

buyerSelect.value = "";
newName.value = "";
newPhone.value = "";

renderItems();
renderWeights();
priceInput.value = "";
weightInput.value = "";
fishType.selectedIndex = 0;

});

let filterFrom = null;
let filterTo = null;

filterBtn.onclick = () => {

filterFrom = dateFrom.value ? new Date(dateFrom.value) : null;
filterTo = dateTo.value ? new Date(dateTo.value) : null;

renderSalesHistory();
  
${data.buyerName}
<span style="color:#888;cursor:pointer"
onclick="navigator.clipboard.writeText('${data.buyerPhone}')">
(${data.buyerPhone})
</span>

};

let allSales = [];

onSnapshot(salesRef,snap=>{

allSales = [];

snap.forEach(d=>{
allSales.push({
id:d.id,
...d.data()
});
});

renderSalesHistory();

});

renderBuyersRating();

function renderSalesHistory(){

salesList.innerHTML = "";

allSales.forEach(data=>{

const saleDate = new Date(data.date);

if(filterFrom && saleDate < filterFrom) return;
if(filterTo && saleDate > filterTo) return;

salesList.innerHTML += `
<details style="border:1px solid #999;margin:5px;padding:5px;">

<summary>
${saleDate.toLocaleDateString()} —
${data.buyerName} (${data.buyerPhone}) —
${data.totalKg} кг —
${data.totalSum} грн
</summary>

<div style="margin:5px 0;">
<button onclick="editSale('${data.id}')">✏️ Редагувати</button>
<button onclick="deleteSale('${data.id}')">🗑 Видалити</button>
</div>

${data.items.map(i => `

<div style="
margin:10px 0;
padding:10px;
border:1px solid #ddd;
border-radius:8px;
background:${fishColors[i.fish] || "#f9f9f9"};
">

<div style="
font-weight:bold;
font-size:16px;
margin-bottom:6px;
color:#2c3e50;
">
🐟 ${i.fish}
</div>

<div style="margin-left:5px">

<b>Наважки:</b> ${i.weights.join(" + ")} кг<br>

<b>Кількість наважок:</b> ${i.weights.length}<br>

<b>Разом:</b> ${i.kg} кг<br>

<b>Ціна:</b> ${i.price} грн/кг<br>

<b>Сума:</b> ${i.sum} грн

</div>

</div>

`).join("")}

</details>
`;

});

}

function renderBuyersRating(){

const rating = {};

allSales.forEach(s=>{

if(!rating[s.buyerName]){
rating[s.buyerName]={kg:0,sum:0};
}

rating[s.buyerName].kg += s.totalKg;
rating[s.buyerName].sum += s.totalSum;

});

const list = Object.entries(rating)
.sort((a,b)=>b[1].sum-a[1].sum);

const ratingDiv = document.getElementById("buyersRating");

ratingDiv.innerHTML = list.map(([name,data])=>`

<div style="
border:1px solid #ddd;
padding:8px;
margin:6px 0;
border-radius:6px;
background:#f4f6f7;
">

<b>${name}</b><br>

⚖️ ${data.kg} кг<br>

💰 ${data.sum} грн

</div>

`).join("");

}

window.deleteSale = async function(id){

if(!confirm("Видалити цей продаж?")) return;

await deleteDoc(doc(salesRef, id));

}
  
window.editSale = async function(id){

editingSaleId = id;
editingItemIndex = null;

const sale = allSales.find(s => s.id === id);

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
