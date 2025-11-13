import { store } from '../store.js';
import { getCountryAndFlag, getCountryFilterGroups, europeanCountries, normalizeCountry, getDateFilterGroups, getArtistFilterGroups } from '../../common/location-helper.js';
import { communicator, MessageType } from '../../common/messaging.js';
import { storageManager } from '../../common/storage.js';
import { waitForComponentReady } from './component-ready.js';
import './tile-view.js';
import './filter-view.js';

class EventsView extends HTMLElement {
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
        const artists = await storageManager.get('tracked-data', []);
        store.setState({ artists });
        this.render();
    }

    async render() {
        const { artists, activeFilters, collapsedEventFilterGroups } = store.getState();
        const favoriteEvents = await storageManager.get('favorite-events', []);

        const allEvents = artists.flatMap(artist => 
            (artist.events || []).map(event => ({ ...event, artist }))
        );

        const sortedEvents = allEvents.sort((a, b) => new Date(parseInt(a.startsAt)) - new Date(parseInt(b.startsAt)));
        
        // Filter by country and date for events display
        const eventsFilteredByCountryAndDate = sortedEvents.filter(event => {
            const { country } = getCountryAndFlag(event.location);
            const countryMatch = this.isEventFilteredByCountry(normalizeCountry(country), activeFilters.country);
            const dateMatch = !this.isEventFilteredByDate(event, activeFilters.date);
            return countryMatch && dateMatch;
        });

        // Apply artist filter on top of country/date filtering
        let filteredEvents = activeFilters.artist === 'all'
            ? eventsFilteredByCountryAndDate
            : eventsFilteredByCountryAndDate.filter(event => event.artist.name === activeFilters.artist);

        // Apply favorites filter if enabled
        if (activeFilters.favorites) {
            filteredEvents = filteredEvents.filter(event => favoriteEvents.map(id => parseInt(id)).includes(parseInt(event.id)));
        }
        
        const filteredEventsIds = filteredEvents.map(event => event.id);

        const countryFilterGroups = getCountryFilterGroups(sortedEvents);
        const dateFilterGroups = getDateFilterGroups();
        const artistFilterGroups = getArtistFilterGroups(sortedEvents, eventsFilteredByCountryAndDate);

        this.shadowRoot.innerHTML = `
            <link rel="stylesheet" href="styles/buttons.css">
            <link rel="stylesheet" href="styles/flags.css">
            <link rel="stylesheet" href="components/events-view.css">
            <div class="container">
                <div class="panel-header"></div>
                <div class="content">
                    <filter-view></filter-view>
                    <div class="events-list-container">
                        <div class="events-list list-container">
                            ${filteredEvents.length > 0 ? sortedEvents.map(event => {
                                    const { country, code, cleanLocation } = getCountryAndFlag(event.location);
                                    const details = `${country}, ${cleanLocation}`;
                                    const isFavorited = favoriteEvents.map(id => parseInt(id)).includes(parseInt(event.id));
                                    return `
                                    <tile-view class="event-tile ${filteredEventsIds.includes(event.id) ? '' : 'hidden'}"
                                        data-country="${normalizeCountry(country)}"
                                        data-id="${event.id}"
                                        data-name="${event.artist.name}"
                                        type="events"
                                        image-src="${event.artist.properlySizedArtistImageURL}"
                                        name="${event.artist.name}"
                                        details="${details}"
                                        country-code="${code}"
                                        spotify-id="${event.artist.spotifyId}"
                                        event-url="${event.eventUrl || ''}"
                                        event-id="${event.id}"
                                        is-favorited="${isFavorited}"
                                        date="${parseInt(event.startsAt)}">
                                    </tile-view>
                                `}).join('') : '<p>No upcoming events found.</p>'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.renderHeader(filteredEvents.length);
        this.updateFilterView([...countryFilterGroups, ...dateFilterGroups, ...artistFilterGroups], activeFilters, collapsedEventFilterGroups);
        this.attachEventListeners();
    }

    renderHeader(visibleEventsCount) {
        const header = this.shadowRoot.querySelector('.panel-header');
        if (!header) return;

        const { activeFilters } = store.getState();
        const showOnlyFavorites = activeFilters.favorites || false;
        header.innerHTML = `
            <button id="favorites-button" class="favorites-button ${showOnlyFavorites ? 'active' : ''}" title="Show only favorites">
                ${showOnlyFavorites ? '★' : '☆'}
            </button>
            <h2><span class="count">${visibleEventsCount}</span> Events</h2>
            <div class="header-buttons">
                <button id="refresh-button" class="button primary refresh-events-button refresh-button" title="Refresh event list">&#x21bb;</button>
            </div>
        `;
    }

    updateHeader(visibleEventsCount) {
        const header = this.shadowRoot.querySelector('.panel-header');
        if (!header) return;

        const { activeFilters } = store.getState();
        const showOnlyFavorites = activeFilters.favorites || false;
        
        // Update count
        const countSpan = header.querySelector('.count');
        if (countSpan) {
            countSpan.textContent = visibleEventsCount;
        }
        
        // Update favorites button
        const favoritesButton = header.querySelector('.favorites-button');
        if (favoritesButton) {
            favoritesButton.textContent = showOnlyFavorites ? '★' : '☆';
            favoritesButton.classList.toggle('active', showOnlyFavorites);
        }
    }

    async updateEventList() {
        const { artists, activeFilters } = store.getState();
        const favoriteEvents = await storageManager.get('favorite-events', []);
        const eventsList = this.shadowRoot.querySelectorAll('.events-list .event-tile');

        const allEvents = artists.flatMap(artist => 
            (artist.events || []).map(event => ({ ...event, artist }))
        );

        const sortedEvents = allEvents.sort((a, b) => new Date(parseInt(a.startsAt)) - new Date(parseInt(b.startsAt)));

        const eventsFilteredByCountryAndDate = sortedEvents.filter(event => {
            const { country } = getCountryAndFlag(event.location);
            const countryMatch = this.isEventFilteredByCountry(normalizeCountry(country), activeFilters.country);
            const dateMatch = !this.isEventFilteredByDate(event, activeFilters.date);
            return countryMatch && dateMatch;
        });

        // Apply artist filter on top of country/date filtering
        let filteredEvents = activeFilters.artist === 'all'
            ? eventsFilteredByCountryAndDate
            : eventsFilteredByCountryAndDate.filter(event => event.artist.name === activeFilters.artist);

        // Apply favorites filter if enabled
        if (activeFilters.favorites) {
            filteredEvents = filteredEvents.filter(event => favoriteEvents.map(id => parseInt(id)).includes(parseInt(event.id)));
        }

        const filteredEventsIds = filteredEvents.map(event => event.id);

        eventsList.forEach(event => {
            const eventId = parseInt(event.dataset.id);
            if(filteredEventsIds.includes(eventId)) {
                event.classList.remove('hidden');
            } else {
                event.classList.add('hidden');
            }
        });

        this.updateHeader(filteredEventsIds.length);
        this.updateArtistFilterGroups(eventsFilteredByCountryAndDate);
    }

    updateArtistFilterGroups(eventsFilteredByCountryAndDate) {
        const simplifiedFilteredArtists = [...new Set(eventsFilteredByCountryAndDate.map(event => event.artist.name))];
        console.log('simplifiedFilteredArtists', simplifiedFilteredArtists);
        this.shadowRoot.querySelector('filter-view').updateFilterGroups('artist', simplifiedFilteredArtists);
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
        const eventDate = new Date(parseInt(event.startsAt));
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
                communicator.broadcast(MessageType.REQUEST_EVENTS_FETCH);
            });
            refreshButton.dataset.listenerAttached = 'true';
        }

        const favoritesButton = this.shadowRoot.getElementById('favorites-button');
        if (favoritesButton && !favoritesButton.dataset.listenerAttached) {
            favoritesButton.addEventListener('click', () => {
                const currentFilters = store.getState().activeFilters;
                const newFilters = { ...currentFilters, favorites: !currentFilters.favorites };
                store.setState({ activeFilters: newFilters });
                this.updateEventList();
                this.updateHeader(this.shadowRoot.querySelectorAll('.events-list .event-tile:not(.hidden)').length);
            });
            favoritesButton.dataset.listenerAttached = 'true';
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
                this.updateEventList();

            });
            filterView.dataset.listenerAttached = 'true';
        }

        waitForComponentReady(this, ['tile-view', 'filter-view']);
    }
}

window.customElements.define('events-view', EventsView);
