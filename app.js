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

    app.innerHTML = `
      <h2>Продажі</h2>

      <input id="buyerName" placeholder="Покупець">
      <input id="saleAmount" type="number" placeholder="Сума (грн)">
      <button id="saveSale">Зберегти продаж</button>

      <h3>Історія</h3>
      <div id="salesList"></div>

      <button id="logoutBtn">Вийти</button>
    `;

  } else {
    authScreen.style.display = "block";
    app.style.display = "none";
  }
});
