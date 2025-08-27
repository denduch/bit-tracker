import { store } from '../store.js';
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
        const { events = [], isLoading } = state; // Default events to empty array

        console.log('events: ', {events})

        this.shadowRoot.innerHTML = `
            <link rel="stylesheet" href="styles/buttons.css">
            <link rel="stylesheet" href="components/events-view.css">
            <div>
                <div class="panel-header">
                    <h2>${events.length} Events</h2>
                    <button id="refresh-button" class="button primary refresh-events-button" title="Refresh event list">&#x21bb;</button>
                </div>
                ${isLoading ? '<p>Loading events...</p>' : `
                    ${events.length > 0 ? `
                        <div class="events-list">
                            ${events.map(event => `
                                <tile-view 
                                    image-src="${event.artist.image_url}"
                                    name="${event.artist.name}"
                                    details="${new Date(event.starts_at).toLocaleDateString()} @ ${event.venue.name}, ${event.venue.city}"
                                    status-text="${event.offers[0]?.status.toUpperCase() || 'NOT AVAILABLE'}">
                                </tile-view>
                            `).join('')}
                        </div>
                    ` : '<p>No upcoming events found.</p>'}
                `}
            </div>
        `;

        this.shadowRoot.getElementById('refresh-button').addEventListener('click', () => {
            store.setState({ isLoading: true });
            communicator.broadcast(MessageType.REQUEST_EVENTS_FETCH);
        });
    }
}

window.customElements.define('events-view', EventsView);
