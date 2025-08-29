import { store } from '../store.js';
import { getCountryAndFlag, getCountryFilterGroups, europeanCountries, normalizeCountry } from '../../common/location-helper.js';
import { communicator, MessageType } from '../../common/messaging.js';
import './tile-view.js';
import './filter-view.js';

class EventsView extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.handleStoreUpdate = this.render.bind(this);
        this.lastRenderedEventCount = 0;
    }

    connectedCallback() {
        store.subscribe(this.handleStoreUpdate);
    }

    disconnectedCallback() {
        store.unsubscribe(this.handleStoreUpdate);
    }

    render() {
        const state = store.getState();
        const { events = [], isLoading, activeEventFilter } = state;

        // Decide whether to do a full re-render or just update filters
        if (isLoading || events.length !== this.lastRenderedEventCount) {
            this.initialRender(state);
            this.lastRenderedEventCount = events.length;
        } else {
            this.applyFilters(state);
        }
    }

    initialRender(state) {
        const { events = [], isLoading, eventsLoadingProgress, activeEventFilter, collapsedEventFilterGroups } = state;
        const sortedEvents = [...events].sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
        const filterGroups = getCountryFilterGroups(events);


        this.shadowRoot.innerHTML = `
            <link rel="stylesheet" href="styles/buttons.css">
            <link rel="stylesheet" href="components/events-view.css">
            <style>
                /* By default, hide all tiles when a filter is active */
                .events-list-container[data-filter] .event-tile {
                    display: none;
                }

                /* Show all for 'everywhere' */
                .events-list-container[data-filter="everywhere"] .event-tile {
                    display: flex;
                }

                /* Show only European tiles for 'europe' */
                ${europeanCountries.map(c => `.events-list-container[data-filter="europe"] .event-tile[data-country="${c}"]`).join(', ')} {
                    display: flex;
                }

                /* Show specific country tiles */
                ${filterGroups.flatMap(g => g.options).map(opt => `
                    .events-list-container[data-filter="${opt.value}"] .event-tile[data-country="${opt.value}"] {
                        display: flex;
                    }
                `).join('')}
            </style>
            <div class="container">
                <div class="panel-header"></div>
                <div class="content">
                    ${(isLoading && sortedEvents.length === 0) ? '<p>Loading events...</p>' : `
                        <filter-view></filter-view>
                        <div class="events-list-container" data-filter="${activeEventFilter}">
                            <div class="events-list">
                                ${sortedEvents.length > 0 ? sortedEvents.map(event => {
                                    const { country, flag } = getCountryAndFlag(event.location);
                                    const details = `${country}, ${event.location} ${flag}`;
                                    return `
                                    <tile-view class="event-tile"
                                        data-country="${normalizeCountry(event.location)}"
                                        image-src="${event.artist.properlySizedArtistImageURL}"
                                        name="${event.artist.name}"
                                        details="${details}"
                                        date="${event.startsAt}">
                                    </tile-view>
                                `}).join('') : '<p>No upcoming events found.</p>'}
                            </div>
                        </div>
                    `}
                </div>
            </div>
        `;

        this.updateHeader(state);
        this.updateFilterView(state);
        this.attachEventListeners();
    }

    applyFilters(state) {
        const { activeEventFilter, collapsedEventFilterGroups } = state;
        const container = this.shadowRoot.querySelector('.events-list-container');
        if (container) {
            container.dataset.filter = activeEventFilter;
        }
        const filterView = this.shadowRoot.querySelector('filter-view');
        if (filterView) {
            filterView.activeFilter = activeEventFilter;
            filterView.collapsedGroups = collapsedEventFilterGroups;
        }
        this.updateHeader(state);
    }

    updateHeader(state) {
        const { isLoading, eventsLoadingProgress } = state;
        const header = this.shadowRoot.querySelector('.panel-header');
        if (!header) return;

        const container = this.shadowRoot.querySelector('.events-list-container');
        const visibleEvents = container ? Array.from(container.querySelectorAll('.event-tile')).filter(tile => tile.offsetParent !== null).length : 0;

        header.innerHTML = `
            <h2>${visibleEvents} Events</h2>
            ${(isLoading && eventsLoadingProgress.total > 0)
                ? `<div class="loading-progress">${eventsLoadingProgress.current}/${eventsLoadingProgress.total}</div>`
                : `<button id="refresh-button" class="button primary refresh-events-button ${isLoading ? 'loading' : ''}" title="Refresh event list">&#x21bb;</button>`
            }
        `;
    }

    updateFilterView(state) {
        const { events, activeEventFilter, collapsedEventFilterGroups } = state;
        const filterView = this.shadowRoot.querySelector('filter-view');
        if (filterView) {
            filterView.config = getCountryFilterGroups(events);
            filterView.activeFilter = activeEventFilter;
            filterView.collapsedGroups = collapsedEventFilterGroups;
        }
    }

    attachEventListeners() {
        const refreshButton = this.shadowRoot.getElementById('refresh-button');
        if (refreshButton && !refreshButton.dataset.listenerAttached) {
            refreshButton.addEventListener('click', () => {
                store.setState({ isLoading: true, eventsLoadingProgress: { current: 0, total: 0 } });
                communicator.broadcast(MessageType.REQUEST_EVENTS_FETCH);
            });
            refreshButton.dataset.listenerAttached = 'true';
        }

        const filterView = this.shadowRoot.querySelector('filter-view');
        if (filterView && !filterView.dataset.listenerAttached) {
            filterView.addEventListener('filter-changed', (e) => {
                store.setState({ activeEventFilter: e.detail.filter });
            });
            filterView.addEventListener('group-toggle', (e) => {
                const { groupName } = e.detail;
                const currentCollapsed = store.getState().collapsedEventFilterGroups;
                const newCollapsed = currentCollapsed.includes(groupName)
                    ? currentCollapsed.filter(g => g !== groupName)
                    : [...currentCollapsed, groupName];
                store.setState({ collapsedEventFilterGroups: newCollapsed });
            });
            filterView.dataset.listenerAttached = 'true';
        }
    }
}

window.customElements.define('events-view', EventsView);
