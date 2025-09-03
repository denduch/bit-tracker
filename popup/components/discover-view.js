import { store } from '../store.js';
import { communicator, MessageType } from '../../common/messaging.js';
import './tile-view.js';

class DiscoverView extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
    }

    render() {
        const state = store.getState();
        const { recommendations = [], isLoadingRecommendations, artists = [] } = state;
        console.log('DiscoverView render state:', { recommendations, artists });
        const trackedArtistIds = new Set(artists.map(a => a.id));

        this.shadowRoot.innerHTML = `
            <link rel="stylesheet" href="styles/buttons.css">
            <link rel="stylesheet" href="components/discover-view.css">
            <div>
                <div class="panel-header">
                    <h2>Discover</h2>
                    <button id="get-token-button" class="button primary">Get token</button>
                    <button id="refresh-button" class="button primary refresh-artists-button refresh-button" title="Refresh recommendations">&#x21bb;</button>
                </div>
                ${isLoadingRecommendations ? '<p>Loading recommendations...</p>' : `
                    ${recommendations.length > 0 ? `
                        <div class="artist-list list-container">
                            ${recommendations.map(artist => `
                                <tile-view 
                                    image-src="${artist.properlySizedArtistImageURL}"
                                    name="${artist.name}"
                                    type="discover"
                                    artist-id="${artist.id}"
                                    is-tracked="${trackedArtistIds.has(artist.id)}"
                                    details=""
                                    status-text="${artist.on_tour ? 'ON TOUR' : ''}"
                                    country-code="">
                                </tile-view>
                            `).join('')}
                        </div>
                    ` : '<p>No recommendations found.</p>'}
                `}
            </div>
        `;

        this.shadowRoot.getElementById('refresh-button').addEventListener('click', () => {
            store.setState({ isLoadingRecommendations: true });
            communicator.broadcast(MessageType.REQUEST_RECOMMENDATIONS_FETCH);
        });

        const tokenButton = this.shadowRoot.querySelector('#get-token-button');
        tokenButton.addEventListener('click', () => {
            tokenButton.disabled = true;
            tokenButton.textContent = 'Fetching...';
            communicator.broadcast(MessageType.REQUEST_CSRF_TOKEN_FETCH);
        });

        communicator.on(MessageType.CSRF_TOKEN_UPDATED, ({ token }) => {
            tokenButton.disabled = false;
            tokenButton.textContent = 'Get token';
            console.log('Token updated in UI', token)
        });
    }
}

window.customElements.define('discover-view', DiscoverView);
