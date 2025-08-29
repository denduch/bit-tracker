import { store } from '../store.js';
import { getCountryAndFlag, getCountryFilterGroups, europeanCountries, normalizeCountry, getDateFilterGroups } from '../../common/location-helper.js';
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
        const { events = [], isLoading } = state;

        // Decide whether to do a full re-render or just update filters
        if (isLoading || events.length !== this.lastRenderedEventCount) {
            this.initialRender(state);
            this.lastRenderedEventCount = events.length;
        } else {
            this.applyFilters(state);
        }
    }

    initialRender(state) {
        const { events = [], isLoading, eventsLoadingProgress, activeFilters, collapsedEventFilterGroups } = state;
        const sortedEvents = [...events].sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
        const countryFilterGroups = getCountryFilterGroups(events);
        const dateFilterGroups = getDateFilterGroups();
        const filterGroups = [...countryFilterGroups, ...dateFilterGroups];


        this.shadowRoot.innerHTML = `
            <link rel="stylesheet" href="styles/buttons.css">
            <link rel="stylesheet" href="components/events-view.css">
            <style>
                            </style>
            <div class="container">
                <div class="panel-header"></div>
                <div class="content">
                    ${(isLoading && sortedEvents.length === 0) ? '<p>Loading events...</p>' : `
                        <filter-view></filter-view>
                        <div class="events-list-container">
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
        this.applyFilters(state);
    }

    applyFilters(state) {
        const { activeFilters, collapsedEventFilterGroups } = state;
        const container = this.shadowRoot.querySelector('.events-list-container');
        if (!container) return;

        
        this.shadowRoot.querySelectorAll('.event-tile').forEach(tile => {
            const country = tile.dataset.country;
            const eventDate = new Date(tile.getAttribute('date'));

            const countryMatch = this.isEventFilteredByCountry(country, activeFilters.country);
            const dateMatch = !this.isEventFilteredByDate({ startsAt: eventDate }, activeFilters.date);

            tile.style.display = (countryMatch && dateMatch) ? 'flex' : 'none';
        });
        const filterView = this.shadowRoot.querySelector('filter-view');
        if (filterView) {
            filterView.activeFilters = activeFilters;
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
        const { events, activeFilters, collapsedEventFilterGroups } = state;
        const filterView = this.shadowRoot.querySelector('filter-view');
        if (filterView) {
            const countryFilterGroups = getCountryFilterGroups(events);
            const dateFilterGroups = getDateFilterGroups();
            filterView.config = [...countryFilterGroups, ...dateFilterGroups];
            filterView.activeFilters = activeFilters;
            filterView.collapsedGroups = collapsedEventFilterGroups;
        }
    }

    isEventFilteredByCountry(country, filter) {
        if (filter === 'everywhere' || !filter) {
            return true;
        }
        if (filter === 'europe') {
            return europeanCountries.includes(country);
        }
        return country === filter;
    }

    isEventFilteredByDate(event, filter) {
        if (filter === 'anytime' || !filter) {
            return false;
        }

        if (!['today', 'tomorrow', 'week', 'month', '3months', '6months'].includes(filter)) {
            return false; // Not a date filter, so don't hide
        }

        const now = new Date();
        const eventDate = new Date(event.startsAt);
        now.setHours(0, 0, 0, 0);

        switch (filter) {
            case 'today':
                return eventDate.toDateString() !== now.toDateString();
            case 'tomorrow':
                const tomorrow = new Date(now);
                tomorrow.setDate(now.getDate() + 1);
                return eventDate.toDateString() !== tomorrow.toDateString();
            case 'week':
                const nextWeek = new Date(now);
                nextWeek.setDate(now.getDate() + 7);
                return eventDate < now || eventDate > nextWeek;
            case 'month':
                const nextMonth = new Date(now);
                nextMonth.setMonth(now.getMonth() + 1);
                return eventDate < now || eventDate > nextMonth;
            case '3months':
                const next3Months = new Date(now);
                next3Months.setMonth(now.getMonth() + 3);
                return eventDate < now || eventDate > next3Months;
            case '6months':
                const next6Months = new Date(now);
                next6Months.setMonth(now.getMonth() + 6);
                return eventDate < now || eventDate > next6Months;
            default:
                return false;
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
                const { filter, group } = e.detail;
                const currentFilters = store.getState().activeFilters;
                const newFilters = { ...currentFilters };

                if (group === 'date') {
                    newFilters.date = filter;
                } else {
                    newFilters.country = filter;
                }

                store.setState({ activeFilters: newFilters });
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
