document.addEventListener('DOMContentLoaded', () => {
    let totalBudget = 0;
    let totalExpenses = 0;
    const expenseLog = [];
    const undoStack = []; // Stack to hold undone expenses

    const budgetInput = document.getElementById('budget');
    const setBudgetBtn = document.getElementById('setBudgetBtn');
    const expenseNameInput = document.getElementById('expenseName');
    const expenseAmountInput = document.getElementById('expenseAmount');
    const expenseDateInput = document.getElementById('expenseDate');
    const logExpenseBtn = document.getElementById('logExpenseBtn');
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    const resetBtn = document.getElementById('resetBtn');
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

    function formatDateTime(dateTimeString) {
        const dateObj = new Date(dateTimeString);
        const optionsDate = { day: '2-digit', month: '2-digit', year: 'numeric' };
        const optionsTime = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
        const formattedDate = dateObj.toLocaleDateString('en-GB', optionsDate);
        const formattedTime = dateObj.toLocaleTimeString('en-GB', optionsTime);
        return { date: formattedDate, time: formattedTime };
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

            const { date, time } = formatDateTime(expense.date);
            const dateCell = document.createElement('td');
            dateCell.textContent = date;
            row.appendChild(dateCell);

            const timeCell = document.createElement('td');
            timeCell.textContent = time;
            row.appendChild(timeCell);

            expenseTableBody.appendChild(row);
        });
    }

    function showNotification(message) {
        notification.textContent = message;
        notification.classList.add('show-notification');
        setTimeout(() => {
            notification.classList.remove('show-notification');
        }, 3000); // Notification visible for 10 seconds
    }

    function showErrorNotification(message) {
        errorNotification.textContent = message;
        errorNotification.classList.add('show-error-notification');
        setTimeout(() => {
            errorNotification.classList.remove('show-error-notification');
        }, 3000); // Error notification visible for 10 seconds
    }

    function updateDateTime() {
        const now = new Date();
        const dateTimeString = now.toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'medium', hour12: true });
        dateTimeDisplay.textContent = dateTimeString;
    }

    setInterval(updateDateTime, 1000); // Update every second

    function saveData() {
        try {
            localStorage.setItem('totalBudget', totalBudget);
            localStorage.setItem('totalExpenses', totalExpenses);
            localStorage.setItem('expenseLog', JSON.stringify(expenseLog));
            localStorage.setItem('undoStack', JSON.stringify(undoStack));
        } catch (e) {
            showErrorNotification('Failed to save data.');
        }
    }

    function loadData() {
        try {
            const savedBudget = parseFloat(localStorage.getItem('totalBudget'));
            const savedExpenses = parseFloat(localStorage.getItem('totalExpenses'));
            const savedLog = JSON.parse(localStorage.getItem('expenseLog')) || [];
            const savedUndoStack = JSON.parse(localStorage.getItem('undoStack')) || [];

            if (!isNaN(savedBudget)) totalBudget = savedBudget;
            if (!isNaN(savedExpenses)) totalExpenses = savedExpenses;
            expenseLog.push(...savedLog);
            undoStack.push(...savedUndoStack);

            updateDisplay();
            updateExpenseTable();
        } catch (e) {
            showErrorNotification('Failed to load data.');
        }
    }

    setBudgetBtn.addEventListener('click', () => {
        const budgetValue = parseFloat(budgetInput.value);
        if (isNaN(budgetValue) || budgetValue <= 0) {
            showErrorNotification('Please enter a valid budget.');
            return;
        }
        totalBudget += budgetValue; // Add to the current budget
        budgetInput.value = '';
        updateDisplay();
        showNotification('Budget updated successfully!');
        saveData(); // Save data to localStorage
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
            expenseDate = now.toISOString();
        }

        const projectedTotalExpenses = totalExpenses + expenseAmount;
        if (projectedTotalExpenses > totalBudget) {
            const confirmed = confirm('Adding this expense will exceed your budget and put you in debt. Do you want to proceed?');
            if (!confirmed) {
                return;
            }
        }

        const newExpense = { name: expenseName, amount: expenseAmount, date: expenseDate };
        expenseLog.push(newExpense);
        totalExpenses += expenseAmount;
        undoStack.length = 0; // Clear redo stack
        expenseNameInput.value = '';
        expenseAmountInput.value = '';
        expenseDateInput.value = '';
        updateDisplay();
        updateExpenseTable();
        showNotification('Expense logged successfully!');
        saveData(); // Save data to localStorage
    });

    undoBtn.addEventListener('click', () => {
        const lastExpense = expenseLog.pop();
        if (lastExpense) {
            totalExpenses -= lastExpense.amount;
            undoStack.push(lastExpense);
            updateDisplay();
            updateExpenseTable();
            showNotification('Undo successful!');
            saveData(); // Save data to localStorage
        } else {
            showErrorNotification('No expense to undo.');
        }
    });

    redoBtn.addEventListener('click', () => {
        const lastUndoneExpense = undoStack.pop();
        if (lastUndoneExpense) {
            expenseLog.push(lastUndoneExpense);
            totalExpenses += lastUndoneExpense.amount;
            updateDisplay();
            updateExpenseTable();
            showNotification('Redo successful!');
            saveData(); // Save data to localStorage
        } else {
            showErrorNotification('No expense to redo.');
        }
    });

    function resetData() {
        totalBudget = 0;
        totalExpenses = 0;
        expenseLog.length = 0;
        updateDisplay();
        updateExpenseTable();
        saveData(); // Save the reset state
    }

    resetBtn.addEventListener('click', () => {
        if (confirm("Are you sure you want to reset? This action cannot be undone.")) {
            resetData();
        }
    });

    loadData(); // Load saved data when the page loads

    // Handle floating date-time display movement
    let lastScrollTop = 0;
    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const delta = scrollTop - lastScrollTop;
        dateTimeDisplay.style.transform = `translateY(${Math.min(Math.max(delta, -250), 250)}px)`;
        lastScrollTop = scrollTop;
    });
});
