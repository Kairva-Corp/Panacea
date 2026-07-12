const API_BASE = "http://localhost:5000";

const stores = [
  { key:"apollo",   name:"Apollo Pharmacy", color:"#c0392b", urlBase:"https://www.apollopharmacy.in/search-medicines/" },
  { key:"tata1mg",  name:"Tata 1mg",        color:"#1f6fb2", urlBase:"https://www.1mg.com/search/all?name=" },
  { key:"truemeds", name:"Truemeds",        color:"#1e8a73", urlBase:"https://www.truemeds.in/search/" },
  { key:"netmeds",  name:"Netmeds",         color:"#d98324", urlBase:"https://www.netmeds.com/catalogsearch/result?q=" },
];

let lastQuery = "";
const medicineInput = document.getElementById("medicine");
const compareBtn    = document.getElementById("compare");
const loadingEl     = document.getElementById("loading");
const errorEl       = document.getElementById("error");
const errorMsg      = document.getElementById("errorMsg");
const retryBtn      = document.getElementById("retryBtn");
const resultsEl     = document.getElementById("results");
const resMedName    = document.getElementById("resMedName");
const resMeta       = document.getElementById("resMeta");
const monograph     = document.getElementById("monograph");
const summaryStrip  = document.getElementById("summaryStrip");
const storeGrid     = document.getElementById("storeGrid");

function todayStr(){
  const d = new Date();
  return d.toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });
}
document.getElementById("dateStamp").innerHTML = "<b>Rx // " + todayStr() + "</b>";
document.getElementById("footDate").textContent = "last verified " + todayStr();

function formatRs(n){
  if (n == null || isNaN(n)) return "\u2014";
  return "\u20B9" + Number(n).toLocaleString("en-IN", { maximumFractionDigits:0 });
}

function escHtml(s){
  if (!s) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

compareBtn.addEventListener("click", () => runSearch(medicineInput.value));
medicineInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") runSearch(e.target.value);
});
retryBtn.addEventListener("click", () => runSearch(lastQuery));
document.querySelectorAll(".chip").forEach(chip => {
  chip.addEventListener("click", () => {
    medicineInput.value = chip.dataset.med;
    runSearch(chip.dataset.med);
  });
});

async function runSearch(name){
  name = name.trim();
  if (!name) return;
  if (name === lastQuery && resultsEl.classList.contains("active")) return;
  lastQuery = name;

  resultsEl.classList.remove("active");
  errorEl.classList.remove("active");
  showLoading(true);

  try {
    const resp = await fetch(API_BASE + "/check-price", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ medicine_name: name }),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error || "HTTP " + resp.status);
    }
    const data = await resp.json();
    renderResults(data);
  } catch (err) {
    showError(err.message || "Network error. Is the backend running?");
  } finally {
    showLoading(false);
  }
}

function showLoading(on){
  compareBtn.disabled = on;
  compareBtn.textContent = on ? "searching\u2026" : "Compare prices \u2192";
  loadingEl.classList.toggle("active", on);
}

function showError(msg){
  errorEl.classList.add("active");
  errorMsg.textContent = msg;
}

function renderResults(data){
  const results = data.results || [];

  resMedName.textContent = data.medicine_name || lastQuery;

  // Meta
  const bestPrice = results.reduce((min, r) => (r.price && r.price < min ? r.price : min), Infinity);
  resMeta.textContent = results.length + " product" + (results.length !== 1 ? "s" : "") + " found" +
    (bestPrice < Infinity ? " \u00B7 from " + formatRs(bestPrice) : "");

  // Monograph
  const salt = data.salt_name || "";
  const firstResult = results[0];
  monograph.innerHTML =
    '<div class="mono-field"><div class="k">Composition</div><div class="v">' + escHtml(salt || data.medicine_name || lastQuery) + '</div></div>' +
    '<div class="mono-field"><div class="k">Category</div><div class="v cat">Cardiovascular / chronic therapy</div></div>' +
    '<div class="mono-field"><div class="k">Results from</div><div class="v">' + results.length + ' listing' + (results.length !== 1 ? "s" : "") + '</div></div>';

  // Summary strip
  const inStock = results.filter(r => r.in_stock);
  const cheapest = inStock.length ? inStock.reduce((a, b) => (a.price || 9999) < (b.price || 9999) ? a : b) : null;
  const priciest = inStock.length ? inStock.reduce((a, b) => (a.price || 0) > (b.price || 0) ? a : b) : null;
  const savings = (cheapest && priciest && priciest.price > cheapest.price) ? priciest.price - cheapest.price : 0;

  summaryStrip.innerHTML = cheapest
    ? "<span>cheapest overall \u2014 <strong>" + escHtml(cheapest.name) + "</strong> at <strong>" + escHtml(cheapest.seller) + "</strong>, " + formatRs(cheapest.price) + " per pack</span>" +
      (savings > 0 ? "<span>save " + formatRs(savings) + "/month vs priciest option</span>" : "")
    : "<span>no pharmacy currently has this in stock</span>";

  // Build store grid
  storeGrid.innerHTML = "";

  stores.forEach(store => {
    const storeResults = results.filter(r => r.seller === store.name);

    const col = document.createElement("div");
    col.className = "store-col";
    col.style.setProperty("--store-color", store.color);

    const buyUrl = store.urlBase + encodeURIComponent(data.medicine_name || lastQuery);

    const rows = storeResults.map(r => {
      const isBest = cheapest && r === cheapest;
      const stockClass = r.in_stock ? "in" : "out";
      const stockLabel = r.in_stock ? "in stock" : "out of stock";
      const linkUrl = r.url || buyUrl;

      return '<div class="listing' + (isBest ? " best" : "") + (r.in_stock ? "" : " out") + '">' +
        (isBest ? '<div class="listing-badge">best</div>' : "") +
        '<div class="listing-brand">' + escHtml(r.name) + "</div>" +
        (r.is_generic ? '<div class="listing-generic">Generic</div>' : "") +
        '<div class="listing-price-row">' +
          (r.mrp && r.mrp !== r.price ? '<div class="listing-mrp">' + formatRs(r.mrp) + "</div>" : "") +
          '<div class="listing-price">' + (r.price ? formatRs(r.price) : "\u2014") + "</div>" +
        "</div>" +
        '<div class="listing-pack">' + escHtml(r.pack_size || "\u2014") + "</div>" +
        '<div class="listing-foot">' +
          '<span class="stamp ' + stockClass + '">' + stockLabel + "</span>" +
          '<a class="buy-link" href="' + escHtml(linkUrl) + '" target="_blank" rel="noopener">buy \u2197</a>' +
        "</div>" +
      "</div>";
    }).join("");

    col.innerHTML =
      '<div class="store-head">' +
        '<span class="dot"></span>' +
        '<span class="name">' + escHtml(store.name) + "</span>" +
        '<span class="count">' + storeResults.length + " option" + (storeResults.length !== 1 ? "s" : "") + "</span>" +
      "</div>" +
      (rows || '<div style="padding:12px 0;font-size:13px;color:rgba(241,232,214,.5);font-style:italic;">no results</div>');

    storeGrid.appendChild(col);
  });

  resultsEl.classList.add("active");
  resultsEl.scrollIntoView({ behavior:"smooth", block:"start" });
}
