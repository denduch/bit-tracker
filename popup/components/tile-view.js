class TileView extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
    }

    static get observedAttributes() {
        return ['image-src', 'name', 'details', 'date', 'status-text'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        this.render();
    }

    render() {
        const imageSrc = this.getAttribute('image-src');
        const name = this.getAttribute('name');
        const details = this.getAttribute('details');
        const dateStr = this.getAttribute('date');
        const date = dateStr ? new Date(dateStr) : null;
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
                    ${date ? `
                        <div class="date-display">
                            <div class="month">${this.getRomanMonth(date.getMonth())}</div>
                            <div class="year">${date.getFullYear()}</div>
                        </div>
                    ` : ''}
                    ${statusText ? `<div class="status-badge">${statusText}</div>` : ''}
                </div>
            </div>
        `;
    }

    getRomanMonth(monthIndex) {
        const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
        return romanMonths[monthIndex];
    }
}
window.customElements.define('tile-view', TileView);
