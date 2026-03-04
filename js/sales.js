export async function renderSales(content, buyersRef, salesRef, getDocs, addDoc, onSnapshot) {

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

<button id="addWeight">Додати</button>

<button class="quickWeight" data-w="10">+10</button>
<button class="quickWeight" data-w="20">+20</button>
<button class="quickWeight" data-w="50">+50</button>

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
  
const buyerSelect = document.getElementById("buyerSelect");
const newName = document.getElementById("newName");
const newPhone = document.getElementById("newPhone");

const fishType = document.getElementById("fishType");
const weightInput = document.getElementById("weightInput");
const addWeight = document.getElementById("addWeight");

const weightsList = document.getElementById("weightsList");
const totalKg = document.getElementById("totalKg");

const priceInput = document.getElementById("priceInput");
const addFish = document.getElementById("addFish");

const itemsList = document.getElementById("itemsList");
const totalSum = document.getElementById("totalSum");

const saveSale = document.getElementById("saveSale");
const salesList = document.getElementById("salesList");
function renderWeights(){

weightsList.innerHTML =
weights.map((w,i) => `
<div>
${i+1}. ${w} кг 
<button data-index="${i}" class="removeWeight">❌</button>
</div>
`).join("")
  
weightsList.onclick = e => {

if(!e.target.classList.contains("removeWeight")) return;

const index = e.target.dataset.index;

weights.splice(index,1);

renderWeights();

};
  
totalKg.innerText =
weights.reduce((a,b)=>a+b,0);

}

addWeight.onclick = () => {

const w = Number(weightInput.value);

if(!w) return;

weights.push(w);

weightInput.value = "";

renderWeights();

weightInput.focus();   // ← додали

};
  
document.querySelectorAll(".quickWeight").forEach(btn=>{

btn.onclick = ()=>{

const w = Number(btn.dataset.w);

weights.push(w);

renderWeights();

};

});
weightInput.addEventListener("keydown", e => {

if(e.key === "Enter"){

addWeight.click();

}

});
  
function renderItems(){

itemsList.innerHTML = items.map(i => `
<div style="border:1px solid #ccc;padding:6px;margin:4px 0;">

<b>${i.fish}</b><br>

Наважки:
${i.weights.join(" + ")}
= ${i.kg} кг
(наважок: ${i.weights.length})<br>

${i.kg} × ${i.price}
= ${i.sum} грн

</div>
`).join("");

totalSum.innerText =
items.reduce((a,b)=>a+b.sum,0);

}
  
addFish.onclick = () => {

if(!weights.length) return;

const kg = weights.reduce((a,b)=>a+b,0);
const price = Number(priceInput.value);
const fish = fishType.value;

items.push({
fish,
weights:[...weights],
kg,
price,
sum:kg*price
});

weights = [];

renderWeights();
renderItems();

};
  
saveSale.onclick = async () => {

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

await addDoc(salesRef,{
buyerName,
buyerPhone,
items,
totalKg:items.reduce((a,b)=>a+b.kg,0),
totalSum:items.reduce((a,b)=>a+b.sum,0),
date:new Date().toISOString()
});

items=[];
weights=[];

renderItems();
renderWeights();

priceInput.value="";
weightInput.value="";

weightInput.focus();

};
  onSnapshot(salesRef,snap=>{

salesList.innerHTML="";

snap.forEach(doc=>{

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

${i.fish}:
${i.weights.join(" + ")}
= ${i.kg} кг
(наважок: ${i.weights.length})

</div>

`).join("")}

</details>
`;

});

});
  
}
