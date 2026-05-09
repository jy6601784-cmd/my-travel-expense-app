const recordsKey = "personal-expense-tracker-records-v2";
const legacyRecordsKey = "personal-expense-tracker-v1";
const categoriesKey = "personal-expense-tracker-categories-v1";
const tripsKey = "personal-expense-tracker-trips-v1";
const defaultCurrency = "MOP";
const defaultTripId = "daily";
const maxReceiptImageSize = 1200;
let pendingReceiptImage = null;

const currencies = [
  { code: "MOP", label: "澳門幣 MOP" },
  { code: "HKD", label: "港幣 HKD" },
  { code: "CNY", label: "人民幣 CNY" },
  { code: "TWD", label: "台幣 TWD" },
  { code: "JPY", label: "日圓 JPY" },
  { code: "KRW", label: "韓圜 KRW" },
  { code: "USD", label: "美元 USD" },
  { code: "EUR", label: "歐元 EUR" },
  { code: "GBP", label: "英鎊 GBP" },
  { code: "SGD", label: "新加坡幣 SGD" },
  { code: "THB", label: "泰銖 THB" },
  { code: "MYR", label: "馬幣 MYR" },
];

const defaultCategories = {
  expense: [
    { value: "food", label: "飲食", icon: "🍜" },
    { value: "transport", label: "交通", icon: "🚇" },
    { value: "shopping", label: "購物", icon: "🛍️" },
    { value: "investment", label: "投資", icon: "📈" },
    { value: "home", label: "居家", icon: "🏠" },
    { value: "fun", label: "娛樂", icon: "🎡" },
    { value: "health", label: "健康", icon: "💊" },
    { value: "other", label: "其他", icon: "📌" },
  ],
  income: [
    { value: "salary", label: "薪水", icon: "💼" },
    { value: "bonus", label: "獎金", icon: "🏆" },
    { value: "gift", label: "禮金", icon: "🎁" },
    { value: "other_income", label: "其他收入", icon: "💰" },
  ],
};

const state = {
  type: "expense",
  filter: "month",
  month: new Date().toISOString().slice(0, 7),
  query: "",
  selectedTrip: "all",
  trips: loadTrips(),
  records: [],
  customCategories: loadCustomCategories(),
};
state.records = loadRecords();

const amountInput = document.querySelector("#amountInput");
const tripInput = document.querySelector("#tripInput");
const categoryInput = document.querySelector("#categoryInput");
const categoryQuickList = document.querySelector("#categoryQuickList");
const currencyInput = document.querySelector("#currencyInput");
const dateInput = document.querySelector("#dateInput");
const noteInput = document.querySelector("#noteInput");
const receiptInput = document.querySelector("#receiptInput");
const receiptPreview = document.querySelector("#receiptPreview");
const entryForm = document.querySelector("#entryForm");
const recordsList = document.querySelector("#recordsList");
const emptyState = document.querySelector("#emptyState");
const recordCount = document.querySelector("#recordCount");
const balance = document.querySelector("#balance");
const income = document.querySelector("#income");
const expense = document.querySelector("#expense");
const monthInput = document.querySelector("#monthInput");
const searchInput = document.querySelector("#searchInput");
const tripFilterInput = document.querySelector("#tripFilterInput");
const categoryReport = document.querySelector("#categoryReport");
const topCategory = document.querySelector("#topCategory");
const donutChart = document.querySelector("#donutChart");
const donutChartLabel = document.querySelector("#donutChartLabel");
const trendChart = document.querySelector("#trendChart");
const statsTotalExpense = document.querySelector("#statsTotalExpense");
const statsDailyAverage = document.querySelector("#statsDailyAverage");
const statsLargestExpense = document.querySelector("#statsLargestExpense");
const currencySummary = document.querySelector("#currencySummary");
const summaryMonthLabel = document.querySelector("#summaryMonthLabel");
const activeTripName = document.querySelector("#activeTripName");
const activeTripLabel = document.querySelector("#activeTripLabel");
const tripBudgetInfo = document.querySelector("#tripBudgetInfo");
const toast = document.querySelector("#toast");
const categoryDialog = document.querySelector("#categoryDialog");
const customTypeInput = document.querySelector("#customTypeInput");
const customIconInput = document.querySelector("#customIconInput");
const customCategoryInput = document.querySelector("#customCategoryInput");
const customCategoryList = document.querySelector("#customCategoryList");
const receiptDialog = document.querySelector("#receiptDialog");
const receiptDialogTitle = document.querySelector("#receiptDialogTitle");
const receiptDialogImage = document.querySelector("#receiptDialogImage");
const tripDialog = document.querySelector("#tripDialog");
const tripNameInput = document.querySelector("#tripNameInput");
const tripBudgetInput = document.querySelector("#tripBudgetInput");
const tripThemeInput = document.querySelector("#tripThemeInput");
const tripList = document.querySelector("#tripList");
const template = document.querySelector("#recordTemplate");
const viewSections = document.querySelectorAll(".app-view");
const navButtons = document.querySelectorAll(".nav-button");

dateInput.value = new Date().toISOString().slice(0, 10);
monthInput.value = state.month;
renderTrips();
renderCurrencies();
renderCategories();
render();
registerServiceWorker();

document.querySelectorAll(".type-option").forEach((button) => {
  button.addEventListener("click", () => {
    state.type = button.dataset.type;
    document.querySelectorAll(".type-option").forEach((item) => {
      item.classList.toggle("is-active", item === button);
    });
    renderCategories();
  });
});

document.querySelectorAll(".filter-button").forEach((button) => {
  button.addEventListener("click", () => {
    state.filter = button.dataset.filter;
    document.querySelectorAll(".filter-button").forEach((item) => {
      item.classList.toggle("is-active", item === button);
    });
    render();
  });
});

navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setActiveView(button.dataset.viewTarget);
  });
});

document.querySelector("#closeAddSheetButton").addEventListener("click", () => {
  setActiveView("home");
});

categoryQuickList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-category]");
  if (!button) return;
  categoryInput.value = button.dataset.category;
  renderCategoryQuickList();
});

entryForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const amount = Number(String(amountInput.value).replace(",", "."));

  if (!Number.isFinite(amount) || amount <= 0) {
    amountInput.focus();
    return;
  }

  const selected = findCategory(state.type, categoryInput.value);
  const record = {
    id: globalThis.crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()),
    type: state.type,
    amount: Math.round(amount * 100) / 100,
    currency: currencyInput.value || defaultCurrency,
    tripId: tripInput.value || defaultTripId,
    category: selected.value,
    categoryLabel: selected.label,
    icon: selected.icon,
    note: noteInput.value.trim(),
    date: dateInput.value,
    receiptImage: pendingReceiptImage,
    createdAt: new Date().toISOString(),
  };

  state.records = [record, ...state.records];
  saveRecords();
  entryForm.reset();
  pendingReceiptImage = null;
  renderReceiptPreview();
  dateInput.value = new Date().toISOString().slice(0, 10);
  currencyInput.value = defaultCurrency;
  tripInput.value = state.selectedTrip === "all" ? defaultTripId : state.selectedTrip;
  renderCategories();
  render();
  setActiveView("home");
  showToast("已新增紀錄");
  amountInput.focus();
});

recordsList.addEventListener("click", (event) => {
  const receiptButton = event.target.closest(".receipt-thumb");
  if (receiptButton) {
    const record = state.records.find((item) => item.id === receiptButton.dataset.id);
    if (record?.receiptImage) {
      receiptDialogTitle.textContent = record.note || record.categoryLabel;
      receiptDialogImage.src = record.receiptImage;
      receiptDialog.showModal();
    }
    return;
  }

  const button = event.target.closest(".delete-button");
  if (!button) return;

  const ok = confirm("確定要刪除這筆紀錄嗎？");
  if (!ok) return;

  state.records = state.records.filter((record) => record.id !== button.dataset.id);
  saveRecords();
  render();
  showToast("已刪除紀錄");
});

receiptInput.addEventListener("change", async () => {
  const file = receiptInput.files?.[0];
  if (!file) {
    pendingReceiptImage = null;
    renderReceiptPreview();
    return;
  }

  try {
    pendingReceiptImage = await resizeImage(file);
    renderReceiptPreview();
  } catch {
    pendingReceiptImage = null;
    renderReceiptPreview("照片讀取失敗，請換一張試試。");
  }
});

monthInput.addEventListener("change", () => {
  state.month = monthInput.value || new Date().toISOString().slice(0, 7);
  render();
});

searchInput.addEventListener("input", () => {
  state.query = searchInput.value.trim().toLowerCase();
  render();
});

tripFilterInput.addEventListener("change", () => {
  state.selectedTrip = tripFilterInput.value || "all";
  if (state.selectedTrip !== "all") {
    tripInput.value = state.selectedTrip;
  }
  render();
});

document.querySelector("#manageTripsButton").addEventListener("click", () => {
  renderTripList();
  tripDialog.showModal();
});

document.querySelector("#settingsButton").addEventListener("click", () => {
  renderCustomCategories();
  categoryDialog.showModal();
});

document.querySelector("#addCategoryButton").addEventListener("click", () => {
  const label = customCategoryInput.value.trim();
  if (!label) {
    customCategoryInput.focus();
    return;
  }

  const type = customTypeInput.value;
  const icon = (customIconInput.value.trim() || label.slice(0, 1)).slice(0, 2);
  const value = `custom_${Date.now()}`;
  state.customCategories[type] = [...state.customCategories[type], { value, label, icon }];
  saveCustomCategories();
  customCategoryInput.value = "";
  customIconInput.value = "";
  renderCategories();
  renderCustomCategories();
});

customCategoryList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-category]");
  if (!button) return;

  const { type, category } = button.dataset;
  state.customCategories[type] = state.customCategories[type].filter((item) => item.value !== category);
  saveCustomCategories();
  renderCategories();
  renderCustomCategories();
});

document.querySelector("#addTripButton").addEventListener("click", () => {
  const name = tripNameInput.value.trim();
  if (!name) {
    tripNameInput.focus();
    return;
  }

  const trip = {
    id: `trip_${Date.now()}`,
    name,
    budget: Number(String(tripBudgetInput.value).replace(",", ".")) || 0,
    theme: tripThemeInput.value || "ocean",
    createdAt: new Date().toISOString(),
  };
  state.trips = [...state.trips, trip];
  saveTrips();
  tripNameInput.value = "";
  tripBudgetInput.value = "";
  tripThemeInput.value = "ocean";
  renderTrips();
  renderTripList();
  showToast("已新增旅程");
});

tripList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-trip]");
  if (!button || button.dataset.trip === defaultTripId) return;
  const ok = confirm("刪除旅程後，原本屬於這個旅程的紀錄會改到日常。確定嗎？");
  if (!ok) return;

  const tripId = button.dataset.trip;
  state.trips = state.trips.filter((trip) => trip.id !== tripId);
  state.records = state.records.map((record) =>
    record.tripId === tripId ? { ...record, tripId: defaultTripId } : record
  );
  if (state.selectedTrip === tripId) state.selectedTrip = "all";
  saveTrips();
  saveRecords();
  renderTrips();
  renderTripList();
  render();
  showToast("已刪除旅程");
});

document.querySelector("#backupButton").addEventListener("click", backupData);
document.querySelector("#restoreInput").addEventListener("change", restoreData);

function loadRecords() {
  try {
    const current = localStorage.getItem(recordsKey);
    const legacy = localStorage.getItem(legacyRecordsKey);
    const records = JSON.parse(current || legacy || "[]");
    return Array.isArray(records) ? records.map(normalizeRecord).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function normalizeRecord(record) {
  if (!record || !record.date || !record.type || !record.amount) return null;
  const selected = findDefaultCategory(record.type, record.category);
  return {
    id: record.id || String(Date.now()),
    type: record.type === "income" ? "income" : "expense",
    amount: Number(record.amount),
    currency: record.currency || defaultCurrency,
    tripId: record.tripId || defaultTripId,
    category: record.category || selected.value,
    categoryLabel: record.categoryLabel || selected.label,
    icon: record.icon || selected.icon,
    note: record.note || "",
    date: record.date,
    receiptImage: record.receiptImage || null,
    createdAt: record.createdAt || new Date().toISOString(),
  };
}

function saveRecords() {
  localStorage.setItem(recordsKey, JSON.stringify(state.records));
}

function loadTrips() {
  try {
    const saved = JSON.parse(localStorage.getItem(tripsKey) || "[]");
    const trips = Array.isArray(saved) ? saved : [];
    return [
      { id: defaultTripId, name: "日常", budget: 0, theme: "ocean", createdAt: "default" },
      ...trips
        .filter((trip) => trip?.id && trip?.name && trip.id !== defaultTripId)
        .map((trip) => ({
          id: trip.id,
          name: trip.name,
          budget: Number(trip.budget) || 0,
          theme: trip.theme || "ocean",
          createdAt: trip.createdAt || new Date().toISOString(),
        })),
    ];
  } catch {
    return [{ id: defaultTripId, name: "日常", budget: 0, theme: "ocean", createdAt: "default" }];
  }
}

function saveTrips() {
  localStorage.setItem(
    tripsKey,
    JSON.stringify(state.trips.filter((trip) => trip.id !== defaultTripId))
  );
}

function loadCustomCategories() {
  try {
    const saved = JSON.parse(localStorage.getItem(categoriesKey) || "{}");
    return {
      expense: Array.isArray(saved.expense) ? saved.expense : [],
      income: Array.isArray(saved.income) ? saved.income : [],
    };
  } catch {
    return { expense: [], income: [] };
  }
}

function saveCustomCategories() {
  localStorage.setItem(categoriesKey, JSON.stringify(state.customCategories));
}

function getCategories(type) {
  return [...defaultCategories[type], ...state.customCategories[type]];
}

function renderCategories() {
  categoryInput.innerHTML = getCategories(state.type)
    .map((item) => `<option value="${escapeHtml(item.value)}">${escapeHtml(item.label)}</option>`)
    .join("");
  renderCategoryQuickList();
}

function renderCategoryQuickList() {
  const selected = categoryInput.value;
  categoryQuickList.innerHTML = getCategories(state.type)
    .map(
      (item) => `
        <button class="${item.value === selected ? "is-active" : ""}" type="button" data-category="${escapeHtml(item.value)}">
          <span>${escapeHtml(item.icon || item.label.slice(0, 1))}</span>
          ${escapeHtml(item.label)}
        </button>
      `
    )
    .join("");
}

function renderCurrencies() {
  currencyInput.innerHTML = currencies
    .map((item) => `<option value="${item.code}">${item.label}</option>`)
    .join("");
  currencyInput.value = defaultCurrency;
}

function renderTrips() {
  tripInput.innerHTML = state.trips
    .map((trip) => `<option value="${escapeHtml(trip.id)}">${escapeHtml(trip.name)}</option>`)
    .join("");
  tripInput.value = state.selectedTrip === "all" ? defaultTripId : state.selectedTrip;

  tripFilterInput.innerHTML = [
    `<option value="all">全部旅程</option>`,
    ...state.trips.map((trip) => `<option value="${escapeHtml(trip.id)}">${escapeHtml(trip.name)}</option>`),
  ].join("");
  tripFilterInput.value = state.selectedTrip;
}

function render() {
  const scopedRecords = getTripScopedRecords();
  const visibleRecords = getVisibleRecords(scopedRecords);
  const monthlyRecords = scopedRecords.filter((record) => record.date.startsWith(state.month));
  const totalsByCurrency = calculateTotalsByCurrency(monthlyRecords);
  const defaultTotals = totalsByCurrency.get(defaultCurrency) || { income: 0, expense: 0 };

  renderRecords(visibleRecords);
  renderReport(monthlyRecords);
  renderTripHero(monthlyRecords);
  renderStatCards(scopedRecords);
  renderTrendChart(scopedRecords);
  renderCurrencySummary(totalsByCurrency);

  income.textContent = formatMoney(defaultTotals.income, defaultCurrency);
  expense.textContent = formatMoney(defaultTotals.expense, defaultCurrency);
  balance.textContent = formatMoney(defaultTotals.income - defaultTotals.expense, defaultCurrency);
  summaryMonthLabel.textContent = `${formatMonth(state.month)}結餘`;
  recordCount.textContent = `${visibleRecords.length} 筆`;
  emptyState.classList.toggle("is-hidden", visibleRecords.length > 0);
}

function renderRecords(records) {
  recordsList.innerHTML = "";

  records.forEach((record) => {
    const item = template.content.firstElementChild.cloneNode(true);
    const icon = item.querySelector(".record-icon");
    const title = item.querySelector(".record-title");
    const meta = item.querySelector(".record-meta");
    const amount = item.querySelector(".record-amount");
    const receiptThumb = item.querySelector(".receipt-thumb");
    const deleteButton = item.querySelector(".delete-button");

    icon.textContent = record.icon || record.categoryLabel.slice(0, 1);
    icon.classList.toggle("expense", record.type === "expense");
    title.textContent = record.note || record.categoryLabel;
    meta.textContent = `${record.categoryLabel} · ${record.currency || defaultCurrency} · ${formatDate(record.date)}`;
    amount.textContent = `${record.type === "expense" ? "-" : "+"}${formatMoney(record.amount, record.currency)}`;
    amount.className = `record-amount ${record.type}`;
    if (record.receiptImage) {
      receiptThumb.dataset.id = record.id;
      receiptThumb.style.backgroundImage = `url("${record.receiptImage}")`;
      receiptThumb.hidden = false;
    } else {
      receiptThumb.hidden = true;
    }
    deleteButton.dataset.id = record.id;
    recordsList.appendChild(item);
  });
}

function renderReport(records) {
  const expenseRecords = records.filter(
    (record) => record.type === "expense" && (record.currency || defaultCurrency) === defaultCurrency
  );
  const totalExpense = expenseRecords.reduce((sum, record) => sum + Number(record.amount), 0);
  const byCategory = new Map();

  expenseRecords.forEach((record) => {
    const current = byCategory.get(record.category) || {
      label: record.categoryLabel,
      icon: record.icon,
      amount: 0,
    };
    current.amount += Number(record.amount);
    byCategory.set(record.category, current);
  });

  const rows = [...byCategory.values()].sort((a, b) => b.amount - a.amount);
  topCategory.textContent = rows[0] ? `最多：${rows[0].label}` : "暫無資料";
  renderDonutChart(rows, totalExpense);

  if (rows.length === 0) {
    categoryReport.innerHTML = `<div class="mini-empty">這個月份還沒有支出。</div>`;
    return;
  }

  categoryReport.innerHTML = rows
    .map((item) => {
      const percent = totalExpense ? Math.round((item.amount / totalExpense) * 100) : 0;
      return `
        <div class="report-row">
          <div class="report-head">
            <span>${escapeHtml(item.icon || item.label.slice(0, 1))} ${escapeHtml(item.label)}</span>
            <strong>${formatMoney(item.amount, defaultCurrency)}</strong>
          </div>
          <div class="report-track"><div style="width: ${percent}%"></div></div>
          <div class="report-foot"><span>${percent}%</span><span>本月 MOP 支出</span></div>
        </div>
      `;
    })
    .join("");
}

function renderTripHero(monthlyRecords) {
  const trip = state.trips.find((item) => item.id === state.selectedTrip);
  const expenses = monthlyRecords
    .filter((record) => record.type === "expense" && (record.currency || defaultCurrency) === defaultCurrency)
    .reduce((sum, record) => sum + Number(record.amount), 0);
  const budget = trip?.budget || 0;
  const percent = budget ? Math.min(100, Math.round((expenses / budget) * 100)) : 0;

  activeTripLabel.textContent = state.selectedTrip === "all" ? "目前範圍" : "目前旅程";
  activeTripName.textContent = trip?.name || "全部旅程";
  tripBudgetInfo.innerHTML = budget
    ? `<span>${formatMoney(expenses, defaultCurrency)} / ${formatMoney(budget, defaultCurrency)}</span><div><i style="width:${percent}%"></i></div>`
    : "未設定預算";

  const theme = trip?.theme || "ocean";
  document.querySelector(".trip-hero").dataset.theme = state.selectedTrip === "all" ? "ocean" : theme;
}

function renderStatCards(records) {
  const expenseRecords = records.filter(
    (record) => record.type === "expense" && (record.currency || defaultCurrency) === defaultCurrency
  );
  const total = expenseRecords.reduce((sum, record) => sum + Number(record.amount), 0);
  const largest = Math.max(...expenseRecords.map((record) => Number(record.amount)), 0);
  const uniqueDays = new Set(expenseRecords.map((record) => record.date)).size || 1;

  statsTotalExpense.textContent = formatMoney(total, defaultCurrency);
  statsDailyAverage.textContent = formatMoney(total / uniqueDays, defaultCurrency);
  statsLargestExpense.textContent = formatMoney(largest, defaultCurrency);
}

function renderDonutChart(rows, totalExpense) {
  if (!rows.length || !totalExpense) {
    donutChart.style.background = "#e2ebe8";
    donutChartLabel.textContent = "本月還沒有支出";
    return;
  }

  const colors = ["#2563eb", "#0f766e", "#c2410c", "#7c3aed", "#0891b2", "#ca8a04", "#be123c"];
  let start = 0;
  const stops = rows.map((row, index) => {
    const end = start + (row.amount / totalExpense) * 100;
    const color = colors[index % colors.length];
    const segment = `${color} ${start}% ${end}%`;
    start = end;
    return segment;
  });
  donutChart.style.background = `conic-gradient(${stops.join(", ")})`;
  donutChartLabel.textContent = `${rows[0].label} 佔最多，${Math.round((rows[0].amount / totalExpense) * 100)}%`;
}

function renderTrendChart(records) {
  const months = getRecentMonths(6);
  const values = months.map((month) => {
    return records
      .filter(
        (record) =>
          record.type === "expense" &&
          (record.currency || defaultCurrency) === defaultCurrency &&
          record.date.startsWith(month.value)
      )
      .reduce((sum, record) => sum + Number(record.amount), 0);
  });
  const max = Math.max(...values, 1);

  trendChart.innerHTML = months
    .map((month, index) => {
      const height = Math.max(8, Math.round((values[index] / max) * 86));
      return `
        <div class="trend-bar">
          <div style="height: ${height}%"></div>
          <span>${month.label}</span>
        </div>
      `;
    })
    .join("");
}

function getRecentMonths(count) {
  const base = new Date(`${state.month}-01T00:00:00`);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(base.getFullYear(), base.getMonth() - (count - index - 1), 1);
    const value = date.toISOString().slice(0, 7);
    const label = new Intl.DateTimeFormat("zh-Hant-HK", { month: "short" }).format(date);
    return { value, label };
  });
}

function renderCustomCategories() {
  const customItems = [
    ...state.customCategories.expense.map((item) => ({ ...item, type: "expense", typeLabel: "支出" })),
    ...state.customCategories.income.map((item) => ({ ...item, type: "income", typeLabel: "收入" })),
  ];

  if (customItems.length === 0) {
    customCategoryList.innerHTML = `<div class="mini-empty">你還沒有新增自訂分類。</div>`;
    return;
  }

  customCategoryList.innerHTML = customItems
    .map(
      (item) => `
        <div class="custom-category-item">
          <span>${escapeHtml(item.icon)} ${escapeHtml(item.label)} · ${item.typeLabel}</span>
          <button type="button" data-type="${item.type}" data-category="${escapeHtml(item.value)}">刪除</button>
        </div>
      `
    )
    .join("");
}

function setActiveView(view) {
  const nextView = view === "add" ? "add" : view;
  viewSections.forEach((section) => {
    section.classList.toggle("is-active", section.dataset.view === nextView);
  });
  navButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.viewTarget === nextView);
  });

  document.body.classList.toggle("sheet-open", nextView === "add");

  if (nextView === "add") {
    amountInput.focus();
  }
}

function renderTripList() {
  tripList.innerHTML = state.trips
    .map((trip) => {
      const count = state.records.filter((record) => (record.tripId || defaultTripId) === trip.id).length;
      const locked = trip.id === defaultTripId;
      return `
        <div class="custom-category-item">
          <span>${escapeHtml(trip.name)} · ${count} 筆</span>
          <button type="button" data-trip="${escapeHtml(trip.id)}" ${locked ? "disabled" : ""}>
            ${locked ? "預設" : "刪除"}
          </button>
        </div>
      `;
    })
    .join("");
}

function getTripScopedRecords() {
  if (state.selectedTrip === "all") return state.records;
  return state.records.filter((record) => (record.tripId || defaultTripId) === state.selectedTrip);
}

function getVisibleRecords(records = state.records) {
  return records
    .filter((record) => {
      if (state.filter === "month") return record.date.startsWith(state.month);
      if (state.filter === "income") return record.type === "income";
      if (state.filter === "expense") return record.type === "expense";
      return true;
    })
    .filter((record) => {
      if (!state.query) return true;
      const text = `${record.note} ${record.categoryLabel} ${record.amount}`.toLowerCase();
      return text.includes(state.query);
    });
}

function calculateTotalsByCurrency(records) {
  return records.reduce((sum, record) => {
    const currency = record.currency || defaultCurrency;
    const current = sum.get(currency) || { income: 0, expense: 0 };
    current[record.type] += Number(record.amount);
    sum.set(currency, current);
    return sum;
  }, new Map());
}

function renderCurrencySummary(totalsByCurrency) {
  const rows = [...totalsByCurrency.entries()]
    .filter(([currency]) => currency !== defaultCurrency)
    .sort(([a], [b]) => a.localeCompare(b));

  if (rows.length === 0) {
    currencySummary.innerHTML = "";
    return;
  }

  currencySummary.innerHTML = rows
    .map(([currency, total]) => {
      const net = total.income - total.expense;
      return `
        <div>
          <span>${currency}</span>
          <strong>${formatMoney(net, currency)}</strong>
        </div>
      `;
    })
    .join("");
}

function findCategory(type, value) {
  const categoryType = type === "income" ? "income" : "expense";
  return getCategories(categoryType).find((item) => item.value === value) || defaultCategories[categoryType][0];
}

function findDefaultCategory(type, value) {
  const categoryType = type === "income" ? "income" : "expense";
  return defaultCategories[categoryType].find((item) => item.value === value) || defaultCategories[categoryType][0];
}

function formatMoney(value, currency = defaultCurrency) {
  return new Intl.NumberFormat("zh-Hant-HK", {
    style: "currency",
    currency,
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("zh-Hant-HK", {
    month: "short",
    day: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function formatMonth(value) {
  return new Intl.DateTimeFormat("zh-Hant-HK", {
    year: "numeric",
    month: "long",
  }).format(new Date(`${value}-01T00:00:00`));
}

function renderReceiptPreview(message = "") {
  if (message) {
    receiptPreview.innerHTML = `<span>${escapeHtml(message)}</span>`;
    return;
  }

  if (!pendingReceiptImage) {
    receiptPreview.innerHTML = "";
    return;
  }

  receiptPreview.innerHTML = `
    <img src="${pendingReceiptImage}" alt="準備儲存的收據或發票照片" />
    <button id="clearReceiptButton" type="button">移除照片</button>
  `;
  document.querySelector("#clearReceiptButton").addEventListener("click", () => {
    pendingReceiptImage = null;
    receiptInput.value = "";
    renderReceiptPreview();
  });
}

function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("error", reject);
    reader.addEventListener("load", () => {
      const image = new Image();
      image.addEventListener("error", reject);
      image.addEventListener("load", () => {
        const scale = Math.min(1, maxReceiptImageSize / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.72));
      });
      image.src = String(reader.result);
    });
    reader.readAsDataURL(file);
  });
}

function backupData() {
  const data = {
    exportedAt: new Date().toISOString(),
    defaultCurrency,
    trips: state.trips.filter((trip) => trip.id !== defaultTripId),
    records: state.records,
    customCategories: state.customCategories,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `我的記帳備份-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
  showToast("已建立備份檔");
}

function restoreData(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const data = JSON.parse(String(reader.result));
      const records = Array.isArray(data.records) ? data.records.map(normalizeRecord).filter(Boolean) : [];
      const customCategories = data.customCategories || {};
      const trips = Array.isArray(data.trips) ? data.trips : [];
      state.records = records;
      state.trips = [
        { id: defaultTripId, name: "日常", budget: 0, theme: "ocean", createdAt: "default" },
        ...trips
          .filter((trip) => trip?.id && trip?.name && trip.id !== defaultTripId)
          .map((trip) => ({
            id: trip.id,
            name: trip.name,
            budget: Number(trip.budget) || 0,
            theme: trip.theme || "ocean",
            createdAt: trip.createdAt || new Date().toISOString(),
          })),
      ];
      state.selectedTrip = "all";
      state.customCategories = {
        expense: Array.isArray(customCategories.expense) ? customCategories.expense : [],
        income: Array.isArray(customCategories.income) ? customCategories.income : [],
      };
      saveRecords();
      saveTrips();
      saveCustomCategories();
      renderTrips();
      renderCategories();
      render();
      showToast("已還原備份");
    } catch {
      alert("這個備份檔案讀取失敗，請確認檔案是否正確。");
    } finally {
      event.target.value = "";
    }
  });
  reader.readAsText(file);
}

let toastTimer = null;
function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2200);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
}
