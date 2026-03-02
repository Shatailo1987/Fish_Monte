import {
  collection,
  addDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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

document.getElementById("registerBtn").onclick = async () => {
  try {
    await createUserWithEmailAndPassword(auth, email.value, password.value);
  } catch (error) {
    authError.innerText = error.message;
  }
};

document.getElementById("loginBtn").onclick = async () => {
  try {
    await signInWithEmailAndPassword(auth, email.value, password.value);
  } catch (error) {
    authError.innerText = error.message;
  }
};

document.getElementById("logoutBtn").onclick = () => signOut(auth);

onAuthStateChanged(auth, user => {
  if (user) {
    authScreen.style.display = "none";
    app.style.display = "block";
    initSales(user);
  } else {
    authScreen.style.display = "block";
    app.style.display = "none";
  }
});

function initSales(user) {

  let weights = [];
  let items = [];

  app.innerHTML = `
    <h2>Продаж</h2>

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
    <button id="addWeight">Додати наважку</button>

    <div id="weightsList"></div>
    <div><b>Разом кг: <span id="totalKg">0</span></b></div>

    <input id="priceInput" type="number" placeholder="Ціна за кг">
    <button id="addFish">Додати рибу</button>

    <h3>Позиції</h3>
    <div id="itemsList"></div>
    <div><b>ЗАГАЛОМ: <span id="totalSum">0</span> грн</b></div>

    <button id="saveSale">Зберегти продаж</button>

    <hr>
    <h3>Історія</h3>
    <div id="salesList"></div>

    <button id="logoutBtn">Вийти</button>
  `;

  document.getElementById("logoutBtn").onclick = () => signOut(auth);

  const salesRef = collection(db, "users", user.uid, "sales");

  const renderWeights = () => {
    const list = document.getElementById("weightsList");
    list.innerHTML = "";
    let total = 0;

    weights.forEach((w, i) => {
      total += w;
      list.innerHTML += `
        <div>${w} кг 
          <button onclick="removeWeight(${i})">x</button>
        </div>`;
    });

    document.getElementById("totalKg").innerText = total;
  };

  window.removeWeight = (i) => {
    weights.splice(i, 1);
    renderWeights();
  };

  document.getElementById("addWeight").onclick = () => {
    const w = Number(document.getElementById("weightInput").value);
    if (!w) return;
    weights.push(w);
    document.getElementById("weightInput").value = "";
    renderWeights();
  };

  const renderItems = () => {
    const list = document.getElementById("itemsList");
    list.innerHTML = "";
    let total = 0;

    items.forEach((item, i) => {
      total += item.sum;
      list.innerHTML += `
        <div>
          ${item.fish} — ${item.kg} кг × ${item.price} = ${item.sum} грн
        </div>`;
    });

    document.getElementById("totalSum").innerText = total;
  };

  document.getElementById("addFish").onclick = () => {
    if (!weights.length) return;

    const kg = weights.reduce((a, b) => a + b, 0);
    const price = Number(document.getElementById("priceInput").value);
    const fish = document.getElementById("fishType").value;

    items.push({
      fish,
      kg,
      price,
      sum: kg * price
    });

    weights = [];
    renderWeights();
    renderItems();
  };

  document.getElementById("saveSale").onclick = async () => {
    const buyer = document.getElementById("buyerName").value;
    if (!buyer || !items.length) return;

    const totalKg = items.reduce((a, b) => a + b.kg, 0);
    const totalSum = items.reduce((a, b) => a + b.sum, 0);

    await addDoc(salesRef, {
      buyer,
      items,
      totalKg,
      totalSum,
      date: new Date().toISOString()
    });

    items = [];
    renderItems();
    document.getElementById("buyerName").value = "";
  };

  onSnapshot(salesRef, snapshot => {
    const list = document.getElementById("salesList");
    list.innerHTML = "";

    snapshot.forEach(doc => {
      const data = doc.data();
      const date = new Date(data.date).toLocaleDateString();

      list.innerHTML += `
        <div>
          ${date} — ${data.buyer} — ${data.totalKg} кг — ${data.totalSum} грн
        </div>
      `;
    });
  });
}
