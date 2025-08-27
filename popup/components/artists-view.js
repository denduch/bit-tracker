import { store } from '../store.js';
import { communicator, MessageType } from '../../common/messaging.js';
import './tile-view.js';

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
    }

    disconnectedCallback() {
        store.unsubscribe(this.handleStoreUpdate);
    }

    render() {
        const state = store.getState();
        console.log('STATE: ', {state})
        const { artists = [], isLoading } = state;

        this.shadowRoot.innerHTML = `
            <link rel="stylesheet" href="styles/buttons.css">
            <link rel="stylesheet" href="components/artists-view.css">
            <div>
                <div class="panel-header">
                    <h2>${artists.length || 0} Artists</h2>
                    <button id="refresh-button" class="button primary refresh-artists-button" title="Refresh artist list">&#x21bb;</button>
                </div>
                ${isLoading ? '<p>Loading artists...</p>' : `
                    ${artists.length > 0 ? `
                        <div class="artist-list">
                            ${artists.map(artist => `
                                <tile-view 
                                    image-src="${artist.properlySizedArtistImageURL}"
                                    name="${artist.name}"
                                    details="${artist.tracker_count.toLocaleString()} followers"
                                    status-text="${artist.on_tour ? 'ON TOUR' : ''}">
                                </tile-view>
                            `).join('')}
                        </div>
                    ` : '<p>No artists found. Add artists on Bandsintown.</p>'}
                `}
            </div>
        `;

        this.shadowRoot.getElementById('refresh-button').addEventListener('click', () => {
            console.log('Refresh button clicked, sending fetch request from artists-view.');
            store.setState({ isLoading: true });
            communicator.broadcast(MessageType.REQUEST_ARTIST_FETCH);
        });
    }
}

window.customElements.define('artists-view', ArtistsView);
