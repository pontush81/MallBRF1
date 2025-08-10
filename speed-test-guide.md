# 🚀 Guide: Testa din webbsidas hastighet

## Rekommenderade verktyg (alla gratis):

### 1. Google PageSpeed Insights ⭐ (Bäst)
- **URL**: https://pagespeed.web.dev/
- **Skriv in**: https://www.gulmaran.com
- **Dela**: Kopiera URL från resultatsidan
- **Mäter**: Core Web Vitals + SEO-viktiga mätvärden

### 2. GTmetrix 
- **URL**: https://gtmetrix.com/
- **Konto**: Gratis (3 tester/dag)
- **Dela**: Publika rapport-länkar, PDF-export
- **Mäter**: PageSpeed + YSlow scores, waterfall charts

### 3. Lighthouse (Chrome DevTools)
- **Hur**: F12 → Lighthouse tab → "Generate report"
- **Dela**: Exportera som HTML/JSON
- **Mäter**: Performance, SEO, Accessibility, Best Practices

### 4. WebPageTest
- **URL**: https://www.webpagetest.org/
- **Gratis**: Ja, avancerade inställningar
- **Dela**: Publika test-URLs
- **Mäter**: Detaljerad waterfall-analys

## 📊 Viktiga mätvärden att kolla:

### Core Web Vitals (Googles ranking-faktorer):
- **LCP** (Largest Contentful Paint): < 2.5s ✅
- **FID** (First Input Delay): < 100ms ✅  
- **CLS** (Cumulative Layout Shift): < 0.1 ✅

### Andra viktiga värden:
- **Load Time**: Total laddningstid
- **TTFB**: Time to First Byte (server-respons)
- **Page Size**: Sidans totala storlek
- **Requests**: Antal HTTP-förfrågningar

## 🔗 Hur du delar resultaten:

### Metod 1: Direktlänk (Enklast)
1. Kör test på PageSpeed Insights
2. Kopiera URL från adressfältet
3. Skicka länken → mottagaren ser samma resultat

### Metod 2: Skärmdump
1. Ta screenshot av resultat
2. Spara som bild
3. Dela bilden via email/chat

### Metod 3: PDF-rapport (GTmetrix)
1. Skapa gratis konto på GTmetrix
2. Kör test
3. Klicka "Download PDF"
4. Skicka PDF-filen

## 🎯 Snabbtest just nu:

Testa din sida direkt här:
- https://pagespeed.web.dev/?url=https://www.gulmaran.com
- https://gtmetrix.com/reports/www.gulmaran.com/

## 💡 Tips för bättre prestanda:

### Vanliga förbättringar:
- ✅ Komprimera bilder (WebP format)
- ✅ Minifiera CSS/JavaScript  
- ✅ Använd CDN för statiska filer
- ✅ Aktivera browser caching
- ✅ Optimera server-responstid

### För React-appar specifikt:
- ✅ Code splitting med React.lazy()
- ✅ Optimera bundle size
- ✅ Använd React.memo för komponenter
- ✅ Lazy loading för bilder

---

**Rekommendation**: Börja med PageSpeed Insights - det är Googles officiella verktyg och visar exakt vad som påverkar din SEO-ranking!
