class EventsView extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <link rel="stylesheet" href="components/events-view.css">
            <div>
                <h2>Events</h2>
                <p>This is the events view.</p>
            </div>
        `;
    }
}

customElements.define('events-view', EventsView);
