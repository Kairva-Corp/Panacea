const API_BASE = "http://localhost:5000";

const stores = [
  { key:"apollo",   name:"Apollo Pharmacy", color:"#c0392b", urlBase:"https://www.apollopharmacy.in/search-medicines/" },
  { key:"tata1mg",  name:"Tata 1mg",        color:"#1f6fb2", urlBase:"https://www.1mg.com/search/all?name=" },
  { key:"netmeds",  name:"Netmeds",         color:"#d98324", urlBase:"https://www.netmeds.com/catalogsearch/result?q=" },
];

let lastQuery = "";
let lastDataCache = null;
let currentLang = "en";

let cart = JSON.parse(localStorage.getItem("panaceaCart") || "[]");

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
const micBtn        = document.getElementById("micBtn");
const cartBtn       = document.getElementById("cartBtn");
const cartCount     = document.getElementById("cartCount");
const cartOverlay   = document.getElementById("cartOverlay");
const cartClose     = document.getElementById("cartClose");
const cartItems     = document.getElementById("cartItems");
const cartEmpty     = document.getElementById("cartEmpty");
const cartTotal     = document.getElementById("cartTotal");
const cartClear     = document.getElementById("cartClear");
const cartExportPdf = document.getElementById("cartExportPdf");

// Dictionary of translations
const translations = {
  en: {
    pharmaciesLine: "comparing live counters at <span>Apollo Pharmacy</span>, <span>Tata 1mg</span> &amp; <span>Netmeds</span> — no sign-up required",
    searchLabel: "Enter medicine name",
    searchPlaceholder: "e.g. Telmisartan 40mg",
    compareBtn: "Compare prices →",
    compareBtnSearching: "searching…",
    hint: "Make sure you have prescription from a certified doctor before ordering medications.",
    loading: "checking three counters",
    indicative: "Panacea by Kairva Corp · prices &amp; product details shown are indicative, verify at checkout",
    noAccount: "No account needed to compare",
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
    foundSuffix: " found",
    cartTitle: "Your Cart",
    cartEmpty: "Your cart is empty",
    cartTotal: "Total",
    cartClear: "Clear",
    cartExportPdf: "Export PDF",
    addToCart: "add to cart",
    added: "added",
    pdfTitle: "Panacea — Cart Summary",
    pdfMedicine: "Medicine",
    pdfStore: "Store",
    pdfPrice: "Price",
    pdfBuyLink: "Buy Link",
    pdfGrandTotal: "Grand Total",
    remove: "remove"
  },
  hi: {
    pharmaciesLine: "<span>अपोलो फार्मेसी</span>, <span>टाटा 1mg</span> और <span>नेटमैड्स</span> के लाइव काउंटरों की तुलना — किसी साइन-अप की आवश्यकता नहीं है",
    searchLabel: "दवा का नाम दर्ज करें",
    searchPlaceholder: "जैसे: टेल्मिसार्टन 40mg",
    compareBtn: "दामों की तुलना करें →",
    compareBtnSearching: "खोज की जा रही है...",
    hint: "ऑर्डर करने से पहले सुनिश्चित करें कि आपके पास प्रमाणित डॉक्टर का पर्चा है।",
    loading: "तीनों फार्मेसी चेक की जा रही हैं",
    indicative: "पनेशिया · दिखाए गए दाम और उत्पाद विवरण सांकेतिक हैं, भुगतान के समय जांच लें",
    noAccount: "तुलना करने के लिए खाते की आवश्यकता नहीं",
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
    foundSuffix: " परिणाम मिले",
    cartTitle: "आपकी कार्ट",
    cartEmpty: "आपकी कार्ट खाली है",
    cartTotal: "कुल",
    cartClear: "साफ़ करें",
    cartExportPdf: "PDF निर्यात करें",
    addToCart: "कार्ट में जोड़ें",
    added: "जोड़ा गया",
    pdfTitle: "पनेशिया — कार्ट सारांश",
    pdfMedicine: "दवा",
    pdfStore: "स्टोर",
    pdfPrice: "कीमत",
    pdfBuyLink: "खरीद लिंक",
    pdfGrandTotal: "कुल योग",
    remove: "हटाएँ"
  },
  gu: {
    pharmaciesLine: "<span>એપોલો ફાર્મસી</span>, <span>ટાટા 1mg</span> અને <span>નેટમેડ્સ</span>ના લાઈવ કાઉન્ટરની સરખામણી — કોઈ સાઇન-અપની જરૂર નથી",
    searchLabel: "દવા નું નામ લખો",
    searchPlaceholder: "જેમ કે: ટેલ્મિસારટન 40mg",
    compareBtn: "ભાવ સરખાવો →",
    compareBtnSearching: "શોધાઈ રહ્યું છે...",
    hint: "ઓર્ડર કરતા પહેલા ખાતરી કરો કે તમારી પાસે પ્રમાણિત ડૉક્ટરનું પ્રિસ્ક્રિપ્શન છે.",
    loading: "ત્રણેય ફાર્મસી ચેક થઈ રહી છે",
    indicative: "પેનેસિયા · દર્શાવેલ ભાવો અને ઉત્પાદનની વિગતો સૂચક છે, ચેકઆઉટ વખતે ચકાસો",
    noAccount: "સરખામણી માટે ખાતાની જરૂર નથી",
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
    foundSuffix: " પરિણામો મળ્યા",
    cartTitle: "તમારી કાર્ટ",
    cartEmpty: "તમારી કાર્ટ ખાલી છે",
    cartTotal: "કુલ",
    cartClear: "સાફ કરો",
    cartExportPdf: "PDF નિકાસ કરો",
    addToCart: "કાર્ટમાં ઉમેરો",
    added: "ઉમેરાયું",
    pdfTitle: "પેનેસિયા — કાર્ટ સારાંશ",
    pdfMedicine: "દવા",
    pdfStore: "સ્ટોર",
    pdfPrice: "કિંમત",
    pdfBuyLink: "ખરીદી લિંક",
    pdfGrandTotal: "કુલ સરવાળો",
    remove: "દૂર કરો"
  }
};

function formatRs(n){
  if (n == null || isNaN(n)) return "—";
  return "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits:0 });
}
function formatPdfRs(n){
  if (n == null || isNaN(n)) return "—";
  return "Rs. " + Number(n).toLocaleString("en-IN", { maximumFractionDigits:0 });
}

function escHtml(s){
  if (!s) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ---------- Cart ----------
function saveCart(){
  localStorage.setItem("panaceaCart", JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount(){
  cartCount.textContent = cart.length;
}

function addToCart(item){
  const id = item.name + "|" + item.seller + "|" + item.price + "|" + item.pack;
  const exists = cart.some(c => c.id === id);
  if (exists) return;
  cart.push({ id, name: item.name, seller: item.seller, price: item.price, pack: item.pack, url: item.url });
  saveCart();
}

function removeFromCart(id){
  cart = cart.filter(c => c.id !== id);
  saveCart();
  renderCartModal();
}

function clearCart(){
  if (cart.length === 0) return;
  cart = [];
  saveCart();
  renderCartModal();
}

function renderCartModal(){
  const t = translations[currentLang];
  const isEmpty = cart.length === 0;
  cartEmpty.style.display = isEmpty ? "block" : "none";
  document.getElementById("cartTitle").textContent = t.cartTitle;

  if (isEmpty) {
    cartItems.innerHTML = '<div class="cart-empty" id="cartEmpty">' + t.cartEmpty + '</div>';
    cartTotal.textContent = "—";
    return;
  }

  let html = "";
  let total = 0;
  cart.forEach(c => {
    total += c.price || 0;
    html +=
      '<div class="cart-item">' +
        '<div class="cart-item-info">' +
          '<div class="cart-item-name">' + escHtml(c.name) + '</div>' +
          '<div class="cart-item-meta">' + escHtml(c.pack) + '</div>' +
          '<div class="cart-item-store">' + escHtml(c.seller) + '</div>' +
        '</div>' +
        '<div class="cart-item-price">' + formatRs(c.price) + '</div>' +
        '<button class="cart-item-remove" data-cart-id="' + escHtml(c.id) + '" title="' + t.remove + '">&times;</button>' +
      '</div>';
  });
  cartItems.innerHTML = html;
  cartTotal.textContent = t.cartTotal + " " + formatRs(total);

  cartItems.querySelectorAll(".cart-item-remove").forEach(btn => {
    btn.addEventListener("click", () => removeFromCart(btn.dataset.cartId));
  });
}

async function exportCartToPdf(){
  if (cart.length === 0) return;
  const t = translations[currentLang];
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const pageW = 210;
  const margin = 16;
  const colW = [10, 68, 38, 30, 40];

  // Load logo for PDF
  let logoData = null;
  try {
    const resp = await fetch("log.png");
    const blob = await resp.blob();
    const reader = new FileReader();
    logoData = await new Promise(resolve => {
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch (e) { /* fallback: no logo */ }

  // Background
  doc.setFillColor(234, 241, 237);
  doc.rect(0, 0, pageW, 297, "F");

  // Header area
  const headY = 14;
  if (logoData) doc.addImage(logoData, "PNG", margin, headY - 2, 12, 12);
  doc.setTextColor(33, 28, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Kairva Corp.", margin + (logoData ? 16 : 0), headY + 4);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(90, 83, 65);
  doc.text("Medicine Cart Summary", margin + (logoData ? 16 : 0), headY + 11);

  // Line
  doc.setDrawColor(162, 59, 46);
  doc.setLineWidth(0.5);
  doc.line(margin, headY + 16, pageW - margin, headY + 16);

  function drawHeader(y){
    doc.setFillColor(162, 59, 46);
    doc.rect(margin, y, pageW - 2*margin, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    let x = margin + 2;
    doc.text("#", x, y + 6);
    doc.text(t.pdfMedicine, x + colW[0], y + 6);
    doc.text(t.pdfStore, x + colW[0] + colW[1], y + 6);
    doc.text(t.pdfPrice, x + colW[0] + colW[1] + colW[2], y + 6);
    doc.text(t.pdfBuyLink, x + colW[0] + colW[1] + colW[2] + colW[3], y + 6);
    return y + 8 + 4;
  }

  let y = drawHeader(headY + 20);
  let grandTotal = 0;

  cart.forEach((c, i) => {
    const rowH = 8;
    if (y + rowH > 275) {
      doc.addPage();
      doc.setFillColor(234, 241, 237);
      doc.rect(0, 0, pageW, 297, "F");
      y = drawHeader(margin);
    }
    grandTotal += c.price || 0;

    // Alternating row bg
    if (i % 2 === 0) {
      doc.setFillColor(248, 250, 249);
      doc.rect(margin, y - 2, pageW - 2*margin, rowH + 2, "F");
    }

    doc.setTextColor(33, 28, 20);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    let x = margin + 2;
    doc.text(String(i + 1), x, y + 5);
    doc.text(c.name, x + colW[0], y + 5);
    doc.text(c.seller, x + colW[0] + colW[1], y + 5);
    doc.text(formatPdfRs(c.price), x + colW[0] + colW[1] + colW[2], y + 5);

    // Buy link (clean, no superscript)
    const linkX = x + colW[0] + colW[1] + colW[2] + colW[3];
    doc.setTextColor(0, 102, 204);
    doc.textWithLink("Buy", linkX, y + 5, { url: c.url });
    doc.setTextColor(33, 28, 20);

    y += rowH + 2;
  });

  // Grand total
  y += 4;
  doc.setDrawColor(162, 59, 46);
  doc.setLineWidth(0.6);
  doc.line(margin, y - 2, pageW - margin, y - 2);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(33, 28, 20);
  doc.text(t.pdfGrandTotal + ": " + formatPdfRs(grandTotal), margin, y + 5);

  // Footer
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(162, 59, 46);
  doc.text("Panacea by Kairva Corp. · prices indicative, verify at checkout", margin, 285);

  doc.save("panacea-cart.pdf");
}

function applyLanguage(lang) {
  const t = translations[lang];
  document.getElementById("lblPharmacies").innerHTML = t.pharmaciesLine;
  document.getElementById("lblSearchLabel").textContent = t.searchLabel;
  document.getElementById("medicine").placeholder = t.searchPlaceholder;
  compareBtn.textContent = compareBtn.disabled ? t.compareBtnSearching : t.compareBtn;
  document.getElementById("lblHint").textContent = t.hint;
  document.getElementById("loading").textContent = t.loading;
  document.getElementById("lblFooter").innerHTML = t.indicative;
  document.getElementById("lblNoAccount").textContent = t.noAccount;
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
  let monoHtml =
    '<div class="mono-field"><div class="k">' + t.composition + '</div><div class="v">' + escHtml(salt || data.medicine_name || lastQuery) + '</div></div>' +
    '<div class="mono-field"><div class="k">' + t.category + '</div><div class="v cat">' + t.categoryVal + '</div></div>' +
    '<div class="mono-field"><div class="k">' + t.resultsFrom + '</div><div class="v">' + results.length + ' ' + (results.length !== 1 ? t.listings : t.listing) + '</div></div>';

  if (data.medicine_info) {
    const info = data.medicine_info;
    monoHtml +=
      '<div style="width:100%; border-top:1px dashed rgba(33,28,20,.15); margin:12px 0 6px; padding-top:12px;"></div>' +
      '<div class="mono-field" style="width:100%;"><div class="k">' + (currentLang === "en" ? "Uses & Effects (WHO Essential Meds List)" : (currentLang === "hi" ? "उपयोग और प्रभाव (WHO आवश्यक दवा सूची)" : "ઉપયોગ અને અસરો (WHO આવશ્યક દવા સૂચિ)")) + '</div><div class="v" style="font-size:14.5px; line-height:1.4; color:var(--ink);">' + escHtml(info.effects) + '</div></div>' +
      '<div class="mono-field" style="width:100%; margin-top:10px;"><div class="k">' + (currentLang === "en" ? "Common Side Effects" : (currentLang === "hi" ? "आम दुष्प्रभाव (Side Effects)" : "સામાન્ય આડઅસરો (Side Effects)")) + '</div><div class="v" style="font-size:14.5px; line-height:1.4; color:var(--ink-soft);">' + escHtml(info.side_effects) + '</div></div>' +
      '<div style="width:100%; font-size:11px; font-family:\'IBM Plex Mono\', monospace; color:var(--stamp-red); margin-top:8px; font-weight:500;">✓ ' + escHtml(info.who_reference) + '</div>';
  }

  monograph.innerHTML = monoHtml;

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

      const cartName = escHtml(r.name);
      const cartSeller = escHtml(r.seller);
      const cartPrice = r.price || 0;
      const cartPack = escHtml(r.pack_size || "—");
      const cartUrl = escHtml(linkUrl);

      return '<div class="listing' + (isBest ? " best" : "") + (r.in_stock ? "" : " out") + '">' +
        (isBest ? '<div class="listing-badge">' + t.best + '</div>' : "") +
        '<div class="listing-brand">' + cartName + "</div>" +
        (r.is_generic ? '<div class="listing-generic">Generic</div>' : "") +
        '<div class="listing-price-row">' +
          (r.mrp && r.mrp !== r.price ? '<div class="listing-mrp">' + formatRs(r.mrp) + "</div>" : "") +
          '<div class="listing-price">' + (r.price ? formatRs(r.price) : "—") + "</div>" +
        "</div>" +
        '<div class="listing-pack">' + cartPack + "</div>" +
        '<div class="listing-foot">' +
          '<span class="stamp ' + stockClass + '">' + stockLabel + "</span>" +
          '<div style="display:flex;gap:6px;align-items:center;">' +
            '<button class="add-cart-btn" data-cart-name="' + cartName.replace(/"/g, "&quot;") + '" data-cart-seller="' + cartSeller.replace(/"/g, "&quot;") + '" data-cart-price="' + cartPrice + '" data-cart-pack="' + cartPack.replace(/"/g, "&quot;") + '" data-cart-url="' + cartUrl + '">' + t.addToCart + '</button>' +
            '<a class="buy-link" href="' + cartUrl + '" target="_blank" rel="noopener">' + t.buy + '</a>' +
          '</div>' +
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

  // Attach add-to-cart handlers
  storeGrid.querySelectorAll(".add-cart-btn").forEach(btn => {
    const item = {
      name: btn.dataset.cartName,
      seller: btn.dataset.cartSeller,
      price: Number(btn.dataset.cartPrice),
      pack: btn.dataset.cartPack,
      url: btn.dataset.cartUrl
    };
    const id = item.name + "|" + item.seller + "|" + item.price + "|" + item.pack;
    btn.classList.toggle("added", cart.some(c => c.id === id));
    btn.addEventListener("click", () => {
      if (cart.some(c => c.id === id)) return;
      addToCart(item);
      btn.textContent = t.added;
      btn.classList.add("added");
    });
  });

  resultsEl.classList.add("active");
  resultsEl.scrollIntoView({ behavior:"smooth", block:"start" });
}

// ---------- Cart Event Listeners ----------
updateCartCount();
cartBtn.addEventListener("click", () => {
  renderCartModal();
  cartOverlay.classList.add("active");
  document.body.style.overflow = "hidden";
});
cartClose.addEventListener("click", () => {
  cartOverlay.classList.remove("active");
  document.body.style.overflow = "";
});
cartOverlay.addEventListener("click", (e) => {
  if (e.target === cartOverlay) {
    cartOverlay.classList.remove("active");
    document.body.style.overflow = "";
  }
});
cartClear.addEventListener("click", clearCart);
cartExportPdf.addEventListener("click", exportCartToPdf);

// ---------- Speech Recognition Setup ----------
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition && micBtn) {
  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;

  micBtn.addEventListener("click", () => {
    // Dynamically set language locale
    if (currentLang === "hi") {
      recognition.lang = "hi-IN";
    } else if (currentLang === "gu") {
      recognition.lang = "gu-IN";
    } else {
      recognition.lang = "en-IN";
    }

    try {
      recognition.start();
    } catch (e) {
      recognition.stop();
    }
  });

  recognition.onstart = () => {
    micBtn.classList.add("listening");
  };

  recognition.onend = () => {
    micBtn.classList.remove("listening");
  };

  recognition.onerror = () => {
    micBtn.classList.remove("listening");
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    // Strip trailing punctuation
    const cleanedText = transcript.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim();
    if (cleanedText) {
      medicineInput.value = cleanedText;
      runSearch(cleanedText);
    }
  };
} else if (micBtn) {
  // Hide mic button if browser doesn't support Speech API
  micBtn.style.display = "none";
}
