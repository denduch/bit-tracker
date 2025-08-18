# Bit Tracker Chrome Extension

Wtyczka Chrome z popup-em i service worker-em w tle.

## Struktura projektu

```
bit-tracker/
├── manifest.json           # Konfiguracja rozszerzenia
├── popup/
│   ├── popup.html          # Interface popup-a
│   ├── popup.css           # Style popup-a
│   └── popup.js            # Logika popup-a (petite-vue)
├── background/
│   └── service-worker.js   # Service worker w tle
├── node_modules/
│   └── petite-vue/         # Biblioteka petite-vue z npm
└── package.json            # Konfiguracja npm
```

## Technologie

- **Frontend (Popup)**: petite-vue - lekka wersja Vue.js
- **Backend (Service Worker)**: Vanilla JavaScript z node-html-parser
- **Styling**: CSS z gradientami i animacjami

## Instalacja

1. Zainstaluj zależności:
```bash
npm install
```

2. Załaduj rozszerzenie w Chrome:
   - Otwórz `chrome://extensions/`
   - Włącz "Tryb programisty"
   - Kliknij "Załaduj rozpakowane"
   - Wybierz folder projektu

## Funkcjonalność

- **Popup**: Interface użytkownika z przyciskami start/stop
- **Service Worker**: Działa w tle, śledzi aktywne karty
- **Przechowywanie**: Zapisuje stan w chrome.storage
- **Tracking**: Okresowo zbiera dane o aktywnych kartach

## Uwagi

- node-html-parser wymaga dodatkowej konfiguracji dla Chrome Extensions
- Alternatywnie można użyć wbudowanego DOMParser API
- Extension używa Manifest V3