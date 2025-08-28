class FilterView extends HTMLElement {
    _config = [];
    _activeFilter = '';
    _collapsedGroups = [];

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    set config(newConfig) {
        this._config = newConfig;
        this.render();
    }

    set activeFilter(newValue) {
        this._activeFilter = newValue;
        this.updateActiveState();
    }

    set collapsedGroups(groups) {
        this._collapsedGroups = groups || [];
        this.updateCollapsedState();
    }

    connectedCallback() {
        this.render();
        this.addEventListeners();
    }

    addEventListeners() {
        this.shadowRoot.addEventListener('click', (e) => {
            const filterOption = e.target.closest('.filter-option');
            if (filterOption) {
                const value = filterOption.dataset.value;
                if (this._activeFilter === value) {
                    this.dispatchEvent(new CustomEvent('filter-changed', { detail: { filter: 'everywhere' } }));
                } else {
                    this.dispatchEvent(new CustomEvent('filter-changed', { detail: { filter: value } }));
                }
                return;
            }

            const groupLabel = e.target.closest('.group-label');
            if (groupLabel) {
                const group = groupLabel.closest('.filter-group');
                const groupName = group.dataset.groupName;
                this.dispatchEvent(new CustomEvent('group-toggle', { detail: { groupName } }));
            }
        });
    }

    updateActiveState() {
        this.shadowRoot.querySelectorAll('.filter-option').forEach(option => {
            option.classList.toggle('active', option.dataset.value === this._activeFilter);
        });
    }

    updateCollapsedState() {
        if (!this.shadowRoot) return;
        this.shadowRoot.querySelectorAll('.filter-group').forEach(group => {
            const groupName = group.dataset.groupName;
            group.classList.toggle('collapsed', this._collapsedGroups.includes(groupName));
        });
    }

    render() {
        this.shadowRoot.innerHTML = `
            <link rel="stylesheet" href="components/filter-view.css">
            <div class="filter-container">
                ${this._config.map(group => `
                    <div 
                        class="filter-group ${this._collapsedGroups.includes(group.label) ? 'collapsed' : ''}"
                        data-group-name="${group.label}"
                    >
                        ${group.label ? `<div class="group-label">${group.label}</div>` : ''}
                        <div class="options-wrapper">
                            ${group.options.map(option => `
                                <div class="filter-option" data-value="${option.value}">
                                    ${option.label}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        this.updateActiveState();
        this.updateCollapsedState();
    }
}

customElements.define('filter-view', FilterView);
