import {
  collection,
  addDoc,
  onSnapshot,
  getDocs,
  query,
  where
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
    initApp(user);
  } else {
    authScreen.style.display = "block";
    app.style.display = "none";
  }
});

function initApp(user) {

  const salesRef = collection(db, "users", user.uid, "sales");
  const buyersRef = collection(db, "users", user.uid, "buyers");

  app.innerHTML = `
    <button id="logoutBtn">Вийти</button>
    <hr>
    <div id="content"></div>
  `;

  document.getElementById("logoutBtn").onclick = () => signOut(auth);
  const content = document.getElementById("content");

  renderSales();

  async function renderSales() {

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
      <h3>Історія</h3>
      <div id="salesList"></div>
    `;

    const renderWeights = () => {
      weightsList.innerHTML = weights.map(w => `<div>${w} кг</div>`).join("");
      totalKg.innerText = weights.reduce((a,b)=>a+b,0);
    };

    addWeight.onclick = () => {
      const w = Number(weightInput.value);
      if (!w) return;
      weights.push(w);
      weightInput.value = "";
      renderWeights();
    };

    const renderItems = () => {
      itemsList.innerHTML = items.map((i,index) => `
        <div style="border:1px solid #ccc;padding:6px;margin:4px 0;">
          <b>${i.fish}</b><br>
          Наважки: ${i.weights.join(" + ")} = ${i.kg} кг<br>
          ${i.kg} × ${i.price} = ${i.sum} грн
        </div>
      `).join("");

      totalSum.innerText = items.reduce((a,b)=>a+b.sum,0);
    };

    addFish.onclick = () => {
      if (!weights.length) return;

      const kg = weights.reduce((a,b)=>a+b,0);
      const price = Number(priceInput.value);
      const fish = fishType.value;

      items.push({
        fish,
        weights: [...weights],
        kg,
        price,
        sum: kg * price
      });

      weights = [];
      renderWeights();
      renderItems();
    };

    saveSale.onclick = async () => {

      const selectedPhone = buyerSelect.value;
      const newNameVal = newName.value.trim();
      const newPhoneVal = newPhone.value.trim();

      if (!items.length) return;

      let buyerName = "";
      let buyerPhone = "";

      if (selectedPhone) {
        const b = buyers.find(x => x.phone === selectedPhone);
        buyerName = b.name;
        buyerPhone = b.phone;
      } else {

        if (!newNameVal || !newPhoneVal) {
          alert("Вкажіть імʼя та телефон");
          return;
        }

        const phoneExists = buyers.find(x => x.phone === newPhoneVal);
        if (phoneExists) {
          alert("Такий номер вже існує");
          return;
        }

        await addDoc(buyersRef, {
          name: newNameVal,
          phone: newPhoneVal
        });

        buyerName = newNameVal;
        buyerPhone = newPhoneVal;
      }

      await addDoc(salesRef, {
        buyerName,
        buyerPhone,
        items,
        totalKg: items.reduce((a,b)=>a+b.kg,0),
        totalSum: items.reduce((a,b)=>a+b.sum,0),
        date: new Date().toISOString()
      });

      items = [];
      renderItems();
      renderWeights();
    };

    onSnapshot(salesRef, snap => {
      salesList.innerHTML = "";
      snap.forEach(doc => {
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
                ${i.fish}: ${i.weights.join(" + ")} = ${i.kg} кг,
                ${i.sum} грн
              </div>
            `).join("")}
          </details>
        `;
      });
    });
  }
}
