import { store } from '../store.js';
import { getCountryAndFlag } from '../../common/location-helper.js';
import { communicator, MessageType } from '../../common/messaging.js';
import './tile-view.js';

class EventsView extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
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
        const { events = [], isLoading, eventsLoadingProgress } = state;
        const sortedEvents = [...events].sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt)); // Default events to empty array

        console.log('events: ', {events})

        this.shadowRoot.innerHTML = `
            <link rel="stylesheet" href="styles/buttons.css">
            <link rel="stylesheet" href="components/events-view.css">
            <div>
                <div class="panel-header">
                    <h2>${sortedEvents.length} Events</h2>
                                        ${isLoading && eventsLoadingProgress.total > 0
                        ? `<div class="loading-progress">${eventsLoadingProgress.current}/${eventsLoadingProgress.total}</div>`
                        : `<button id="refresh-button" class="button primary refresh-events-button" title="Refresh event list">&#x21bb;</button>`
                    }
                </div>
                ${isLoading ? '<p>Loading events...</p>' : `
                    ${sortedEvents.length > 0 ? `
                        <div class="events-list">
                            ${sortedEvents.map(event => {
                                const { country, flag } = getCountryAndFlag(event.location);
                                const details = `${country}, ${event.location} ${flag}`;
                                return `
                                <tile-view 
                                    image-src="${event.artist.properlySizedArtistImageURL}"
                                    name="${event.artist.name}"
                                    details="${details}"
                                    date="${event.startsAt}">
                                </tile-view>
                            `}).join('')}
                        </div>
                    ` : '<p>No upcoming events found.</p>'}
                `}
            </div>
        `;

                const refreshButton = this.shadowRoot.getElementById('refresh-button');
        if (refreshButton) {
            refreshButton.addEventListener('click', () => {
                store.setState({ isLoading: true, eventsLoadingProgress: { current: 0, total: 0 } });
                communicator.broadcast(MessageType.REQUEST_EVENTS_FETCH);
            });
        }
    }
}

window.customElements.define('events-view', EventsView);
