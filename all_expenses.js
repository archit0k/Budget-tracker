document.addEventListener("DOMContentLoaded", () => {
    const allExpensesList = document.getElementById("all-expenses-list");
    const filterCategoryInput = document.getElementById("filter-category");
    const filterDateFromInput = document.getElementById("filter-date-from");
    const filterDateToInput = document.getElementById("filter-date-to");
    const applyFiltersBtn = document.getElementById("apply-filters");
    const clearFiltersBtn = document.getElementById("clear-filters");
  
    // Function to render expenses; accepts an array of expense objects.
    const renderExpenses = (expensesToRender) => {
      allExpensesList.innerHTML = "";
      if (expensesToRender.length === 0) {
        allExpensesList.innerHTML = "<li>No expenses logged.</li>";
      } else {
        expensesToRender.forEach((expense, index) => {
          const expenseItem = document.createElement("li");
          expenseItem.textContent = `${expense.date} - ${expense.description}: ${expense.currency} ${parseFloat(expense.amount).toFixed(2)} (${expense.category}) `;
          
          // Optional: Add a delete button for each expense:
          const deleteBtn = document.createElement("button");
          deleteBtn.textContent = "Delete";
          deleteBtn.classList.add("delete-btn");
          deleteBtn.onclick = () => {
            let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
            expenses.splice(index, 1);
            localStorage.setItem("expenses", JSON.stringify(expenses));
            // Reapply filters after deletion.
            applyFilters();
          };
          expenseItem.appendChild(deleteBtn);
          allExpensesList.appendChild(expenseItem);
        });
      }
    };
  
    // Function to get all expenses from LocalStorage.
    const getAllExpenses = () => {
      return JSON.parse(localStorage.getItem("expenses")) || [];
    };
  
    // Function to apply filters and render filtered expenses.
    const applyFilters = () => {
      let expenses = getAllExpenses();
  
      const categoryFilter = filterCategoryInput.value.trim().toLowerCase();
      const dateFrom = filterDateFromInput.value;
      const dateTo = filterDateToInput.value;
  
      const filteredExpenses = expenses.filter(expense => {
        let matchesCategory = true;
        let matchesDate = true;
  
        if (categoryFilter) {
          matchesCategory = expense.category.toLowerCase().includes(categoryFilter);
        }
  
        if (dateFrom) {
          matchesDate = expense.date >= dateFrom;
        }
        if (dateTo) {
          matchesDate = matchesDate && expense.date <= dateTo;
        }
        return matchesCategory && matchesDate;
      });
  
      renderExpenses(filteredExpenses);
    };
  
    // Set up filter buttons
    applyFiltersBtn.addEventListener("click", () => {
      applyFilters();
    });
  
    clearFiltersBtn.addEventListener("click", () => {
      filterCategoryInput.value = "";
      filterDateFromInput.value = "";
      filterDateToInput.value = "";
      renderExpenses(getAllExpenses());
    });
  
    // Initially render all expenses
    renderExpenses(getAllExpenses());
  });
  