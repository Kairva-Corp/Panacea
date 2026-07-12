# Panacea 💊
### *The cure for your medicine bill.*

A chronic-medicine price transparency tool for India — compares live prices across Apollo Pharmacy, Tata 1mg, Truemeds, and Netmeds.

## Stack
- **Backend**: Python + Flask (single endpoint)
- **Frontend**: Vanilla HTML + CSS + JS (no framework)
- **Data**: Anakin Wire API → Apollo, 1mg, Truemeds, Netmeds live scrape

## Quick Start

### 1. Set up your API key
Create a `.env` file in the project root:
```
ANAKIN_API_KEY=your_key_here
```
> `.env` is gitignored — it is never committed.

### 2. Install dependencies
```bash
pip install flask flask-cors requests python-dotenv
```

### 3. Run
```bash
python run.py
```
This starts the Flask backend on `http://localhost:5000` and opens the frontend in your browser automatically.

---

## API
`POST /check-price`
```json
{ "medicine_name": "Telma 40", "current_price": 450 }
```

## Demo medicines (pre-tested)
- **Telma 40** (Telmisartan) — best demo, cleanest result
- Metformin 500mg
- Amlodipine 5mg

## Confirmed data sources
| Site | Wire Slug | Notes |
|------|-----------|-------|
| Apollo Pharmacy | `aph_search` | confirmed |
| Tata 1mg | `tmg_search` | confirmed |
| Truemeds | `tm_search` | confirmed |
| Netmeds | `nm_search` | confirmed |
| WHO | N/A | No drug lookup action in catalog — info section omitted |

## Disclaimer
Price and drug information shown is for reference only. Consult your doctor or pharmacist before switching brands, generics, or dosages.
