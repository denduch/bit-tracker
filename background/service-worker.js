// Import node-html-parser (będzie dodane przez bundler lub jako external library)
// importScripts('lib/node-html-parser.js');

class BitTracker {
    constructor() {
        this.isActive = false;
        this.data = [];
        this.intervalId = null;
        this.init();
    }

    init() {
        // Nasłuchuj wiadomości z popup
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sender, sendResponse);
            return true; // Asynchroniczna odpowiedź
        });

        // Przywróć stan po restarcie
        this.restoreState();
    }

    async handleMessage(request, sender, sendResponse) {
        try {
            switch (request.action) {
                case 'getStatus':
                    sendResponse({
                        isActive: this.isActive,
                        data: this.data
                    });
                    break;

                case 'start':
                    await this.startTracking();
                    sendResponse({
                        success: true,
                        isActive: this.isActive,
                        data: this.data
                    });
                    break;

                case 'stop':
                    await this.stopTracking();
                    sendResponse({
                        success: true,
                        isActive: this.isActive,
                        data: this.data
                    });
                    break;

                default:
                    sendResponse({ error: 'Nieznana akcja' });
            }
        } catch (error) {
            console.error('Błąd w service worker:', error);
            sendResponse({ error: error.message });
        }
    }

    async startTracking() {
        if (this.isActive) return;

        this.isActive = true;
        await this.saveState();

        // Rozpocznij okresowe sprawdzanie
        this.intervalId = setInterval(() => {
            this.performTracking();
        }, 5000); // Co 5 sekund

        console.log('Tracking rozpoczęty');
    }

    async stopTracking() {
        if (!this.isActive) return;

        this.isActive = false;
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        await this.saveState();
        console.log('Tracking zatrzymany');
    }

    async performTracking() {
        try {
            // Pobierz aktywną kartę
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab || !tab.url) return;

            // Przykładowa logika trackingu
            const newItem = {
                id: Date.now(),
                name: tab.title || 'Nieznana strona',
                value: tab.url,
                timestamp: new Date().toISOString()
            };

            this.data.unshift(newItem);
            
            // Ogranicz do ostatnich 10 elementów
            if (this.data.length > 10) {
                this.data = this.data.slice(0, 10);
            }

            await this.saveState();

            // Tutaj można dodać logikę z node-html-parser
            // await this.parsePageContent(tab);

        } catch (error) {
            console.error('Błąd podczas trackingu:', error);
        }
    }

    async parsePageContent(tab) {
        try {
            // Przykład użycia node-html-parser (gdy będzie dostępny)
            /*
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => document.documentElement.outerHTML
            });

            if (results && results[0]) {
                const htmlContent = results[0].result;
                // Tutaj użyj node-html-parser do parsowania HTML
                // const root = parse(htmlContent);
                // const elements = root.querySelectorAll('specific-selector');
                console.log('HTML content parsed');
            }
            */
        } catch (error) {
            console.error('Błąd podczas parsowania:', error);
        }
    }

    async saveState() {
        try {
            await chrome.storage.local.set({
                bitTrackerState: {
                    isActive: this.isActive,
                    data: this.data
                }
            });
        } catch (error) {
            console.error('Błąd podczas zapisywania stanu:', error);
        }
    }

    async restoreState() {
        try {
            const result = await chrome.storage.local.get(['bitTrackerState']);
            
            if (result.bitTrackerState) {
                this.isActive = result.bitTrackerState.isActive || false;
                this.data = result.bitTrackerState.data || [];

                // Jeśli był aktywny, uruchom ponownie
                if (this.isActive) {
                    this.startTracking();
                }
            }
        } catch (error) {
            console.error('Błąd podczas przywracania stanu:', error);
        }
    }
}

// Inicjalizacja service workera
const bitTracker = new BitTracker();
