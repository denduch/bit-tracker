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

    static get observedAttributes() {
        return ['image-src', 'name', 'details', 'date', 'status-text', 'country-code', 'artist-id', 'is-tracked'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        // Re-render only if it's not a tracking status change from within
        if (name !== 'is-tracked' || oldValue === null) {
            this.render();
        }
    }

    render() {
        const imageSrc = this.getAttribute('image-src');
        const name = this.getAttribute('name');
        const details = this.getAttribute('details');
        const countryCode = this.getAttribute('country-code');
        const type = this.getAttribute('type');
        const dateStr = this.getAttribute('date');
        const date = dateStr ? new Date(dateStr) : null;
        const statusText = this.getAttribute('status-text');
        const artistId = this.getAttribute('artist-id');
        const isTracked = this.getAttribute('is-tracked') === 'true';
        console.log('artistId', {artistId, isTracked});

        this.shadowRoot.innerHTML = `
            <link rel="stylesheet" href="styles/flags.css">
            <link rel="stylesheet" href="components/tile-view.css">
            <div class="tile">
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
                    ${type === 'artists' ? `<div class="status-badge">${statusText}</div>` : ''}
                    ${type === 'discover' ? `<button id="follow-button" class="follow-button ${isTracked ? 'tracked' : ''}">${isTracked ? 'Following' : 'Follow'}</button>` : ''}
                </div>
            </div>
        `;

        this.addEventListeners();
    }

    addEventListeners() {
        const followButton = this.shadowRoot.getElementById('follow-button');
        if (followButton) {
            followButton.addEventListener('click', (e) => {
                e.stopPropagation();
                const artistId = this.getAttribute('artist-id');
                const isTracked = this.getAttribute('is-tracked') === 'true';
                const newTrackedStatus = !isTracked;

                // Optimistically update UI
                this.setAttribute('is-tracked', newTrackedStatus.toString());
                followButton.textContent = newTrackedStatus ? 'Following' : 'Follow';
                followButton.classList.toggle('tracked', newTrackedStatus);

                communicator.broadcast(MessageType.SET_ARTIST_TRACKING_STATUS, {
                    artistId,
                    track: newTrackedStatus,
                    csrfToken: store.csrfToken,
                });
            });
        }
    }

    getRomanMonth(monthIndex) {
        const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
        return romanMonths[monthIndex];
    }
}

window.customElements.define('tile-view', TileView);
