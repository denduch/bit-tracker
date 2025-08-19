import { store } from '../store';

class ArtistsView extends HTMLElement {
    private handleStoreUpdate: () => void;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
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
        if (!this.shadowRoot) {
            return;
        }

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
