import { communicator, MessageType } from '../../common/messaging.js';
import { store } from '../store.js';

class TileView extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
        this.updateFavoritedClass();
    }

    updateFavoritedClass() {
        const isFavorited = this.getAttribute('is-favorited') === 'true';
        const tile = this.shadowRoot.querySelector('.tile');
        if (tile) {
            if (isFavorited) {
                tile.classList.add('favorited');
            } else {
                tile.classList.remove('favorited');
            }
        }
    }

    render() {
        const imageSrc = this.getAttribute('image-src');
        const name = this.getAttribute('name');
        const details = this.getAttribute('details');
        const countryCode = this.getAttribute('country-code');
        const type = this.getAttribute('type');
        const dateStr = parseInt(this.getAttribute('date'));
        const date = dateStr ? new Date(dateStr) : null;
        const statusText = this.getAttribute('status-text');
        const isTracked = this.getAttribute('is-tracked') === 'true';
        const spotifyId = this.getAttribute('spotify-id');
        const eventUrl = this.getAttribute('event-url');
        const isFavorited = this.getAttribute('is-favorited') === 'true';
        const eventId = this.getAttribute('event-id');

        const nameElement = type === 'events' 
            ? `<a class="name-link" href="${eventUrl || '#'}" target="_blank" rel="noopener noreferrer">${name}</a>`
            : `<div class="name">${name}</div>`;

        this.shadowRoot.innerHTML = `
            <link rel="stylesheet" href="styles/flags.css">
            <link rel="stylesheet" href="styles/buttons.css">
            <link rel="stylesheet" href="components/tile-view.css">
            <style>
                .tile.favorited {
                    border-color: #d4af37;
                    background: linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(212, 175, 55, 0.04) 100%);
                    box-shadow: 0 0 12px rgba(212, 175, 55, 0.3), var(--shadow-main);
                }
                
                .tile.favorited:hover {
                    box-shadow: 0 0 16px rgba(212, 175, 55, 0.5), var(--shadow-hover);
                    background: linear-gradient(135deg, rgba(212, 175, 55, 0.12) 0%, rgba(212, 175, 55, 0.06) 100%);
                }

                .tile.favorited .name-link {
                    color: white;
                }

                .tile.favorited .sub-details {
                    color: #d4af37;
                }
            </style>
            <div class="tile" data-type="${type}">
                <div class="image">
                    <img src="${imageSrc}" alt="${name}">
                </div>
                <div class="details">
                    ${nameElement}
                    <div class="sub-details">
                        ${countryCode ? `<span class="flag ${countryCode}"></span>` : ''}
                        ${details}
                    </div>
                </div>
                <div class="status">
                    ${type === 'events' ? `
                        <button class="favorite-button ${isFavorited ? 'favorited' : ''}" title="Add to favorites">
                            ${isFavorited ? '★' : '☆'}
                        </button>
                        <div class="date-display">
                            <div>
                                <span class="day">${date.getDate()}</span>
                                <span class="month">${this.getRomanMonth(date.getMonth())}</span>
                            </div>
                            <div class="year">${date.getFullYear()}</div>
                        </div>
                        <div class="event-spotify">
                            <button class="button primary small spotify-button" ${!spotifyId || spotifyId === 'null' ? 'disabled' : ''}>Spotify</button>
                        </div>
                    ` : ''}
                    ${type === 'artists' && statusText ? `<div class="status-badge">${statusText}</div>` : ''}
                    ${type === 'discover' ? `<button class="button secondary small skip-button">Skip</button>` : ''}
                    ${type === 'discover' ? `<span class="discover-on-tour ${statusText === 'ON TOUR' ? 'not' : ''}">${statusText === 'ON TOUR' ? 'Not on Tour' : 'On Tour'}</span>` : ''}
                    ${type === 'discover' ? `<button class="button ${isTracked ? 'secondary' : 'primary'} small follow-button ${isTracked ? 'tracked' : ''}">${isTracked ? 'Following' : 'Follow'}</button>` : ''}
                    ${type === 'discover' ? `<button class="button primary small spotify-button" ${!spotifyId || spotifyId === 'null' ? 'disabled' : ''}>Spotify</button>` : ''}
                </div>
                ${(type==='discover' || type==='events') && spotifyId && spotifyId !== 'null' ? `<div class="spotify-player hidden"></div>` : ''}
            </div>
        `;

        this.addEventListeners();
    }

    addEventListeners() {
        const followButton = this.shadowRoot.getElementById('follow-button');
        if (followButton) {
            followButton.addEventListener('click', (e) => {
                // Follow button handler
            });
        }

        const type = this.getAttribute('type');
        const tile = this.shadowRoot.querySelector('.tile');
        const spotifyId = this.getAttribute('spotify-id');
        const artistId = this.getAttribute('artist-id');
        const isTracked = this.getAttribute('is-tracked') === 'true';
        const isFavorited = this.getAttribute('is-favorited') === 'true';
        const eventId = this.getAttribute('event-id');

        if ((type === 'discover' || type === 'events') && tile) {
            tile.addEventListener('click', (e) => {
                const skipButton = e.target.closest('.skip-button');
                if (skipButton) {
                    const artistId = parseInt(this.getAttribute('artist-id'), 10);
                    communicator.broadcast(MessageType.SKIP_RECOMMENDATION, { artistId });
                    this.classList.add('hidden');
                    const spotifyPlayer = this.shadowRoot.querySelector('.spotify-player');
                    if(spotifyPlayer) {
                        spotifyPlayer.innerHTML = '';
                    }
                    return;
                }

                const followButton = e.target.closest('.follow-button');
                if (followButton) {
                    const newTrackedStatus = !isTracked;
                    // Optimistically update UI
                    this.setAttribute('is-tracked', newTrackedStatus.toString());
                    followButton.textContent = newTrackedStatus ? 'Following' : 'Follow';
                    if (newTrackedStatus) {
                        followButton.classList.add('secondary');
                        followButton.classList.remove('primary');
                    } else {
                        followButton.classList.add('primary');
                        followButton.classList.remove('secondary');
                    }

                    communicator.broadcast(MessageType.SET_ARTIST_TRACKING_STATUS, {
                        artistId,
                        track: newTrackedStatus,
                        csrfToken: store.csrfToken,
                    });
                }

                const spotifyButton = e.target.closest('.spotify-button');
                if (spotifyButton) {
                    const spotifyPlayer = this.shadowRoot.querySelector('.spotify-player');
                    if(spotifyPlayer.classList.contains('hidden')) {
                        spotifyPlayer.innerHTML = `<iframe src="https://open.spotify.com/embed/artist/${spotifyId}?theme=0" width="100%" height="80" frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe>`;
                        spotifyPlayer.classList.remove('hidden');
                    } else {
                        spotifyPlayer.classList.add('hidden');
                        spotifyPlayer.innerHTML = '';
                    }
                }

                const favoriteButton = e.target.closest('.favorite-button');
                if (favoriteButton) {
                    const currentIsFavorited = this.getAttribute('is-favorited') === 'true';
                    const newFavoritedStatus = !currentIsFavorited;
                    this.setAttribute('is-favorited', newFavoritedStatus.toString());
                    favoriteButton.textContent = newFavoritedStatus ? '★' : '☆';
                    favoriteButton.classList.toggle('favorited');
                    this.updateFavoritedClass();
                    
                    communicator.broadcast(MessageType.SET_EVENT_FAVORITE, {
                        eventId: parseInt(eventId),
                        favorite: newFavoritedStatus,
                    });
                }
            });
        }
    }

    getRomanMonth(monthIndex) {
        const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
        return romanMonths[monthIndex];
    }
}

window.customElements.define('tile-view', TileView);
