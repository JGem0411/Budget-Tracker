document.addEventListener('DOMContentLoaded', () => {
    let totalBudget = 0;
    let totalExpenses = 0;
    const expenseLog = [];
    const undoStack = []; // Stack to hold undone expenses
    const budgetInput = document.getElementById('budget');
    const setBudgetBtn = document.getElementById('setBudgetBtn');
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
    const importConfirmationModal = document.getElementById('importConfirmationModal');
    const confirmImportButton = document.getElementById('confirmImport');
    const themeSwitch = document.getElementById('themeSwitch');
    const body = document.body;
    const sunIcon = document.querySelector('.sun-icon');
    const moonIcon = document.querySelector('.moon-icon');
    const ctx = document.getElementById('dailyExpendituresChart').getContext('2d');
    let dailyExpendituresChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [], // Will be filled with dates
            datasets: [{
                label: 'Daily Expenditures',
                data: [], // Will be filled with expenditure amounts
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Amount (PHP)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                }
            }
        }
    });
    const ctxCategory = document.getElementById('categoryExpendituresChart').getContext('2d');
    
    let categoryExpendituresChart = new Chart(ctxCategory, {
        type: 'bar',
        data: {
            labels: [], // Will be filled with categories
            datasets: [{
                label: 'Category Expenditures',
                data: [], // Will be filled with expenditure amounts for each category
                backgroundColor: 'rgba(153, 102, 255, 0.2)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Amount (PHP)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Category'
                    }
                }
            }
        }
    });
    

    function updateCategoryExpendituresChart() {
        const expendituresByCategory = {};

        expenseLog.forEach(expense => {
            const category = expense.category || 'Uncategorized'; // Default category if not specified
            if (!expendituresByCategory[category]) {
                expendituresByCategory[category] = 0;
            }
            expendituresByCategory[category] += expense.amount;
        });

        const labels = Object.keys(expendituresByCategory);
        const data = Object.values(expendituresByCategory);

        categoryExpendituresChart.data.labels = labels;
        categoryExpendituresChart.data.datasets[0].data = data;
        categoryExpendituresChart.update();
    }

    function updateDailyExpendituresChart() {
        const expendituresByDate = {};

        expenseLog.forEach(expense => {
            const date = formatDateTime(expense.date).date;
            if (!expendituresByDate[date]) {
                expendituresByDate[date] = 0;
            }
            expendituresByDate[date] += expense.amount;
        });

        const labels = Object.keys(expendituresByDate);
        const data = Object.values(expendituresByDate);

        dailyExpendituresChart.data.labels = labels;
        dailyExpendituresChart.data.datasets[0].data = data;
        dailyExpendituresChart.update();
    }

    function formatDateTime(dateTimeString) {
        const dateObj = new Date(dateTimeString);
        const optionsDate = { day: '2-digit', month: '2-digit', year: 'numeric' };
        const optionsTime = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
        const formattedDate = dateObj.toLocaleDateString('en-GB', optionsDate);
        const formattedTime = dateObj.toLocaleTimeString('en-GB', optionsTime);
        return { date: formattedDate, time: formattedTime };
    }

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

    // Call loadData when the page loads
    loadData();
    updateDailyExpendituresChart();
    updateCategoryExpendituresChart();

    // Check if dark mode is already applied
    if (localStorage.getItem('darkMode') === 'enabled') {
        body.classList.add('dark-mode');
        themeSwitch.checked = true;
    }

    // Toggle dark mode
    themeSwitch.addEventListener('change', () => {
        if (themeSwitch.checked) {
            body.classList.add('dark-mode');
            localStorage.setItem('darkMode', 'enabled');
        } else {
            body.classList.remove('dark-mode');
            localStorage.setItem('darkMode', 'disabled');
        }
        updateIcons();
    });

    // Update icon visibility based on the theme
    function updateIcons() {
        if (body.classList.contains('dark-mode')) {
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'inline';
        } else {
            sunIcon.style.display = 'inline';
            moonIcon.style.display = 'none';
        }
    }

    // Initialize icon visibility
    updateIcons();
    

    document.getElementById('exportBtn').addEventListener('click', () => {
        // Helper function to create a cell style
        function createCellStyle(isBold = false, alignment = 'center') {
            return {
                font: { bold: isBold },
                alignment: { horizontal: alignment, vertical: alignment },
                border: {
                    top: { style: 'thin' },
                    right: { style: 'thin' },
                    bottom: { style: 'thin' },
                    left: { style: 'thin' }
                }
            };
        }
    
        // Prepare data for export
        const budgetDetails = [
            ["Total Budget:", totalBudget],
            ["Total Expenses:", totalExpenses],
            ["Remaining Budget:", totalBudget - totalExpenses]
        ];
    
        const expenses = expenseLog.map(expense => [
            expense.name.charAt(0).toUpperCase() + expense.name.slice(1), // Capitalize first letter
            expense.amount.toFixed(2),
            formatDateTime(expense.date).date,
            formatDateTime(expense.date).time
        ]);
    
        // Create worksheets
        const ws = XLSX.utils.aoa_to_sheet([["Purpose", "Amount (PHP)", "Date", "Time"]].concat(expenses));
        const wsDetails = XLSX.utils.aoa_to_sheet([["Current Budget Details"], ...budgetDetails]);
    
        // Apply styles to header row
        const headerStyle = createCellStyle(true, 'center');
        const columns = ['A', 'B', 'C', 'D'];
        
        columns.forEach(col => {
            if (ws[col + '1']) {
                ws[col + '1'].s = headerStyle;
            }
            if (wsDetails[col + '1']) {
                wsDetails[col + '1'].s = headerStyle;
            }
        });
    
        // Apply styles to the first row of budget details
        if (wsDetails['A1']) wsDetails['A1'].s = createCellStyle(true, 'center');
        if (wsDetails['B1']) wsDetails['B1'].s = createCellStyle(true, 'center');
    
        // Set column widths for the expenses sheet
        ws['!cols'] = [
            { width: 16 }, // Column A width
            { width: 15 }, // Column B width
            { width: 12 }, // Column C width
            { width: 11 }  // Column D width
        ];
    
        // Set column widths for the budget details sheet
        wsDetails['!cols'] = [
            { width: 20 }, // Column A width
            { width: 15 }  // Column B width
        ];
    
        // Create a workbook and add the sheets
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Expenses");
        XLSX.utils.book_append_sheet(wb, wsDetails, "Budget Details");
    
        // Write the workbook and trigger the download
        XLSX.writeFile(wb, 'BudgetTracker.xlsx');
    });    
    
    document.getElementById('importBtn').addEventListener('click', () => {
        importConfirmationModal.style.display = 'flex'; // Show modal
    });

    confirmImportButton.addEventListener('click', () => {
        importConfirmationModal.style.display = 'none'; // Hide modal
        document.getElementById('importFile').click(); // Trigger file input
    });

    document.getElementById('importFile').addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
    
                // Handle the Budget Details sheet
                const budgetSheet = workbook.Sheets[workbook.SheetNames[1]];
                const budgetData = XLSX.utils.sheet_to_json(budgetSheet, { header: 1 });
                if (budgetData.length >= 3) {
                    totalBudget = parseFloat(budgetData[1][1]) || 0;
                    totalExpenses = parseFloat(budgetData[2][1]) || 0;
                    updateDisplay();
                }
    
                // Handle the Expenses sheet
                const expenseSheet = workbook.Sheets[workbook.SheetNames[0]];
                const expensesData = XLSX.utils.sheet_to_json(expenseSheet, { header: 1 });
                expenseLog.length = 0; // Clear existing expenses
    
                expensesData.slice(1).forEach(row => {
                    if (row.length === 4) {
                        const purpose = row[0];
                        const amount = parseFloat(row[1]) || 0;
                        const dateStr = row[2];
                        const timeStr = row[3];
    
                        // Construct a valid ISO date string
                        let date;
                        try {
                            date = parseDateTime(dateStr, timeStr);
                            if (!date) throw new Error("Invalid date");
                        } catch (error) {
                            console.error("Error parsing date:", error);
                            return; // Skip invalid rows
                        }
    
                        // Check if category is present and trim any extra spaces
                        const category = purpose.trim() || 'Uncategorized'; 
                        
                        expenseLog.push({
                            name: purpose,
                            amount: amount,
                            date: date.toISOString(),
                            category: capitalizeFirstLetter(category) // Ensure category is capitalized
                        });
                    }
                });
                updateExpenseTable();
                updateDailyExpendituresChart();
                updateCategoryExpendituresChart();
                // Save data after import
                saveData();
            };
            reader.readAsArrayBuffer(file);
        }
    });
    
    function parseDateTime(dateStr, timeStr) {
        const formats = [
            { format: 'DD/MM/YYYY HH:mm:ss', parse: d => {
                const [datePart, timePart] = d.split(' ');
                const [day, month, year] = datePart.split('/');
                const [hour, minute, second] = timePart.split(':');
                return new Date(year, month - 1, day, hour, minute, second);
            }},
            { format: 'YYYY-MM-DDTHH:mm:ssZ', parse: d => new Date(d) },
            { format: 'YYYY-MM-DD HH:mm:ss', parse: d => new Date(d.replace(' ', 'T') + 'Z') }
        ];
    
        const dateTimeStr = `${dateStr} ${timeStr}`;
        for (const { parse } of formats) {
            try {
                const date = parse(dateTimeStr);
                if (!isNaN(date.getTime())) {
                    return date;
                }
            } catch {
                // Continue to next format
            }
        }
        return null; // No valid format found
    }         

    function updateDisplay() {
        totalBudgetDisplay.textContent = totalBudget.toFixed(2);
        totalExpensesDisplay.textContent = totalExpenses.toFixed(2);
        remainingBudgetDisplay.textContent = (totalBudget - totalExpenses).toFixed(2);
    }

    function formatDateTime(dateTimeString) {
        const dateObj = new Date(dateTimeString);
        const optionsDate = { day: '2-digit', month: '2-digit', year: 'numeric' };
        const optionsTime = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
        const formattedDate = dateObj.toLocaleDateString('en-GB', optionsDate); // 'en-GB' formats as dd/mm/yyyy
        const formattedTime = dateObj.toLocaleTimeString('en-GB', optionsTime);
        return { date: formattedDate, time: formattedTime };
    }      

    function updateExpenseTable() {
        expenseTableBody.innerHTML = '';
        expenseLog.forEach(expense => {
            const row = document.createElement('tr');
    
            const purposeCell = document.createElement('td');
            purposeCell.textContent = expense.name.charAt(0).toUpperCase() + expense.name.slice(1); // Capitalize first letter
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
        }, 3000);
    }

    function showErrorNotification(message) {
        errorNotification.textContent = message;
        errorNotification.classList.add('show-error-notification');
        setTimeout(() => {
            errorNotification.style.remove = ('show-error-notification');
        }, 3000);
    }

    function updateDateTime() {
        const now = new Date();
        const dateTimeString = now.toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'medium', hour12: true });
        dateTimeDisplay.textContent = dateTimeString;
    }

    setInterval(updateDateTime, 1000); // Update every second

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

    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }    

    logExpenseBtn.addEventListener('click', () => {
        const expenseNameId = document.getElementById('expenseCategory').value; // Select element for expense category
        const expenseAmount = parseFloat(expenseAmountInput.value) || 0;
        const expenseCategory = expenseNameId.charAt(0).toUpperCase() + expenseNameId.slice(1); // Capitalize first letter
         let expenseDate = expenseDateInput.value;

        if (totalBudget <= 0) {
            showErrorNotification('Please set a budget before logging expenses.');
            return;
        }

        if (!expenseNameId) {
            showErrorNotification('Please select an expense purpose.');
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

        const newExpense = { name: expenseNameId, amount: expenseAmount, date: expenseDate, category: expenseCategory };
        expenseLog.push(newExpense);
        totalExpenses += expenseAmount;
        undoStack.length = 0; // Clear redo stack
        expenseAmountInput.value = '';
        expenseDateInput.value = '';
        updateDailyExpendituresChart();
        updateCategoryExpendituresChart(); // Update category chart
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
        updateDailyExpendituresChart();
        updateCategoryExpendituresChart();
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
        updateDailyExpendituresChart();
        updateCategoryExpendituresChart();
    });

    function resetData() {
        totalBudget = 0;
        totalExpenses = 0;
        expenseLog.length = 0;
        updateDisplay();
        updateExpenseTable();
        saveData(); // Save the reset state

        // Ensure the import functionality remains active
        document.getElementById('importFile').value = ''; // Clear file input
    }

    resetBtn.addEventListener('click', () => {
        if (confirm("Are you sure you want to reset? This action cannot be undone.")) {
            resetData();
            updateDailyExpendituresChart();
            updateCategoryExpendituresChart();
        }
    });

    // Handle floating date-time display movement
    let lastScrollTop = 0;
    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const delta = scrollTop - lastScrollTop;
        dateTimeDisplay.style.transform = `translateY(${Math.min(Math.max(delta, -250), 250)}px)`;
        lastScrollTop = scrollTop;
    });

    console.log('Total Budget:', totalBudget);
    console.log('Total Expenses:', totalExpenses);
    console.log('Expense Log:', expenseLog);
});