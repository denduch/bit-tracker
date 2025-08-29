class FilterView extends HTMLElement {
    _config = [];
    _activeFilters = { country: 'everywhere', date: 'anytime' };
    _collapsedGroups = [];

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    set config(newConfig) {
        this._config = newConfig;
        this.render();
    }

    set activeFilters(newValues) {
        this._activeFilters = newValues;
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
            if (filterOption && this._config) {
                const value = filterOption.dataset.value;
                const group = filterOption.dataset.group;

                const isDateGroup = this._config.find(c => c.label === 'Filter by date').options.some(o => o.group === group);
                const filterType = isDateGroup ? 'date' : 'country';

                const defaultValue = filterType === 'date' ? 'anytime' : 'everywhere';

                if (this._activeFilters[filterType] === value) {
                    this.dispatchEvent(new CustomEvent('filter-changed', { detail: { filter: defaultValue, group: filterType } }));
                } else {
                    this.dispatchEvent(new CustomEvent('filter-changed', { detail: { filter: value, group: filterType } }));
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
            const value = option.dataset.value;
            const group = option.dataset.group;
            const isDateGroup = this._config.find(c => c.label === 'Filter by date')?.options.some(o => o.group === group);
            const filterType = isDateGroup ? 'date' : 'country';

            option.classList.toggle('active', value === this._activeFilters[filterType]);
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
                                <div class="filter-option" data-value="${option.value}" data-group="${option.group}">
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
