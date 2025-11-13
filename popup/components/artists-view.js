import { store } from '../store.js';
import { getCountryAndFlag, isCountryInEurope } from '../../common/location-helper.js';
import { communicator, MessageType } from '../../common/messaging.js';
import { storageManager } from '../../common/storage.js';
import { waitForComponentReady } from './component-ready.js';
import './tile-view.js';

class ArtistsView extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.isReady = false;
    }

    connectedCallback() {
        this.render();
        communicator.on(MessageType.REDRAW, () => this.forceRerender());
    }

    async forceRerender() {
        console.log('Force re-rendering artist list...');
        const artists = await storageManager.get('tracked-data', []);
        store.setState({ artists });
        this.render();
    }

    render() {
        const { artists = [] } = store.getState();

        this.shadowRoot.innerHTML = `
            <link rel="stylesheet" href="styles/buttons.css">
            <link rel="stylesheet" href="components/artists-view.css">
            <div>
                <div class="panel-header">
                    <h2>${artists.length || 0} Artists</h2>
                    <button id="refresh-button" class="button primary refresh-artists-button refresh-button" title="Refresh artist list">&#x21bb;</button>
                </div>
                ${`${artists.length > 0 ? `
                    <div class="artist-list list-container">
                        ${artists.map(artist => {
                            const eventCountryCodes = artist.events?.map(event => getCountryAndFlag(event.location).code) || [];
                            let displayCountryCode = '';
                            if (eventCountryCodes.includes('pl')) {
                                displayCountryCode = 'pl';
                            } else if (eventCountryCodes.some(code => isCountryInEurope(code))) {
                                displayCountryCode = 'eu';
                            }

                            return `
                            <tile-view 
                                image-src="${artist.properlySizedArtistImageURL}"
                                name="${artist.name}"
                                type="artists"
                                details="${artist.events?.length || 0} events"
                                status-text="${artist.on_tour ? 'ON TOUR' : ''}"
                                country-code="${displayCountryCode}">
                            </tile-view>
                            `;
                        }).join('')}
                    </div>
                    ` : '<p>No artists found. Add artists on Bandsintown.</p>'}
                `}
            </div>
        `;

        this.shadowRoot.getElementById('refresh-button').addEventListener('click', () => {
            console.log('Refresh button clicked, sending fetch request from artists-view.');
            communicator.broadcast(MessageType.REQUEST_ARTIST_FETCH);
        });

        waitForComponentReady(this, ['tile-view']);
    }
}

window.customElements.define('artists-view', ArtistsView);
