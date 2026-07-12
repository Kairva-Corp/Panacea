/* ============================================================
   Panacea — app.js
   All interactivity: search, live status, table, slider, sort/filter
   ============================================================ */

const API_BASE = "http://localhost:5000";
const DEBOUNCE_MS = 450;

/* ---- State ---- */
let allResults = [];
let savingsData = {};
let currentFilter = "all";
let sortCol = "price";
let sortDir = "asc";
let lastQuery = "";
let debounceTimer = null;
let fetchedTimestamp = null;
let timestampTimer = null;

/* ---- DOM refs ---- */
const medicineInput     = document.getElementById("medicineInput");
const currentPriceInput = document.getElementById("currentPriceInput");
const checkBtn          = document.getElementById("checkBtn");
const suggestions       = document.getElementById("suggestions");
const resultsSection    = document.getElementById("resultsSection");
const loadingState      = document.getElementById("loadingState");
const resultsContent    = document.getElementById("resultsContent");
const errorState        = document.getElementById("errorState");
const errorMsg          = document.getElementById("errorMsg");
const retryBtn          = document.getElementById("retryBtn");
const tableBody         = document.getElementById("tableBody");
const noResults         = document.getElementById("noResults");
const resultCount       = document.getElementById("resultCount");
const savingsNumber     = document.getElementById("savingsNumber");
const savingsPct        = document.getElementById("savingsPct");
const headlineMedicine  = document.getElementById("headlineMedicine");
const headlineSalt      = document.getElementById("headlineSalt");
const headlineSavingsText = document.getElementById("headlineSavingsText");
const sourceBadges      = document.getElementById("sourceBadges");
const timestampEl       = document.getElementById("timestamp");
const priceSlider       = document.getElementById("priceSlider");
const sliderCurrentDisplay = document.getElementById("sliderCurrentDisplay");

/* ---- Suggestion chips ---- */
document.querySelectorAll(".suggestion-chip").forEach(chip => {
  chip.addEventListener("click", () => {
    medicineInput.value = chip.dataset.query;
    suggestions.classList.remove("show");
    triggerSearch();
  });
});

/* ---- Input focus: show suggestions when empty ---- */
medicineInput.addEventListener("focus", () => {
  if (!medicineInput.value.trim()) suggestions.classList.add("show");
});
medicineInput.addEventListener("blur", () => {
  setTimeout(() => suggestions.classList.remove("show"), 180);
});

/* ---- Debounced search on type ---- */
medicineInput.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  const v = medicineInput.value.trim();
  if (v.length === 0) {
    suggestions.classList.add("show");
    return;
  }
  suggestions.classList.remove("show");
  if (v.length < 2) return;
  debounceTimer = setTimeout(() => triggerSearch(), DEBOUNCE_MS);
});

/* ---- Manual check button ---- */
checkBtn.addEventListener("click", () => {
  clearTimeout(debounceTimer);
  triggerSearch();
});

medicineInput.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    clearTimeout(debounceTimer);
    triggerSearch();
  }
});

/* ---- Current price input → sync slider ---- */
currentPriceInput.addEventListener("input", () => {
  const v = parseFloat(currentPriceInput.value) || 0;
  priceSlider.value = Math.min(v, 2000);
  sliderCurrentDisplay.textContent = v;
  recalcSavingsFromSlider(v);
});

/* ---- Slider ---- */
priceSlider.addEventListener("input", () => {
  const v = parseInt(priceSlider.value);
  sliderCurrentDisplay.textContent = v;
  currentPriceInput.value = v > 0 ? v : "";
  recalcSavingsFromSlider(v);
});

/* ---- Filter chips ---- */
document.querySelectorAll(".chip").forEach(chip => {
  chip.addEventListener("click", () => {
    document.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    currentFilter = chip.dataset.filter;
    renderTable();
  });
});

/* ---- Sortable headers ---- */
document.querySelectorAll("th.sortable").forEach(th => {
  th.addEventListener("click", () => {
    const col = th.dataset.col;
    if (sortCol === col) {
      sortDir = sortDir === "asc" ? "desc" : "asc";
    } else {
      sortCol = col;
      sortDir = "asc";
    }
    document.querySelectorAll("th.sortable").forEach(t => t.classList.remove("active-sort"));
    th.classList.add("active-sort");
    const icon = th.querySelector(".sort-icon");
    icon.textContent = sortDir === "asc" ? "↑" : "↓";
    renderTable();
  });
});

/* ---- Retry ---- */
retryBtn.addEventListener("click", () => triggerSearch());

/* ============================================================
   Core search flow
   ============================================================ */
async function triggerSearch() {
  const medicine = medicineInput.value.trim();
  if (!medicine) return;
  if (medicine === lastQuery) return;
  lastQuery = medicine;

  const currentPrice = parseFloat(currentPriceInput.value) || null;

  showLoading();
  setCheckBtnLoading(true);

  try {
    const resp = await fetch(`${API_BASE}/check-price`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ medicine_name: medicine, current_price: currentPrice }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${resp.status}`);
    }

    const data = await resp.json();
    handleResults(data);
  } catch (err) {
    showError(err.message || "Network error. Is the backend running?");
  } finally {
    setCheckBtnLoading(false);
  }
}

/* ---- Handle successful response ---- */
function handleResults(data) {
  allResults = data.results || [];
  savingsData = data.savings || {};
  fetchedTimestamp = data.timestamp || Math.floor(Date.now() / 1000);

  // Update headline card
  headlineMedicine.textContent = data.medicine_name || "";
  if (data.salt_name) {
    headlineSalt.textContent = `Salt: ${data.salt_name}`;
  } else {
    headlineSalt.textContent = "";
  }

  // Sync slider to current price
  const baseline = savingsData.baseline || 0;
  priceSlider.value = Math.min(baseline, 2000);
  sliderCurrentDisplay.textContent = Math.round(baseline);
  if (baseline > 0) currentPriceInput.value = Math.round(baseline);

  updateSavingsDisplay(savingsData);

  // Source status badges
  renderSourceBadges(data.site_statuses || {}, data.sites_used || [], data.sites_skipped || []);

  // Render table
  renderTable();

  // Update timestamp
  clearInterval(timestampTimer);
  updateTimestamp();
  timestampTimer = setInterval(updateTimestamp, 10000);

  showResults();
}

/* ---- Savings display ---- */
function updateSavingsDisplay(savings) {
  const amount = savings.headline_savings || 0;
  const pct    = savings.savings_pct || 0;
  const cheapest = savings.cheapest_seller || "";

  animateSavingsNumber(amount);

  if (amount > 0) {
    savingsPct.textContent = `${pct}% off · Best price at ${cheapest}`;
    headlineSavingsText.textContent = `Cheapest: ₹${formatPrice(savings.cheapest)} · Baseline: ₹${formatPrice(savings.baseline)}`;
  } else {
    savingsPct.textContent = "";
    headlineSavingsText.textContent = savings.baseline
      ? `Best price found: ₹${formatPrice(savings.cheapest || savings.baseline)}`
      : "No price data available.";
  }
}

let animFrame = null;
function animateSavingsNumber(target) {
  if (animFrame) cancelAnimationFrame(animFrame);
  const el = savingsNumber;
  const start = parseInt(el.textContent) || 0;
  const startTime = performance.now();
  const dur = 450;

  function step(now) {
    const t = Math.min((now - startTime) / dur, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.round(start + (target - start) * ease);
    if (t < 1) animFrame = requestAnimationFrame(step);
    else el.textContent = Math.round(target);
  }
  animFrame = requestAnimationFrame(step);
}

/* ---- Slider recalc (no re-fetch) ---- */
function recalcSavingsFromSlider(currentPrice) {
  if (!allResults.length) return;
  const prices = allResults.map(r => r.price).filter(Boolean);
  if (!prices.length) return;

  const cheapest = Math.min(...prices);
  const baseline = currentPrice > 0 ? currentPrice : (savingsData.baseline || 0);
  const savings  = Math.max(baseline - cheapest, 0);
  const pct      = baseline > 0 ? ((savings / baseline) * 100).toFixed(1) : 0;
  const cheapestItem = allResults.find(r => r.price === cheapest);

  animateSavingsNumber(savings);

  if (savings > 0) {
    savingsPct.textContent = `${pct}% off · Best price at ${cheapestItem?.seller || ""}`;
    headlineSavingsText.textContent = `Cheapest: ₹${formatPrice(cheapest)} · Your price: ₹${formatPrice(baseline)}`;
  } else {
    savingsPct.textContent = "";
    headlineSavingsText.textContent = cheapest > 0 ? `Best price: ₹${formatPrice(cheapest)}` : "";
  }
}

/* ---- Table render ---- */
function renderTable() {
  // Filter
  let rows = [...allResults];
  if (currentFilter === "branded")  rows = rows.filter(r => !r.is_generic);
  if (currentFilter === "generic")  rows = rows.filter(r => r.is_generic);
  if (currentFilter === "instock")  rows = rows.filter(r => r.in_stock);

  // Sort
  rows.sort((a, b) => {
    let av = a[sortCol], bv = b[sortCol];
    if (typeof av === "string") av = av.toLowerCase();
    if (typeof bv === "string") bv = bv.toLowerCase();
    if (av === null || av === undefined) av = sortDir === "asc" ? Infinity : -Infinity;
    if (bv === null || bv === undefined) bv = sortDir === "asc" ? Infinity : -Infinity;
    return sortDir === "asc" ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
  });

  resultCount.textContent = rows.length ? `${rows.length} result${rows.length > 1 ? "s" : ""}` : "";

  if (!rows.length) {
    tableBody.innerHTML = "";
    noResults.style.display = "block";
    return;
  }
  noResults.style.display = "none";

  const cheapestPrice = Math.min(...rows.map(r => r.price).filter(Boolean));

  tableBody.innerHTML = "";
  rows.forEach((row, idx) => {
    const isBest = row.price === cheapestPrice && row.price != null;
    const tr = document.createElement("tr");
    tr.className = isBest ? "best-row" : "";
    tr.dataset.idx = idx;

    tr.innerHTML = `
      <td class="name-cell">
        <div class="product-name">${escHtml(row.name || "—")}</div>
        ${row.salt ? `<div class="product-name-sub">${escHtml(row.salt)}</div>` : ""}
        ${isBest ? `<span class="best-badge">★ Best price</span>` : ""}
      </td>
      <td class="price-cell ${isBest ? "best-price" : ""}">₹${formatPrice(row.price)}</td>
      <td class="mrp-cell">${row.mrp && row.mrp !== row.price ? `₹${formatPrice(row.mrp)}` : "—"}</td>
      <td>${escHtml(row.seller || "—")}</td>
      <td>${escHtml(row.pack_size || "—")}</td>
      <td><span class="${row.in_stock ? "stock-in" : "stock-out"}">${row.in_stock ? "✓ In stock" : "✗ Out of stock"}</span></td>
      <td><span class="type-badge ${row.is_generic ? "type-generic" : "type-branded"}">${row.is_generic ? "Generic" : "Branded"}</span></td>
      <td>
        <button class="expand-btn" title="Expand" data-idx="${idx}">
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
        </button>
      </td>
    `;
    tableBody.appendChild(tr);
  });

  /* Expand/collapse rows */
  tableBody.querySelectorAll(".expand-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const idx = btn.dataset.idx;
      const row = rows[idx];
      const tr = btn.closest("tr");
      const existingDetail = tr.nextSibling;

      if (existingDetail && existingDetail.classList && existingDetail.classList.contains("detail-row")) {
        existingDetail.remove();
        btn.querySelector("svg path").setAttribute("d", "M19 9l-7 7-7-7");
        return;
      }

      // Close others
      tableBody.querySelectorAll(".detail-row").forEach(d => d.remove());
      tableBody.querySelectorAll(".expand-btn svg path").forEach(p => p.setAttribute("d", "M19 9l-7 7-7-7"));

      const detailTr = document.createElement("tr");
      detailTr.className = "detail-row";
      detailTr.innerHTML = `
        <td colspan="8">
          <div class="row-expanded-detail">
            <span class="detail-item"><strong>Pack size:</strong> ${escHtml(row.pack_size || "N/A")}</span>
            <span class="detail-item"><strong>Price:</strong> ₹${formatPrice(row.price)}</span>
            <span class="detail-item"><strong>MRP:</strong> ₹${formatPrice(row.mrp || row.price)}</span>
            <span class="detail-item"><strong>Stock:</strong> ${row.in_stock ? "In stock" : "Out of stock"}</span>
            ${row.salt ? `<span class="detail-item"><strong>Salt:</strong> ${escHtml(row.salt)}</span>` : ""}
            ${row.url ? `<a href="${escHtml(row.url)}" target="_blank" rel="noopener" class="detail-link">View on ${escHtml(row.seller)} ↗</a>` : ""}
          </div>
        </td>`;
      tr.after(detailTr);
      btn.querySelector("svg path").setAttribute("d", "M19 15l-7-7-7 7");
    });
  });
}

/* ---- Source status badges ---- */
function renderSourceBadges(statuses, used, skipped) {
  sourceBadges.innerHTML = "";
  Object.entries(statuses).forEach(([name, status]) => {
    const isOk = used.includes(name);
    const badge = document.createElement("div");
    badge.className = `source-badge ${isOk ? "ok" : "skip"}`;
    badge.textContent = `${isOk ? "✓" : "⚠"} ${name}: ${status}`;
    sourceBadges.appendChild(badge);
  });
}

/* ---- Timestamp ---- */
function updateTimestamp() {
  if (!fetchedTimestamp) return;
  const diff = Math.floor(Date.now() / 1000) - fetchedTimestamp;
  let txt;
  if (diff < 60) txt = `Updated ${diff}s ago`;
  else if (diff < 3600) txt = `Updated ${Math.floor(diff / 60)}m ago`;
  else txt = `Updated ${Math.floor(diff / 3600)}h ago`;
  timestampEl.textContent = txt;
}

/* ---- UI state helpers ---- */
function showLoading() {
  errorState.style.display   = "none";
  resultsContent.style.display = "none";
  loadingState.style.display = "block";
  resultsSection.style.display = "block";
  // Reset source statuses
  ["Apollo-Pharmacy", "Tata-1mg", "Truemeds", "Netmeds"].forEach(id => {
    const el = document.getElementById(`status-${id}`);
    if (el) {
      el.querySelector(".source-icon").className = "source-icon searching";
      el.querySelector(".source-state").textContent = "searching…";
    }
  });
}

function showResults() {
  loadingState.style.display   = "none";
  errorState.style.display     = "none";
  resultsContent.style.display = "block";
  resultsSection.style.display = "block";
}

function showError(msg) {
  loadingState.style.display   = "none";
  resultsContent.style.display = "none";
  errorState.style.display     = "block";
  resultsSection.style.display = "block";
  errorMsg.textContent = msg;
}

function setCheckBtnLoading(loading) {
  checkBtn.disabled = loading;
  checkBtn.querySelector(".btn-text").textContent = loading ? "Searching…" : "Check Price";
}

/* ---- Helpers ---- */
function formatPrice(n) {
  if (n === null || n === undefined || isNaN(n)) return "—";
  return parseFloat(n).toFixed(2).replace(/\.00$/, "");
}
function escHtml(s) {
  if (!s) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
