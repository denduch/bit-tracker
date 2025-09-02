import { storageManager } from '../../common/storage.js';

class TabView extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    async connectedCallback() {
        this.render();
        const lastTab = await storageManager.get('lastActiveTab', 'artists');
        this.switchTab(lastTab);
        this.addEventListeners();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <link rel="stylesheet" href="components/tab-view.css">
            <div class="tabs">
                <button class="tab active" data-tab="artists">Artists</button>
                <button class="tab" data-tab="events">Events</button>
                <button class="tab" data-tab="discover">Discover</button>
                <button class="tab settings-tab" data-tab="settings">⚙️</button>
            </div>
            <div class="panels">
                <slot name="artists"></slot>
                <slot name="events"></slot>
                <slot name="discover"></slot>
                <slot name="settings"></slot>
            </div>
        `;
    }

    addEventListeners() {
        this.shadowRoot.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (event) => {
                this.switchTab(event.currentTarget.dataset.tab);
            });
        });
    }

    switchTab(tabName) {
        this.shadowRoot.querySelectorAll('.tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        this.querySelectorAll('.panel').forEach(panel => {
            panel.style.display = panel.slot === tabName ? 'block' : 'none';
        });

        storageManager.set('lastActiveTab', tabName);
    }
}

customElements.define('tab-view', TabView);
