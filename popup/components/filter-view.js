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
                const defaultOption = filterOption.parentNode.querySelector('[data-default]');
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
                    filterOption.classList.remove('active');
                    defaultOption.classList.add('active');
                    this._activeFilters[filterType] = defaultValue;
                    this.dispatchEvent(new CustomEvent('filter-changed', { detail: { filter: defaultValue, group: filterType } }));
                } else {
                    const activeSibling = filterOption.parentNode.querySelector('.active');
                    activeSibling.classList.remove('active');
                    filterOption.classList.add('active');
                    this._activeFilters[filterType] = value;
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

    updateFilterGroups(group, selectedFilters) {
        const updatedGroup = this.shadowRoot.querySelector(`[data-group-id="${group}"]`);
        const filters = updatedGroup.querySelectorAll('.filter-option');

        filters.forEach(filter => {
            const value = filter.dataset.value;
            const isArtistFiltered = !selectedFilters.includes(value);
            const isDefaultOption = value === 'all';
            filter.classList.toggle('hidden', isArtistFiltered && !isDefaultOption);
        });

        const hasVisibleActiveFilter = [...filters].some(filter => filter.classList.contains('active') && !filter.classList.contains('hidden'));
        if (!hasVisibleActiveFilter) {
            const defaultOption = updatedGroup.querySelector('[data-default]');
            updatedGroup.querySelector('.active').classList.remove('active');
            defaultOption.classList.add('active');
            this._activeFilters[group] = defaultOption.dataset.value;
            this.dispatchEvent(new CustomEvent('filter-changed', { detail: { filter: defaultOption.dataset.value, group } }));
        }
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
                        data-group-id="${group.group}"
                    >
                        ${group.label ? `<div class="group-label">${group.label}</div>` : ''}
                        <div class="options-wrapper">
                            ${group.options.map(option => `
                                <div class="filter-option ${option.hidden ? 'hidden' : ''}" data-value="${option.value}" data-group="${option.group}" ${option.default ? 'data-default' : ''}>
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
