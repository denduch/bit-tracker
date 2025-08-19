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
        if (!this.shadowRoot) return;
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
        if (!this.shadowRoot) return;
        this.shadowRoot.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (event) => {
                const tabName = (event.currentTarget as HTMLElement).dataset.tab;
                if (tabName) {
                    this.switchTab(tabName);
                }
            });
        });
    }

    switchTab(tabName: string) {
        if (!this.shadowRoot) return;
        this.shadowRoot.querySelectorAll('.tab').forEach(tab => {
            (tab as HTMLElement).classList.toggle('active', (tab as HTMLElement).dataset.tab === tabName);
        });

        this.querySelectorAll('[slot]').forEach(panel => {
            (panel as HTMLElement).style.display = panel.slot === tabName ? 'block' : 'none';
        });
    }
}

customElements.define('tab-view', TabView);
