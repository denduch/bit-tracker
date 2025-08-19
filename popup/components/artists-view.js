class ArtistsView extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <link rel="stylesheet" href="components/artists-view.css">
            <div>
                <h2>Artists</h2>
                <p>This is the artists view.</p>
            </div>
        `;
    }
}

customElements.define('artists-view', ArtistsView);
