import { store } from '../store.js';
import { communicator, MessageType } from '../../common/messaging.js';
import './tile-view.js';

class DiscoverView extends HTMLElement {
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
        const state = store.getState();
        const { recommendations = [], isLoadingRecommendations } = state;

        this.shadowRoot.innerHTML = `
            <link rel="stylesheet" href="styles/buttons.css">
            <link rel="stylesheet" href="components/discover-view.css">
            <div>
                <div class="panel-header">
                    <h2>Discover</h2>
                    <button id="refresh-button" class="button primary refresh-artists-button refresh-button" title="Refresh recommendations">&#x21bb;</button>
                </div>
                ${isLoadingRecommendations ? '<p>Loading recommendations...</p>' : `
                    ${recommendations.length > 0 ? `
                        <div class="artist-list list-container">
                            ${recommendations.map(artist => `
                                <tile-view 
                                    image-src="${artist.properlySizedArtistImageURL}"
                                    name="${artist.name}"
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
    }
}

window.customElements.define('discover-view', DiscoverView);
