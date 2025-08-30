import { store } from '../store.js';
import { getCountryAndFlag, getCountryFilterGroups, europeanCountries, normalizeCountry, getDateFilterGroups, getArtistFilterGroups } from '../../common/location-helper.js';
import { communicator, MessageType } from '../../common/messaging.js';
import './tile-view.js';
import './filter-view.js';

class EventsView extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.handleStoreUpdate = this.render.bind(this);
    }

    connectedCallback() {
        this.render(store.getState());
        store.subscribe(this.handleStoreUpdate);
    }

    disconnectedCallback() {
        store.unsubscribe(this.handleStoreUpdate);
    }

    render(state) {
        const { artists, activeFilters, isLoading, eventsLoadingProgress, collapsedEventFilterGroups } = state;

        const allEvents = artists.flatMap(artist => 
            (artist.events || []).map(event => ({ ...event, artist }))
        );

        const sortedEvents = allEvents.sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
        
        // Filter by country and date for events display
        const eventsFilteredByCountryAndDate = sortedEvents.filter(event => {
            const { country } = getCountryAndFlag(event.location);
            const countryMatch = this.isEventFilteredByCountry(normalizeCountry(country), activeFilters.country);
            const dateMatch = !this.isEventFilteredByDate(event, activeFilters.date);
            return countryMatch && dateMatch;
        });

        // Apply artist filter on top of country/date filtering
        const filteredEvents = activeFilters.artist === 'all'
            ? eventsFilteredByCountryAndDate
            : eventsFilteredByCountryAndDate.filter(event => event.artist.name === activeFilters.artist);

        const countryFilterGroups = getCountryFilterGroups(sortedEvents);
        const dateFilterGroups = getDateFilterGroups();
        // Artist filter options should only depend on country and date filters, not artist selection
        const artistFilterGroups = getArtistFilterGroups(eventsFilteredByCountryAndDate);

        this.shadowRoot.innerHTML = `
            <link rel="stylesheet" href="styles/buttons.css">
            <link rel="stylesheet" href="styles/flags.css">
            <link rel="stylesheet" href="components/events-view.css">
            <div class="container">
                <div class="panel-header"></div>
                <div class="content">
                    ${(isLoading && sortedEvents.length === 0) ? '<p>Loading events...</p>' : `
                        <filter-view></filter-view>
                        <div class="events-list-container">
                            <div class="events-list list-container">
                                ${filteredEvents.length > 0 ? filteredEvents.map(event => {
                                    const { country, code, cleanLocation } = getCountryAndFlag(event.location);
                                    const details = `${country}, ${cleanLocation}`;
                                    return `
                                    <tile-view class="event-tile"
                                        data-country="${normalizeCountry(country)}"
                                        data-name="${event.artist.name}"
                                        image-src="${event.artist.properlySizedArtistImageURL}"
                                        name="${event.artist.name}"
                                        details="${details}"
                                        country-code="${code}"
                                        date="${event.startsAt}">
                                    </tile-view>
                                `}).join('') : '<p>No upcoming events found.</p>'}
                            </div>
                        </div>
                    `}
                </div>
            </div>
        `;

        this.updateHeader(filteredEvents.length, isLoading, eventsLoadingProgress);
        this.updateFilterView([...countryFilterGroups, ...dateFilterGroups, ...artistFilterGroups], activeFilters, collapsedEventFilterGroups);
        this.attachEventListeners();
    }

    updateHeader(visibleEventsCount, isLoading, eventsLoadingProgress) {
        const header = this.shadowRoot.querySelector('.panel-header');
        if (!header) return;

        header.innerHTML = `
            <h2>${visibleEventsCount} Events</h2>
            ${(isLoading && eventsLoadingProgress.total > 0)
                ? `<div class="loading-progress">${eventsLoadingProgress.current}/${eventsLoadingProgress.total}</div>
                <button id="refresh-button" class="button primary refresh-events-button refresh-button ${isLoading ? 'loading' : ''}" title="Refresh event list">&#x21bb;</button>`
                : `<button id="refresh-button" class="button primary refresh-events-button refresh-button ${isLoading ? 'loading' : ''}" title="Refresh event list">&#x21bb;</button>`
            }
        `;
    }

    updateFilterView(filterGroups, activeFilters) {
        const filterView = this.shadowRoot.querySelector('filter-view');
        if (filterView) {
            filterView.config = filterGroups;
            filterView.activeFilters = activeFilters;
        }
    }

    isEventFilteredByCountry(country, filter) {
        if (filter === 'everywhere' || !filter) return true;
        if (filter === 'europe') return europeanCountries.includes(country);
        return country === filter;
    }

    isEventFilteredByDate(event, filter) {
        if (filter === 'anytime' || !filter) return false;

        const now = new Date();
        const eventDate = new Date(event.startsAt);
        now.setHours(0, 0, 0, 0);

        switch (filter) {
            case 'today': return eventDate.toDateString() !== now.toDateString();
            case 'tomorrow':
                const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
                return eventDate.toDateString() !== tomorrow.toDateString();
            case 'week':
                const nextWeek = new Date(now); nextWeek.setDate(now.getDate() + 7);
                return eventDate < now || eventDate > nextWeek;
            case 'month':
                const nextMonth = new Date(now); nextMonth.setMonth(now.getMonth() + 1);
                return eventDate < now || eventDate > nextMonth;
            case '3months':
                const next3Months = new Date(now); next3Months.setMonth(now.getMonth() + 3);
                return eventDate < now || eventDate > next3Months;
            case '6months':
                const next6Months = new Date(now); next6Months.setMonth(now.getMonth() + 6);
                return eventDate < now || eventDate > next6Months;
            default: return false;
        }
    }


    getFilteredEvents(state, includeArtistFilter) {
        const { events, activeFilters } = state;
        const filteredEvents = events.filter(event => {
            const { country } = getCountryAndFlag(event.location);
            const countryMatch = this.isEventFilteredByCountry(normalizeCountry(country), activeFilters.country);
            const dateMatch = !this.isEventFilteredByDate(event, activeFilters.date);
            if (includeArtistFilter) {
                const artistMatch = activeFilters.artist === 'all' || event.artist.name === activeFilters.artist;
                return countryMatch && dateMatch && artistMatch;
            } else {
                return countryMatch && dateMatch;
            }
        });
        return filteredEvents;
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

                if (group === 'country' || group === 'date' || group === 'artist') {
                    newFilters[group] = filter;
                }

                store.setState({ activeFilters: newFilters });
            });
            filterView.dataset.listenerAttached = 'true';
        }
    }
}

window.customElements.define('events-view', EventsView);
