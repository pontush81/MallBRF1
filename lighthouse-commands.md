# 🚀 Lighthouse CLI Kommandon

## Grundläggande kommandon:

### Testa din live-sida:
```bash
lighthouse https://www.gulmaran.com --view
```

### Testa lokal utvecklingsserver:
```bash
# Starta först din dev-server (t.ex. npm start)
lighthouse http://localhost:3000 --view
```

### Olika output-format:
```bash
# Spara som JSON
lighthouse https://www.gulmaran.com --output json --output-path ./report.json

# Spara som CSV
lighthouse https://www.gulmaran.com --output csv --output-path ./report.csv

# Flera format samtidigt
lighthouse https://www.gulmaran.com --output html --output json
```

### Testa specifika kategorier:
```bash
# Endast prestanda
lighthouse https://www.gulmaran.com --only-categories=performance

# Prestanda + SEO
lighthouse https://www.gulmaran.com --only-categories=performance,seo
```

### Desktop vs Mobile:
```bash
# Desktop-test
lighthouse https://www.gulmaran.com --preset=desktop --view

# Mobile-test (standard)
lighthouse https://www.gulmaran.com --view
```

### Avancerade inställningar:
```bash
# Headless mode (utan GUI)
lighthouse https://www.gulmaran.com --chrome-flags="--headless"

# Disable storage reset
lighthouse https://www.gulmaran.com --disable-storage-reset
```

## Dela resultaten:

1. **HTML-fil**: Skicka den genererade `.report.html` filen
2. **Screenshots**: Ta skärmdump av rapporten
3. **JSON**: För programmatisk analys
4. **URL**: Kör test på PageSpeed Insights och dela länken

## Senaste rapport:
- Fil: `www.gulmaran.com_2025-08-10_09-41-23.report.html`
- Storlek: 649KB
- Datum: 10 Aug 2025, 09:41
