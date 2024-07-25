document.addEventListener('DOMContentLoaded', () => {
    let totalBudget = 0;
    let totalExpenses = 0;
    const expenseLog = [];

    const budgetInput = document.getElementById('budget');
    const setBudgetBtn = document.getElementById('setBudgetBtn');
    const expenseNameInput = document.getElementById('expenseName');
    const expenseAmountInput = document.getElementById('expenseAmount');
    const expenseDateInput = document.getElementById('expenseDate');
    const logExpenseBtn = document.getElementById('logExpenseBtn');
    const undoBtn = document.getElementById('undoBtn');
    const totalBudgetDisplay = document.getElementById('totalBudget');
    const totalExpensesDisplay = document.getElementById('totalExpenses');
    const remainingBudgetDisplay = document.getElementById('remainingBudget');
    const expenseTableBody = document.getElementById('expenseTableBody');
    const notification = document.getElementById('notification');
    const errorNotification = document.getElementById('errorNotification');
    const dateTimeDisplay = document.getElementById('dateTimeDisplay');

    function updateDisplay() {
        totalBudgetDisplay.textContent = totalBudget.toFixed(2);
        totalExpensesDisplay.textContent = totalExpenses.toFixed(2);
        remainingBudgetDisplay.textContent = (totalBudget - totalExpenses).toFixed(2);
    }

    function updateExpenseTable() {
        expenseTableBody.innerHTML = '';
        expenseLog.forEach(expense => {
            const row = document.createElement('tr');

            const purposeCell = document.createElement('td');
            purposeCell.textContent = expense.name;
            row.appendChild(purposeCell);

            const amountCell = document.createElement('td');
            amountCell.textContent = expense.amount.toFixed(2);
            row.appendChild(amountCell);

            const dateCell = document.createElement('td');
            dateCell.textContent = expense.date.split('T')[0].split('-').reverse().join('/');
            row.appendChild(dateCell);

            const timeCell = document.createElement('td');
            timeCell.textContent = expense.date.split('T')[1];
            row.appendChild(timeCell);

            expenseTableBody.appendChild(row);
        });
    }

    function showNotification(message) {
        notification.textContent = message;
        notification.classList.add('show-notification');
        setTimeout(() => {
            notification.classList.remove('show-notification');
        }, 2000); // Notification visible for 2 seconds
    }

    function showErrorNotification(message) {
        errorNotification.textContent = message;
        errorNotification.classList.add('show-error-notification');
        setTimeout(() => {
            errorNotification.classList.remove('show-error-notification');
        }, 2000); // Error notification visible for 2 seconds
    }

    function updateDateTime() {
        const now = new Date();
        const dateTimeString = now.toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'medium' });
        dateTimeDisplay.textContent = dateTimeString;
    }

    setInterval(updateDateTime, 1000); // Update every second

    setBudgetBtn.addEventListener('click', () => {
        const budgetValue = parseFloat(budgetInput.value);
        if (isNaN(budgetValue) || budgetValue <= 0) {
            showErrorNotification('Please enter a valid budget.');
            return;
        }
        totalBudget = budgetValue;
        budgetInput.value = '';
        updateDisplay();
        showNotification('Budget set successfully!');
    });

    logExpenseBtn.addEventListener('click', () => {
        const expenseName = expenseNameInput.value.trim();
        const expenseAmount = parseFloat(expenseAmountInput.value) || 0;
        let expenseDate = expenseDateInput.value;

        if (totalBudget <= 0) {
            showErrorNotification('Please set a budget before logging expenses.');
            return;
        }

        if (!expenseName) {
            showErrorNotification('Please enter a purpose for the expense.');
            return;
        }

        if (expenseAmount <= 0) {
            showErrorNotification('Please enter a valid amount.');
            return;
        }

        if (!expenseDate) {
            const now = new Date();
            expenseDate = now.toISOString().slice(0, 16);
        }

        const projectedTotalExpenses = totalExpenses + expenseAmount;
        if (projectedTotalExpenses > totalBudget) {
            const confirmed = confirm('Adding this expense will exceed your budget. Do you want to proceed?');
            if (!confirmed) {
                return;
            }
        }

        expenseLog.push({ name: expenseName, amount: expenseAmount, date: expenseDate });
        totalExpenses += expenseAmount;
        expenseNameInput.value = '';
        expenseAmountInput.value = '';
        expenseDateInput.value = '';
        updateDisplay();
        updateExpenseTable();
        showNotification('Expense logged successfully!');
    });

    undoBtn.addEventListener('click', () => {
        const lastExpense = expenseLog.pop();
        if (lastExpense) {
            totalExpenses -= lastExpense.amount;
            updateDisplay();
            updateExpenseTable();
            showNotification('Undo successful!');
        } else {
            showErrorNotification('No expense to undo.');
        }
    });

    function resetData() {
        totalBudget = 0;
        totalExpenses = 0;
        expenseLog.length = 0;
        updateDisplay();
        updateExpenseTable();
    }

    function checkEndOfMonth() {
        const now = new Date();
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const timeUntilNextMonth = nextMonth - now;

        setTimeout(() => {
            resetData();
            checkEndOfMonth(); // Reset the check for the next month
        }, timeUntilNextMonth);
    }

    checkEndOfMonth();

    // Handle floating date-time display movement
    let lastScrollTop = 0;
    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const delta = scrollTop - lastScrollTop;
        dateTimeDisplay.style.transform = `translateY(${Math.min(Math.max(delta, -250), 250)}px)`;
        lastScrollTop = scrollTop;
    });
});
