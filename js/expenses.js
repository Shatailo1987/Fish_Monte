export function renderExpenses(content) {

content.innerHTML = `
<h2>Витрати</h2>

<select id="expenseCategory">
<option value="">-- Оберіть категорію --</option>
<option>Корм</option>
<option>Зарибок</option>
<option>Пальне</option>
<option>Зарплата Рибаки</option>
<option>Ремонт</option>
<option>Інше</option>
</select>

<div id="dynamicFields"></div>

<button id="saveExpense">Зберегти</button>

<hr>

<h3>Історія витрат</h3>
<div id="expensesList"></div>

<div>
<b>ЗАГАЛЬНІ ВИТРАТИ: <span id="totalExpenses">0</span> грн</b>
</div>

<div>
<b>Компенсація пального рибалкам: <span id="totalFuel">0</span> грн</b>
</div>

<div>
<b>Зарплата рибалкам: <span id="totalSalary">0</span> грн</b>
</div>
`;

}
