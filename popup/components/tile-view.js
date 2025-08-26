class TileView extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
    }

    static get observedAttributes() {
        return ['image-src', 'name', 'details', 'status-text'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        this.render();
    }

    render() {
        const imageSrc = this.getAttribute('image-src');
        const name = this.getAttribute('name');
        const details = this.getAttribute('details');
        const statusText = this.getAttribute('status-text');

        this.shadowRoot.innerHTML = `
            <link rel="stylesheet" href="components/tile-view.css">
            <div class="tile">
                <div class="image">
                    <img src="${imageSrc}" alt="${name}">
                </div>
                <div class="details">
                    <div class="name">${name}</div>
                    <div class="sub-details">${details}</div>
                </div>
                <div class="status">
                    ${statusText ? `<span class="on-tour">${statusText}</span>` : ''}
                </div>
            </div>
        `;
    }
}

window.customElements.define('tile-view', TileView);
