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
                            <div class="month">${this.toRoman(date.getMonth() + 1)}</div>
                            <div class="year">${date.getFullYear()}</div>
                        </div>
                    ` : ''}
                    ${statusText ? `<div class="status-badge">${statusText}</div>` : ''}
                </div>
            </div>
        `;
    }

    toRoman(num) {
        const roman = { M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1 };
        let str = '';

        for (let i of Object.keys(roman)) {
            let q = Math.floor(num / roman[i]);
            num -= q * roman[i];
            str += i.repeat(q);
        }

        return str;
    }
}
window.customElements.define('tile-view', TileView);
