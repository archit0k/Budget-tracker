document.addEventListener("DOMContentLoaded", () => {
    Chart.defaults.color = '#fff';
    Chart.defaults.borderColor = 'rgba(255,255,255,0.1)';
    Chart.defaults.font.family = 'Poppins';
    Chart.defaults.plugins.legend.labels.boxWidth = 16;
    Chart.defaults.plugins.legend.labels.padding = 20;
    Chart.defaults.elements.line.tension = 0.4;
    Chart.defaults.elements.point.radius = 5;
    Chart.defaults.elements.point.hoverRadius = 7;

    const addExpenseBtn = document.getElementById("add-expense-btn");
    const expensePopup = document.getElementById("expense-popup");
    const closePopupBtn = document.getElementById("close-popup");
    const expenseForm = document.getElementById("expense-form");
    const expenseList = document.getElementById("expense-list");
    const baseCurrencySelect = document.getElementById("base-currency");
    const setBudgetBtn = document.getElementById("set-budget-btn");
    const spentAmountSpan = document.getElementById("spent-amount");
    const totalBudgetSpan = document.getElementById("total-budget");
    const budgetMeter = document.getElementById("budget-meter");
    const viewAllExpensesBtn = document.getElementById("view-all-expenses");
    const addCategoryBtn = document.getElementById("add-category");
    const categorySelect = document.getElementById("category");
    let editingExpenseIndex = null;


    // Exchange Rates and Conversion Logic
    const API_KEY = "91b6ca51f2d1467dbd6dfd2dda917c3f";
    let exchangeRates = {};

    const fetchExchangeRates = async (base = "USD") => {
        try {
            const response = await fetch(
                `https://open.er-api.com/v6/latest/${base}?app_id=${API_KEY}`
            );
            const data = await response.json();
            exchangeRates = data.rates;
            localStorage.setItem("exchangeRates", JSON.stringify(exchangeRates));
        } catch (error) {
            console.error("Error fetching exchange rates:", error);
        }
    };

    const convertCurrency = (amount, fromCurrency, toCurrency) => {
        if (!exchangeRates[fromCurrency] || !exchangeRates[toCurrency])
            return amount;
        return (amount / exchangeRates[fromCurrency]) * exchangeRates[toCurrency];
    };

    // Modified loadExpenses: only last 3 expenses displayed with delete buttons
    const loadExpenses = () => {
        const expenses = JSON.parse(localStorage.getItem("expenses")) || [];
        const baseCurrency = localStorage.getItem("baseCurrency") || "USD";
        expenseList.innerHTML = ""; // Clear list before reloading

        // Get the last 3 expenses (if there are less than 3, take all)
        const lastThreeExpenses = expenses.slice(-3);

        lastThreeExpenses.forEach((expense, index) => {
            const convertedAmount = convertCurrency(parseFloat(expense.amount), expense.currency, baseCurrency).toFixed(2);
            const expenseItem = document.createElement("li");
            expenseItem.textContent = `${expense.date} - ${expense.description}: ${baseCurrency} ${convertedAmount} (${expense.category}) `;

            // Calculate the correct index in the full expenses array
            const fullIndex = expenses.length - lastThreeExpenses.length + index;

            // Create Edit button
            const editBtn = document.createElement("button");
            editBtn.textContent = "Edit";
            editBtn.classList.add("edit-btn");
            editBtn.onclick = () => {
                // Set the editing index so we know which expense to update
                editingExpenseIndex = fullIndex;
                // Populate the form fields with the expense data
                document.getElementById("amount").value = expense.amount;
                document.getElementById("category").value = expense.category;
                document.getElementById("expense-currency").value = expense.currency;
                document.getElementById("date").value = expense.date;
                document.getElementById("description").value = expense.description;
                // Open the popup
                expensePopup.style.display = "flex";
            };

            // Create Delete button 
            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = "Delete";
            deleteBtn.classList.add("delete-btn");
            deleteBtn.onclick = () => deleteExpense(fullIndex);

            // Append the buttons to the expense item
            expenseItem.appendChild(editBtn);
            expenseItem.appendChild(deleteBtn);
            expenseList.appendChild(expenseItem);
        });

        updateBudgetOverview(); // Update budget info
        updateInsights(); // Update the chart
        updateTrendsChart();
    };


    // Function to delete an expense 
    const deleteExpense = (correctIndex) => {
        let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
        expenses.splice(correctIndex, 1); // Remove the selected expense
        localStorage.setItem("expenses", JSON.stringify(expenses));
        loadExpenses(); // Refresh the list and budget overview
    };

    // Budget Overview update function
    const updateBudgetOverview = () => {
        const expenses = JSON.parse(localStorage.getItem("expenses")) || [];
        const baseCurrency = localStorage.getItem("baseCurrency") || "INR";
        let totalSpent = 0;
        expenses.forEach((expense) => {
            totalSpent += parseFloat(
                convertCurrency(
                    parseFloat(expense.amount),
                    expense.currency,
                    baseCurrency
                )
            );
        });
        spentAmountSpan.textContent = `${baseCurrency} ${totalSpent.toFixed(2)}`;

        const budget = parseFloat(localStorage.getItem("budget"));
        if (budget && budget > 0) {
            totalBudgetSpan.textContent = `${baseCurrency} ${budget.toFixed(2)}`;
            // Update the meter percentage (ensure we don't go over 100)
            let percentage = Math.min((totalSpent / budget) * 100, 100);
            budgetMeter.value = percentage;
        } else {
            totalBudgetSpan.textContent = "Not Set";
            budgetMeter.value = 0;
        }
    };

    // Set Budget button click handler
    setBudgetBtn.addEventListener("click", () => {
        const budgetInput = prompt("Enter your total budget:");
        if (budgetInput && !isNaN(budgetInput)) {
            localStorage.setItem("budget", budgetInput);
            updateBudgetOverview();
        } else {
            alert("Please enter a valid number for the budget.");
        }
    });

    // Base currency change handler
    baseCurrencySelect.addEventListener("change", async () => {
        const selectedCurrency = baseCurrencySelect.value;
        localStorage.setItem("baseCurrency", selectedCurrency);
        await fetchExchangeRates(selectedCurrency);
        loadExpenses();
    });

    addExpenseBtn.addEventListener("click", () => {
        expensePopup.style.display = "flex";
    });

    closePopupBtn.addEventListener("click", () => {
        expensePopup.style.display = "none";
    });

    // Expense form submission (using separate expense-currency selector)
    expenseForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const amount = document.getElementById("amount").value;
        const category = document.getElementById("category").value;
        const expenseCurrency = document.getElementById("expense-currency").value;
        const date = document.getElementById("date").value;
        const description = document.getElementById("description").value;

        const expenses = JSON.parse(localStorage.getItem("expenses")) || [];

        // If editingExpenseIndex is not null, update that expense; otherwise, add a new expense
        if (editingExpenseIndex !== null) {
            expenses[editingExpenseIndex] = { amount, category, currency: expenseCurrency, date, description };
            editingExpenseIndex = null; // Reset editing state
        } else {
            expenses.push({ amount, category, currency: expenseCurrency, date, description });
        }

        localStorage.setItem("expenses", JSON.stringify(expenses));
        loadExpenses();
        expensePopup.style.display = "none";
        expenseForm.reset();
    });


    viewAllExpensesBtn.addEventListener("click", () => {
        // Redirect to the full expenses page
        window.location.href = "all_expenses.html";
    });

    // Function to update spending insights chart
    const updateInsights = () => {
        const expenses = JSON.parse(localStorage.getItem("expenses")) || [];
        const baseCurrency = localStorage.getItem("baseCurrency") || "USD";

        // Aggregate spending by category
        const categoryTotals = {};
        expenses.forEach((expense) => {
            const convertedAmount = parseFloat(
                convertCurrency(
                    parseFloat(expense.amount),
                    expense.currency,
                    baseCurrency
                )
            );
            const category = expense.category;
            if (categoryTotals[category]) {
                categoryTotals[category] += convertedAmount;
            } else {
                categoryTotals[category] = convertedAmount;
            }
        });

        // Prepare labels and data arrays for the chart
        const labels = Object.keys(categoryTotals);
        const data = Object.values(categoryTotals).map((amount) =>
            parseFloat(amount.toFixed(2))
        );

        // Get the chart context
        const ctx = document.getElementById("spending-chart").getContext("2d");


        if (window.spendingChart) {
            window.spendingChart.data.labels = labels;
            window.spendingChart.data.datasets[0].data = data;
            window.spendingChart.update();
        } else {
            window.spendingChart = new Chart(ctx, {
                type: "pie",
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: "Spending by Category",
                            data: data,
                            backgroundColor: [
                                "rgba(255, 99, 132, 0.6)",
                                "rgba(54, 162, 235, 0.6)",
                                "rgba(255, 206, 86, 0.6)",
                                "rgba(75, 192, 192, 0.6)",
                                "rgba(153, 102, 255, 0.6)",
                                "rgba(255, 159, 64, 0.6)",
                            ],
                            borderWidth: 1,
                        },
                    ],
                },
                options: {
                    responsive: false,
                    plugins: {
                        legend: {
                            position: "bottom",
                        },
                    },
                },
            });
        }
    };

    // Load custom categories from LocalStorage and add them to the dropdown
    const loadCustomCategories = () => {
        const customCategories = JSON.parse(localStorage.getItem("customCategories")) || [];
        customCategories.forEach(cat => {
            // Only add if it doesn't already exist in the dropdown
            if (!Array.from(categorySelect.options).some(opt => opt.value === cat)) {
                const option = document.createElement("option");
                option.value = cat;
                // Capitalize the first letter for display purposes
                option.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
                categorySelect.appendChild(option);
            }
        });
    };
    loadCustomCategories();


    addCategoryBtn.addEventListener("click", () => {
        const newCategory = prompt("Enter new category name:");
        if (newCategory) {
            // Check if the category already exists (case-insensitive)
            const exists = Array.from(categorySelect.options).some(opt => opt.value.toLowerCase() === newCategory.toLowerCase());
            if (!exists) {
                const option = document.createElement("option");
                option.value = newCategory.toLowerCase();
                option.textContent = newCategory;
                categorySelect.appendChild(option);


                let customCategories = JSON.parse(localStorage.getItem("customCategories")) || [];

                customCategories.push(newCategory.toLowerCase());
                localStorage.setItem("customCategories", JSON.stringify(customCategories));
            } else {
                alert("Category already exists!");
            }
        }
    });

    // Function to update the monthly spending trends chart
    const updateTrendsChart = () => {
        const expenses = JSON.parse(localStorage.getItem("expenses")) || [];
        const baseCurrency = localStorage.getItem("baseCurrency") || "USD";

        // Group expenses by month (assumes date is in YYYY-MM-DD format)
        const monthlyTotals = {};
        expenses.forEach(expense => {
            // Extract year-month (YYYY-MM)
            const month = expense.date.slice(0, 7);
            const convertedAmount = parseFloat(convertCurrency(parseFloat(expense.amount), expense.currency, baseCurrency));
            monthlyTotals[month] = (monthlyTotals[month] || 0) + convertedAmount;
        });

        // Sort months and prepare data arrays
        const months = Object.keys(monthlyTotals).sort();
        const totals = months.map(month => parseFloat(monthlyTotals[month].toFixed(2)));

        // Get the canvas context for the trends chart
        const ctx = document.getElementById("trends-chart").getContext("2d");

        // Create or update the chart
        if (window.trendsChart) {
            window.trendsChart.data.labels = months;
            window.trendsChart.data.datasets[0].data = totals;
            window.trendsChart.update();
        } else {
            window.trendsChart = new Chart(ctx, {
                type: "line",
                data: {
                    labels: months,
                    datasets: [{
                        label: "Monthly Spending (" + baseCurrency + ")",
                        data: totals,
                        borderColor: "rgba(75, 192, 192, 1)",
                        backgroundColor: "rgba(75, 192, 192, 0.2)",
                        fill: true,
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: "bottom"
                        }
                    }
                }
            });
        }
    };



    // Initial setup: set base currency and fetch exchange rates
    (async () => {
        const storedCurrency = localStorage.getItem("baseCurrency") || "INR";
        baseCurrencySelect.value = storedCurrency;
        await fetchExchangeRates(storedCurrency);
        loadExpenses();
    })();
});
