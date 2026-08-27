const header = document.querySelector(".site-header");
const form = document.getElementById("transactionForm");
const nameInput = document.getElementById("name");
const amountInput = document.getElementById("amount");
const typeInput = document.getElementById("type");
const incomeText = document.getElementById("totalIncome");
const expenseText = document.getElementById("totalExpenses");
const balanceText = document.getElementById("balance");
const list = document.getElementById("transactionList");
const emptyState = document.getElementById("emptyState");
const revealItems = document.querySelectorAll(".reveal");

const STORAGE_KEY = "mizan-transactions";
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const currencyFormatter = new Intl.NumberFormat("en-EG", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

let transactions = loadTransactions();

function loadTransactions() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveTransactions() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch {
    // The tracker still works if browser storage is unavailable.
  }
}

function formatMoney(value) {
  return `${currencyFormatter.format(value)} EGP`;
}

function animateValue(element) {
  if (reduceMotion) return;
  element.parentElement.classList.remove("value-pop");
  void element.parentElement.offsetWidth;
  element.parentElement.classList.add("value-pop");
}

function renderTransactions() {
  list.replaceChildren();
  emptyState.hidden = transactions.length > 0;

  let income = 0;
  let expenses = 0;

  transactions.forEach((transaction) => {
    if (transaction.type === "income") {
      income += transaction.amount;
    } else {
      expenses += transaction.amount;
    }

    const item = document.createElement("article");
    item.className = `transaction ${transaction.type}`;

    const info = document.createElement("div");
    info.className = "transaction-info";

    const transactionName = document.createElement("p");
    transactionName.className = "transaction-name";
    transactionName.textContent = transaction.name;

    const date = document.createElement("p");
    date.className = "transaction-date";
    date.textContent = transaction.createdAt
      ? new Date(transaction.createdAt).toLocaleDateString("en-EG", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "Recently added";

    info.append(transactionName, date);

    const meta = document.createElement("div");
    meta.className = "transaction-meta";

    const amount = document.createElement("span");
    amount.className = "transaction-amount";
    amount.textContent = `${transaction.type === "income" ? "+" : "-"} ${formatMoney(transaction.amount)}`;

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.setAttribute("aria-label", `Delete ${transaction.name}`);
    deleteButton.addEventListener("click", () => {
      transactions = transactions.filter((itemToRemove) => itemToRemove.id !== transaction.id);
      saveTransactions();
      renderTransactions();
    });

    meta.append(amount, deleteButton);
    item.append(info, meta);
    list.append(item);
  });

  incomeText.textContent = formatMoney(income);
  expenseText.textContent = formatMoney(expenses);
  balanceText.textContent = formatMoney(income - expenses);
}

function revealOnScroll() {
  if (reduceMotion) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  if (!("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -35px" }
  );

  revealItems.forEach((item) => revealObserver.observe(item));
}

function updateHeader() {
  header.classList.toggle("is-scrolled", window.scrollY > 20);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const transactionName = nameInput.value.trim();
  const amount = Number(amountInput.value);

  if (!transactionName || !Number.isFinite(amount) || amount <= 0) {
    form.reportValidity();
    return;
  }

  transactions.unshift({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: transactionName,
    amount,
    type: typeInput.value,
    createdAt: new Date().toISOString(),
  });

  saveTransactions();
  renderTransactions();
  animateValue(typeInput.value === "income" ? incomeText : expenseText);
  animateValue(balanceText);
  form.reset();
  nameInput.focus();
});

updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });
renderTransactions();
revealOnScroll();
