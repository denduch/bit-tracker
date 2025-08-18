function PopupApp() {
    return {
        title: 'Bit Tracker',
        isActive: false,
        loading: false,
        status: 'Nieaktywny',
        data: [],

        async mounted() {
            // Pobierz aktualny status z service workera
            await this.loadStatus();
        },

        async loadStatus() {
            try {
                const response = await chrome.runtime.sendMessage({ 
                    action: 'getStatus' 
                });
                
                if (response) {
                    this.isActive = response.isActive || false;
                    this.status = this.isActive ? 'Aktywny' : 'Nieaktywny';
                    this.data = response.data || [];
                }
            } catch (error) {
                console.error('Błąd podczas ładowania statusu:', error);
            }
        },

        async toggleTracking() {
            this.loading = true;
            
            try {
                const action = this.isActive ? 'stop' : 'start';
                const response = await chrome.runtime.sendMessage({ 
                    action: action 
                });
                
                if (response && response.success) {
                    this.isActive = !this.isActive;
                    this.status = this.isActive ? 'Aktywny' : 'Nieaktywny';
                    
                    if (response.data) {
                        this.data = response.data;
                    }
                }
            } catch (error) {
                console.error('Błąd podczas przełączania trackingu:', error);
            } finally {
                this.loading = false;
            }
        }
    };
}

// Inicjalizacja petite-vue
PetiteVue.createApp().mount('#app');
