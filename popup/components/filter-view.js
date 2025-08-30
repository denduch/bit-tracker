import { storageManager } from '../../common/storage.js';

class FilterView extends HTMLElement {
    _config = [];
    _activeFilters = { country: 'everywhere', date: 'anytime', artist: 'all' };

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

    async connectedCallback() {
        await this.render();
        this.addEventListeners();
    }

    addEventListeners() {
        this.shadowRoot.addEventListener('click', async (e) => {
            const filterOption = e.target.closest('.filter-option');
            if (filterOption && this._config) {
                const value = filterOption.dataset.value;
                const group = filterOption.dataset.group;

                const isDateGroup = this._config.find(c => c.label === 'Filter by date')?.options.some(o => o.group === group);
                const isArtistGroup = this._config.find(c => c.label === 'Filter by artist')?.options.some(o => o.group === group);
                
                let filterType, defaultValue;
                if (isDateGroup) {
                    filterType = 'date';
                    defaultValue = 'anytime';
                } else if (isArtistGroup) {
                    filterType = 'artist';
                    defaultValue = 'all';
                } else {
                    filterType = 'country';
                    defaultValue = 'everywhere';
                }

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
                group.classList.toggle('collapsed');
                
                const groupName = group.dataset.groupName;
                let collapsedGroups = await storageManager.get('collapsedEventFilterGroups', []);
                
                if (group.classList.contains('collapsed')) {
                    if (!collapsedGroups.includes(groupName)) {
                        collapsedGroups.push(groupName);
                    }
                } else {
                    collapsedGroups = collapsedGroups.filter(g => g !== groupName);
                }
                await storageManager.set('collapsedEventFilterGroups', collapsedGroups);
            }
        });
    }

    updateActiveState() {
        this.shadowRoot.querySelectorAll('.filter-option').forEach(option => {
            const value = option.dataset.value;
            const group = option.dataset.group;
            const isDateGroup = this._config.find(c => c.label === 'Filter by date')?.options.some(o => o.group === group);
            const isArtistGroup = this._config.find(c => c.label === 'Filter by artist')?.options.some(o => o.group === group);
            
            let filterType;
            if (isDateGroup) {
                filterType = 'date';
            } else if (isArtistGroup) {
                filterType = 'artist';
            } else {
                filterType = 'country';
            }

            option.classList.toggle('active', value === this._activeFilters[filterType]);
        });
    }

    async render() {
        const collapsedGroups = await storageManager.get('collapsedEventFilterGroups', []);
        this.shadowRoot.innerHTML = `
            <link rel="stylesheet" href="components/filter-view.css">
            <div class="filter-container">
                ${this._config.map(group => `
                    <div 
                        class="filter-group ${collapsedGroups.includes(group.label) ? 'collapsed' : ''}"
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
    }
}

customElements.define('filter-view', FilterView);
