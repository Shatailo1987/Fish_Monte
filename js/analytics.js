export async function renderAnalytics(content, salesRef, expensesRef, getDocs){

content.innerHTML = `
<h2>Аналітика</h2>

<canvas id="salesChart" height="120"></canvas>
`;

const snap = await getDocs(salesRef);

const daily = {};

snap.forEach(d => {

const s = d.data();

const date = new Date(s.date).toLocaleDateString();

if(!daily[date]) daily[date] = 0;

daily[date] += s.totalSum || 0;

});

const labels = Object.keys(daily);
const data = Object.values(daily);

const ctx = document.getElementById("salesChart");

new Chart(ctx, {
type: "line",
data: {
labels: labels,
datasets: [{
label: "Виручка (грн)",
data: data,
borderWidth: 3,
tension: 0.3
}]
},
options:{
responsive:true,
plugins:{
legend:{
display:true
}
}
}
});

}
