import { store } from '../store.js';

class ArtistsView extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        // Create a bound function to use as the listener.
        // This ensures 'this' inside render refers to the component instance.
        this.handleStoreUpdate = this.render.bind(this);
    }

    connectedCallback() {
        store.subscribe(this.handleStoreUpdate);
        this.render(); // Initial render
    }

    disconnectedCallback() {
        store.unsubscribe(this.handleStoreUpdate);
    }

    render() {
        const { artists, isLoading } = store.getState();

        this.shadowRoot.innerHTML = `
            <link rel="stylesheet" href="components/artists-view.css">
            <div>
                <h2>Artists</h2>
                ${isLoading ? '<p>Loading artists...</p>' : `
                    ${artists.length > 0 ? `
                        <ul>
                            ${artists.map(artist => `<li>${artist.name}</li>`).join('')}
                        </ul>
                    ` : '<p>No artists found.</p>'}
                `}
            </div>
        `;
    }
}

customElements.define('artists-view', ArtistsView);
