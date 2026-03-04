export function initAuth(auth, initApp) {

const firebaseFns = window.firebaseFns || {};

const createUserWithEmailAndPassword = firebaseFns.createUserWithEmailAndPassword;
const signInWithEmailAndPassword = firebaseFns.signInWithEmailAndPassword;
const onAuthStateChanged = firebaseFns.onAuthStateChanged;
const signOut = firebaseFns.signOut;

const authScreen = document.getElementById("authScreen");
const app = document.getElementById("app");
const authError = document.getElementById("authError");

const email = document.getElementById("email");
const password = document.getElementById("password");

document.getElementById("registerBtn").onclick = async () => {

try {

await createUserWithEmailAndPassword(
auth,
email.value,
password.value
);

} catch (error) {

authError.innerText = error.message;

}

};

document.getElementById("loginBtn").onclick = async () => {

try {

await signInWithEmailAndPassword(
auth,
email.value,
password.value
);

} catch (error) {

authError.innerText = error.message;

}

};

document.getElementById("logoutBtn").onclick =
() => signOut(auth);

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

}
