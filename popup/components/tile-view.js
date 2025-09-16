import { communicator, MessageType } from '../../common/messaging.js';
import { store } from '../store.js';

class TileView extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
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

        this.shadowRoot.innerHTML = `
            <link rel="stylesheet" href="styles/flags.css">
            <link rel="stylesheet" href="styles/buttons.css">
            <link rel="stylesheet" href="components/tile-view.css">
            <div class="tile" data-type="${type}">
                <div class="image">
                    <img src="${imageSrc}" alt="${name}">
                </div>
                <div class="details">
                    <div class="name">${name}</div>
                    <div class="sub-details">
                        ${countryCode ? `<span class="flag ${countryCode}"></span>` : ''}
                        ${details}
                    </div>
                </div>
                <div class="status">
                    ${type === 'events' ? `
                        <div class="date-display">
                            <div>
                                <span class="day">${date.getDate()}</span>
                                <span class="month">${this.getRomanMonth(date.getMonth())}</span>
                            </div>
                            <div class="year">${date.getFullYear()}</div>
                        </div>
                    ` : ''}
                    ${type === 'artists' && statusText ? `<div class="status-badge">${statusText}</div>` : ''}
                    ${type === 'discover' ? `<button class="button secondary small skip-button">Skip</button>` : ''}
                    ${type === 'discover' ? `<span class="discover-on-tour ${statusText === 'ON TOUR' ? 'not' : ''}">${statusText === 'ON TOUR' ? 'Not on Tour' : 'On Tour'}</span>` : ''}
                    ${type === 'discover' ? `<button class="button ${isTracked ? 'secondary' : 'primary'} small follow-button ${isTracked ? 'tracked' : ''}">${isTracked ? 'Following' : 'Follow'}</button>` : ''}
                    ${type === 'discover' ? `<button class="button primary small spotify-button" ${!spotifyId || spotifyId === 'null' ? 'disabled' : ''}>Spotify</button>` : ''}
                </div>
                ${type==='discover' && spotifyId && spotifyId !== 'null' ? `<div class="spotify-player hidden"></div>` : ''}
            </div>
        `;

        this.addEventListeners();
    }

    addEventListeners() {
        const followButton = this.shadowRoot.getElementById('follow-button');
        if (followButton) {
            followButton.addEventListener('click', (e) => {
                console.log('Follow button clicked');
                
            });
        }

        const type = this.getAttribute('type');
        const tile = this.shadowRoot.querySelector('.tile');
        const spotifyId = this.getAttribute('spotify-id');
        const artistId = this.getAttribute('artist-id');
        const isTracked = this.getAttribute('is-tracked') === 'true';

        if (type === 'discover' && tile) {
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
                    console.log('Follow button clicked');
                    const newTrackedStatus = !isTracked;
                    console.log('Artist ID:', artistId, isTracked);
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
                    console.log('Spotify button clicked');
                    const spotifyPlayer = this.shadowRoot.querySelector('.spotify-player');
                    if(spotifyPlayer.classList.contains('hidden')) {
                        spotifyPlayer.innerHTML = `<iframe src="https://open.spotify.com/embed/artist/${spotifyId}?theme=0" width="100%" height="80" frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe>`;
                        spotifyPlayer.classList.remove('hidden');
                    } else {
                        spotifyPlayer.classList.add('hidden');
                        spotifyPlayer.innerHTML = '';
                    }
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
