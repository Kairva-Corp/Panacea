const API_BASE = "http://localhost:5000";

const stores = [
  { key:"apollo",   name:"Apollo Pharmacy", color:"#c0392b", urlBase:"https://www.apollopharmacy.in/search-medicines/" },
  { key:"tata1mg",  name:"Tata 1mg",        color:"#1f6fb2", urlBase:"https://www.1mg.com/search/all?name=" },
  { key:"netmeds",  name:"Netmeds",         color:"#d98324", urlBase:"https://www.netmeds.com/catalogsearch/result?q=" },
];

let lastQuery = "";
let lastDataCache = null;
let currentLang = "en";

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
const langSelect    = document.getElementById("langSelect");

// Dictionary of translations
const translations = {
  en: {
    sub: "medicine price transparency",
    rxChecked: "Rx // checked",
    pharmaciesLine: "comparing live counters at <span>Apollo Pharmacy</span>, <span>Tata 1mg</span> &amp; <span>Netmeds</span> — no sign-up required",
    searchLabel: "Enter medicine name",
    searchPlaceholder: "e.g. Telmisartan 40mg",
    compareBtn: "Compare prices →",
    compareBtnSearching: "searching…",
    hint: "Built for chronic prescriptions — the ones you refill every month, where a few rupees per strip adds up.",
    loading: "checking three counters",
    indicative: "Panacea · prices &amp; product details shown are indicative, verify at checkout",
    lastVerified: "last verified ",
    composition: "Composition",
    category: "Category",
    categoryVal: "Cardiovascular / chronic therapy",
    resultsFrom: "Results from",
    listing: "listing",
    listings: "listings",
    inStock: "in stock",
    outStock: "out of stock",
    buy: "buy ↗",
    best: "best",
    options: "options",
    option: "option",
    cheapestOverall: "cheapest overall — <strong>{name}</strong> at <strong>{seller}</strong>, {price} per pack",
    savePris: "save {savings}/month vs priciest option",
    noStock: "no pharmacy currently has this in stock",
    noResults: "no results",
    foundSuffix: " found"
  },
  hi: {
    sub: "दवाइयों के दाम की पारदर्शिता",
    rxChecked: "Rx // जाँचा गया",
    pharmaciesLine: "<span>अपोलो फार्मेसी</span>, <span>टाटा 1mg</span> और <span>नेटमैड्स</span> के लाइव काउंटरों की तुलना — किसी साइन-अप की आवश्यकता नहीं है",
    searchLabel: "दवा का नाम दर्ज करें",
    searchPlaceholder: "जैसे: टेल्मिसार्टन 40mg",
    compareBtn: "दामों की तुलना करें →",
    compareBtnSearching: "खोज की जा रही है...",
    hint: "लंबे समय के पर्चे (बीपी, मधुमेह आदि) के लिए निर्मित — जिन्हें आप हर महीने दोबारा लेते हैं, जहाँ प्रति पत्ता कुछ रुपये भी बड़ी बचत बनते हैं।",
    loading: "तीनों फार्मेसी चेक की जा रही हैं",
    indicative: "पनेशिया · दिखाए गए दाम और उत्पाद विवरण सांकेतिक हैं, भुगतान के समय जांच लें",
    lastVerified: "अंतिम बार जाँचा गया ",
    composition: "संरचना (साल्ट)",
    category: "श्रेणी",
    categoryVal: "हृदय रोग / पुरानी बीमारी की थेरेपी",
    resultsFrom: "यहाँ से परिणाम",
    listing: "परिणाम",
    listings: "परिणाम",
    inStock: "स्टॉक में है",
    outStock: "स्टॉक में नहीं है",
    buy: "खरीदें ↗",
    best: "सर्वश्रेष्ठ",
    options: "विकल्प",
    option: "विकल्प",
    cheapestOverall: "सबसे सस्ता विकल्प — <strong>{seller}</strong> पर <strong>{name}</strong>, {price} प्रति पैक",
    savePris: "सबसे महंगे विकल्प की तुलना में {savings}/महीने बचाएं",
    noStock: "वर्तमान में किसी भी फार्मेसी में यह उपलब्ध नहीं है",
    noResults: "कोई परिणाम नहीं",
    foundSuffix: " परिणाम मिले"
  },
  gu: {
    sub: "દવાઓના ભાવની પારદર્શિતા",
    rxChecked: "Rx // ચકાસાયેલ",
    pharmaciesLine: "<span>એપોલો ફાર્મસી</span>, <span>ટાટા 1mg</span> અને <span>નેટમેડ્સ</span>ના લાઈવ કાઉન્ટરની સરખામણી — કોઈ સાઇન-અપની જરૂર નથી",
    searchLabel: "દવા નું નામ લખો",
    searchPlaceholder: "જેમ કે: ટેલ્મિસારટન 40mg",
    compareBtn: "ભાવ સરખાવો →",
    compareBtnSearching: "શોધાઈ રહ્યું છે...",
    hint: "લાંબા ગાળાની દવાઓ માટે બનાવેલ — જે તમે દર મહિને ખરીદો છો, જ્યાં દરેક પત્તા પર થોડા રૂપિયા પણ મોટી બચત આપે છે.",
    loading: "ત્રણેય ફાર્મસી ચેક થઈ રહી છે",
    indicative: "પેનેસિયા · દર્શાવેલ ભાવો અને ઉત્પાદનની વિગતો સૂચક છે, ચેકઆઉટ વખતે ચકાસો",
    lastVerified: "છેલ્લે ચકાસાયેલ ",
    composition: "બંધારણ (સાલ્ટ)",
    category: "કેટેગરી",
    categoryVal: "કાર્ડિયોવાસ્ક્યુલર / ક્રોનિક થેરાપી",
    resultsFrom: "અહીંથી પરિણામો",
    listing: "પરિણામ",
    listings: "પરિણામો",
    inStock: "સ્ટોકમાં છે",
    outStock: "સ્ટોક નથી",
    buy: "ખરીદો ↗",
    best: "શ્રેષ્ઠ",
    options: "વિકલ્પો",
    option: "વિકલ્પ",
    cheapestOverall: "સૌથી સસ્તું — <strong>{seller}</strong> પર <strong>{name}</strong>, પેક દીઠ {price}",
    savePris: "સૌથી મોંઘા વિકલ્પની સરખામણીમાં {savings}/મહિને બચાવો",
    noStock: "હાલમાં કોઈ ફાર્મસીમાં આ સ્ટોક ઉપલબ્ધ નથી",
    noResults: "પરિણામ નથી",
    foundSuffix: " પરિણામો મળ્યા"
  }
};

function todayStr(){
  const d = new Date();
  return d.toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });
}

function formatRs(n){
  if (n == null || isNaN(n)) return "—";
  return "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits:0 });
}

function escHtml(s){
  if (!s) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function applyLanguage(lang) {
  const t = translations[lang];
  document.getElementById("lblSub").textContent = t.sub;
  document.getElementById("dateStamp").innerHTML = "<b>" + t.rxChecked + " // " + todayStr() + "</b>";
  document.getElementById("lblPharmacies").innerHTML = t.pharmaciesLine;
  document.getElementById("lblSearchLabel").textContent = t.searchLabel;
  document.getElementById("medicine").placeholder = t.searchPlaceholder;
  compareBtn.textContent = compareBtn.disabled ? t.compareBtnSearching : t.compareBtn;
  document.getElementById("lblHint").textContent = t.hint;
  document.getElementById("loading").textContent = t.loading;
  document.getElementById("lblFooter").innerHTML = t.indicative;
  document.getElementById("footDate").textContent = t.lastVerified + todayStr();
}

// Initial application
applyLanguage(currentLang);

langSelect.addEventListener("change", (e) => {
  currentLang = e.target.value;
  applyLanguage(currentLang);
  if (lastDataCache) {
    renderResults(lastDataCache);
  }
});

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
    lastDataCache = data;
    renderResults(data);
  } catch (err) {
    showError(err.message || "Network error. Is the backend running?");
  } finally {
    showLoading(false);
  }
}

function showLoading(on){
  compareBtn.disabled = on;
  const t = translations[currentLang];
  compareBtn.textContent = on ? t.compareBtnSearching : t.compareBtn;
  loadingEl.classList.toggle("active", on);
}

// Global handle for script reference
window.showLoading = showLoading;

function showError(msg){
  errorEl.classList.add("active");
  errorMsg.textContent = msg;
}

function renderResults(data){
  const results = data.results || [];
  const t = translations[currentLang];

  // Display original query and English translation parenthetically if they differ
  if (data.original_name && data.medicine_name && data.original_name.toLowerCase() !== data.medicine_name.toLowerCase()) {
    resMedName.innerHTML = escHtml(data.original_name) + ' <span style="font-size:22px; color:var(--ink-soft); font-weight:normal; font-family:\'IBM Plex Mono\', monospace;">(' + escHtml(data.medicine_name) + ')</span>';
  } else {
    resMedName.textContent = data.medicine_name || lastQuery;
  }

  // Meta
  const bestPrice = results.reduce((min, r) => (r.price && r.price < min ? r.price : min), Infinity);
  let metaText = results.length + " " + (results.length !== 1 ? t.listings : t.listing) + t.foundSuffix;
  if (bestPrice < Infinity) {
    metaText += " · " + (currentLang === "en" ? "from " : (currentLang === "hi" ? "न्यूनतम " : "ન્યૂનતમ ")) + formatRs(bestPrice);
  }
  resMeta.textContent = metaText;

  // Monograph
  const salt = data.salt_name || "";
  monograph.innerHTML =
    '<div class="mono-field"><div class="k">' + t.composition + '</div><div class="v">' + escHtml(salt || data.medicine_name || lastQuery) + '</div></div>' +
    '<div class="mono-field"><div class="k">' + t.category + '</div><div class="v cat">' + t.categoryVal + '</div></div>' +
    '<div class="mono-field"><div class="k">' + t.resultsFrom + '</div><div class="v">' + results.length + ' ' + (results.length !== 1 ? t.listings : t.listing) + '</div></div>';

  // Summary strip
  const inStock = results.filter(r => r.in_stock);
  const cheapest = inStock.length ? inStock.reduce((a, b) => (a.price || 9999) < (b.price || 9999) ? a : b) : null;
  const priciest = inStock.length ? inStock.reduce((a, b) => (a.price || 0) > (b.price || 0) ? a : b) : null;
  const savings = (cheapest && priciest && priciest.price > cheapest.price) ? priciest.price - cheapest.price : 0;

  if (cheapest) {
    let cheapestTxt = t.cheapestOverall
      .replace("{name}", escHtml(cheapest.name))
      .replace("{seller}", escHtml(cheapest.seller))
      .replace("{price}", formatRs(cheapest.price));
    let savingsTxt = savings > 0 
      ? t.savePris.replace("{savings}", formatRs(savings))
      : "";
    summaryStrip.innerHTML = "<span>" + cheapestTxt + "</span>" + (savingsTxt ? "<span>" + savingsTxt + "</span>" : "");
  } else {
    summaryStrip.innerHTML = "<span>" + t.noStock + "</span>";
  }

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
      const stockLabel = r.in_stock ? t.inStock : t.outStock;
      const linkUrl = r.url || buyUrl;

      return '<div class="listing' + (isBest ? " best" : "") + (r.in_stock ? "" : " out") + '">' +
        (isBest ? '<div class="listing-badge">' + t.best + '</div>' : "") +
        '<div class="listing-brand">' + escHtml(r.name) + "</div>" +
        (r.is_generic ? '<div class="listing-generic">Generic</div>' : "") +
        '<div class="listing-price-row">' +
          (r.mrp && r.mrp !== r.price ? '<div class="listing-mrp">' + formatRs(r.mrp) + "</div>" : "") +
          '<div class="listing-price">' + (r.price ? formatRs(r.price) : "—") + "</div>" +
        "</div>" +
        '<div class="listing-pack">' + escHtml(r.pack_size || "—") + "</div>" +
        '<div class="listing-foot">' +
          '<span class="stamp ' + stockClass + '">' + stockLabel + "</span>" +
          '<a class="buy-link" href="' + escHtml(linkUrl) + '" target="_blank" rel="noopener">' + t.buy + '</a>' +
        "</div>" +
      "</div>";
    }).join("");

    col.innerHTML =
      '<div class="store-head">' +
        '<span class="dot"></span>' +
        '<span class="name">' + escHtml(store.name) + "</span>" +
        '<span class="count">' + storeResults.length + " " + (storeResults.length !== 1 ? t.options : t.option) + "</span>" +
      "</div>" +
      (rows || '<div style="padding:12px 0;font-size:13px;color:rgba(241,232,214,.5);font-style:italic;">' + t.noResults + '</div>');

    storeGrid.appendChild(col);
  });

  resultsEl.classList.add("active");
  resultsEl.scrollIntoView({ behavior:"smooth", block:"start" });
}
