class TabView extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.switchTab('artists');
        this.render();
        this.addEventListeners();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <link rel="stylesheet" href="components/tab-view.css">
            <div class="tabs">
                <button class="tab active" data-tab="artists">Artists</button>
                <button class="tab" data-tab="events">Events</button>
            </div>
            <div class="panels">
                <slot name="artists"></slot>
                <slot name="events"></slot>
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
    }
}

customElements.define('tab-view', TabView);
