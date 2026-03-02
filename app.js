import { collection, addDoc, doc, updateDoc, deleteDoc, onSnapshot }
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth = window.firebaseAuth;
const db = window.firebaseDB;
const { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } = window.firebaseFns;

/* ================= AUTH ================= */

registerBtn.onclick = async () => {
  await createUserWithEmailAndPassword(auth,email.value,password.value);
};

loginBtn.onclick = async () => {
  await signInWithEmailAndPassword(auth,email.value,password.value);
};

logoutBtn.onclick = () => signOut(auth);

onAuthStateChanged(auth,user=>{
  if(user){
    authScreen.classList.add("hidden");
    app.classList.remove("hidden");
    initSales();
  } else {
    authScreen.classList.remove("hidden");
    app.classList.add("hidden");
  }
});

/* ================= STATE ================= */

let weights=[];
let saleItems=[];
let editingId=null;

/* ================= INIT SALES ================= */

function initSales(){
  sales.innerHTML=`
  <div class="card">
    <h3>Новий продаж</h3>

    <input id="buyerName" placeholder="Покупець">
    
    <select id="fishType">
      <option>Короп</option>
      <option>Амур</option>
      <option>Товстолоб</option>
      <option>Карась</option>
      <option>Щука</option>
      <option>Окунь</option>
    </select>

    <input id="weightInput" type="number" placeholder="Наважка (кг)">
    <button id="addWeightBtn">Додати наважку</button>

    <div id="weightsBox"></div>
    <div><b>Разом: <span id="totalKg">0</span> кг</b></div>

    <input id="priceInput" type="number" placeholder="Ціна за кг">
    <button id="addFishBtn">Додати рибу</button>

    <div id="saleItemsBox"></div>
    <div><b>ЗАГАЛОМ: <span id="saleTotal">0</span> грн</b></div>

    <button id="saveSaleBtn">Зберегти</button>
  </div>

  <div class="card">
    <h3>Історія продажів</h3>
    <div id="salesHistory"></div>
  </div>
  `;

  addWeightBtn.onclick=addWeight;
  addFishBtn.onclick=addFish;
  saveSaleBtn.onclick=saveSale;

  listenSales();
}

/* ================= НАВАЖКИ ================= */

function addWeight(){
  const w=Number(weightInput.value);
  if(!w) return;
  weights.push(w);
  weightInput.value="";
  renderWeights();
}

function renderWeights(){
  weightsBox.innerHTML="";
  weights.forEach((w,i)=>{
    weightsBox.innerHTML+=
      `<div>${w} кг 
        <button onclick="removeWeight(${i})">x</button>
      </div>`;
  });
  totalKg.innerText=weights.reduce((a,b)=>a+b,0);
}

window.removeWeight=function(i){
  weights.splice(i,1);
  renderWeights();
}

/* ================= ДОДАТИ РИБУ ================= */

function addFish(){
  if(!weights.length) return;
  const kg=weights.reduce((a,b)=>a+b,0);
  const price=Number(priceInput.value);
  const fish=fishType.value;

  saleItems.push({
    fish,
    kg,
    price,
    sum:kg*price
  });

  weights=[];
  renderWeights();
  renderSaleItems();
}

function renderSaleItems(){
  saleItemsBox.innerHTML="";
  let total=0;

  saleItems.forEach((item,i)=>{
    total+=item.sum;
    saleItemsBox.innerHTML+=`
      <div>
        ${item.fish} — ${item.kg} кг × ${item.price} = ${item.sum} грн
        <button onclick="removeFish(${i})">x</button>
      </div>
    `;
  });

  saleTotal.innerText=total;
}

window.removeFish=function(i){
  saleItems.splice(i,1);
  renderSaleItems();
}

/* ================= ЗБЕРЕГТИ ================= */

async function saveSale(){
  if(!buyerName.value || !saleItems.length) return;

  const total=saleItems.reduce((a,b)=>a+b.sum,0);
  const totalKg=saleItems.reduce((a,b)=>a+b.kg,0);

  const data={
    date:new Date().toISOString().slice(0,10),
    buyer:buyerName.value,
    items:saleItems,
    total,
    totalKg
  };

  if(editingId){
    await updateDoc(doc(db,"sales",editingId),data);
    editingId=null;
  } else {
    await addDoc(collection(db,"sales"),data);
  }

  saleItems=[];
  renderSaleItems();
}

/* ================= ІСТОРІЯ ================= */

function listenSales(){
  onSnapshot(collection(db,"sales"),snap=>{
    salesHistory.innerHTML="";
    snap.forEach(docSnap=>{
      const s=docSnap.data();
      salesHistory.innerHTML+=`
        <div>
          <b>${s.date} — ${s.buyer}</b><br>
          ${s.totalKg} кг — ${s.total} грн
          <details>
            <summary>Деталі</summary>
            ${s.items.map(i=>`${i.fish}: ${i.kg} кг`).join("<br>")}
          </details>
          <button onclick="editSale('${docSnap.id}')">✏</button>
          <button onclick="deleteSale('${docSnap.id}')">🗑</button>
        </div>
        <hr>
      `;
    });
  });
}

window.deleteSale=async function(id){
  await deleteDoc(doc(db,"sales",id));
}

window.editSale=async function(id){
  editingId=id;
  // завантаження логіки редагування можна розширити
}
