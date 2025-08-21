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
                        <div class="artist-list">
                            ${artists.map(artist => `
                                <div class="artist-tile">
                                    <div class="artist-image">
                                        <img src="${artist.properlySizedArtistImageURL}" alt="${artist.name}">
                                    </div>
                                    <div class="artist-details">
                                        <div class="artist-name">${artist.name}</div>
                                        <div class="tracker-count">${artist.tracker_count.toLocaleString()} followers</div>
                                    </div>
                                    <div class="artist-status">
                                        ${artist.on_tour ? '<span class="on-tour">On Tour</span>' : ''}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : '<p>No artists found.</p>'}
                `}
            </div>
        `;
    }
}

customElements.define('artists-view', ArtistsView);
