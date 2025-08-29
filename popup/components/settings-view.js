import { storageManager } from '../../common/storage.js';

class SettingsView extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
        this.initializeEventListeners();
        this.initializeMockToggle();
    }

    async initializeMockToggle() {
        const toggle = this.shadowRoot.getElementById('mock-toggle');
        const useMocks = await storageManager.get('useMocks', true);
        toggle.checked = useMocks;

        toggle.addEventListener('change', async (event) => {
            const newUseMocks = event.target.checked;
            await storageManager.set('useMocks', newUseMocks);
        });
    }

    initializeEventListeners() {
        const exportButton = this.shadowRoot.getElementById('export-button');
        const importButton = this.shadowRoot.getElementById('import-button');
        const fileInput = this.shadowRoot.getElementById('import-file-input');

        exportButton.addEventListener('click', this.handleExport.bind(this));
        importButton.addEventListener('click', this.handleImport.bind(this));
        fileInput.addEventListener('change', this.handleFileSelect.bind(this));
    }

    handleExport() {
        storageManager.getAll().then(data => {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `bit-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }

    handleImport() {
        const fileInput = this.shadowRoot.getElementById('import-file-input');
        fileInput.click();
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);
                await storageManager.clear();
                await storageManager.setAll(data);
                // Reload the popup to reflect imported data
                location.reload();
            } catch (error) {
                console.error('Failed to import data:', error);
                alert('Error: Invalid JSON file.');
            }
        };
        reader.readAsText(file);

        // Reset file input to allow importing the same file again
        event.target.value = '';
    }

    render() {
        this.shadowRoot.innerHTML = `
            <link rel="stylesheet" href="components/settings-view.css">
            <link rel="stylesheet" href="styles/buttons.css">
            <div class="container panel-container">
                <div class="panel-header">
                    <h2>Settings</h2>
                </div>
                <div class="content">
                    <div class="settings-section">
                        <h3>Data Management</h3>
                        <p class="section-description">Backup and restore your tracked artists and events data.</p>
                        
                        <div class="setting-item">
                            <div class="setting-info">
                                <label class="setting-label">Export Data</label>
                                <span class="setting-description">Download a backup file with all your data</span>
                            </div>
                            <button id="export-button" class="button primary">📤 Export</button>
                        </div>
                        
                        <div class="setting-item">
                            <div class="setting-info">
                                <label class="setting-label">Import Data</label>
                                <span class="setting-description">Restore data from a backup file</span>
                            </div>
                            <button id="import-button" class="button secondary">📥 Import</button>
                            <input type="file" id="import-file-input" style="display: none;" accept=".json">
                        </div>
                    </div>
                    
                    <div class="settings-section">
                        <h3>Development</h3>
                        <p class="section-description">Options for testing and development purposes.</p>
                        
                        <div class="setting-item">
                            <div class="setting-info">
                                <label class="setting-label">Use Mock Data</label>
                                <span class="setting-description">Enable test data for development and demo purposes</span>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox" id="mock-toggle">
                                <span class="slider"></span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define('settings-view', SettingsView);
