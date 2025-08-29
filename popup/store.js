import { communicator, MessageType } from '../common/messaging.js';
import { storageManager } from '../common/storage.js';

class Store {
  constructor(initialState = {}) {
    this.state = initialState;
    this.listeners = new Set();
  }

  getState() {
    return this.state;
  }

  setState(newState) {
    const oldState = { ...this.state };
    this.state = { ...this.state, ...newState };

    if (newState.activeFilters !== undefined) {
      storageManager.set('activeFilters', newState.activeFilters);
    }

    if (newState.collapsedEventFilterGroups !== undefined) {
        storageManager.set('collapsedEventFilterGroups', newState.collapsedEventFilterGroups);
    }

    this.listeners.forEach(listener => listener(this.state));
  }

  subscribe(listener) {
    this.listeners.add(listener);
  }

  unsubscribe(listener) {
    this.listeners.delete(listener);
  }
}

const initialState = {
  artists: [],
  events: [],
  isLoading: true,
  eventsLoadingProgress: { current: 0, total: 0 },
    activeFilters: { country: 'everywhere', date: 'anytime', artist: 'all' },
  collapsedEventFilterGroups: [],
};

export const store = new Store(initialState);

async function loadInitialData() {
  store.setState({ isLoading: true });
  try {
    const [artists, events, oldActiveFilter, activeFilters, collapsedEventFilterGroups] = await Promise.all([
      storageManager.get('tracked-artists', []),
      storageManager.get('tracked-events', []),
      storageManager.get('activeEventFilter', null), // For migration
            storageManager.get('activeFilters', { country: 'everywhere', date: 'anytime', artist: 'all' }),
      storageManager.get('collapsedEventFilterGroups', [])
    ]);

    if (oldActiveFilter) {
      activeFilters.country = oldActiveFilter;
      await storageManager.set('activeFilters', activeFilters);
      await storageManager.remove('activeEventFilter');
    }

    store.setState({
      artists,
      events,
      activeFilters,
      collapsedEventFilterGroups,
      isLoading: false
    });
  } catch (error) {
    console.error('Failed to load initial data:', error);
    store.setState({ isLoading: false }); // Ensure loading state is always turned off
  }
}

// Listen for updates from the service worker
communicator.on(MessageType.ARTISTS_UPDATED, async () => {
  console.log('Store received ARTISTS_UPDATED');
  const artists = await storageManager.get('tracked-artists') || [];
  store.setState({ artists, isLoading: false });
});

communicator.on(MessageType.EVENTS_UPDATED, async () => {
  console.log('Store received EVENTS_UPDATED');
  const events = await storageManager.get('tracked-events') || [];
  store.setState({ events, isLoading: false, eventsLoadingProgress: { current: 0, total: 0 } });
});

communicator.on(MessageType.EVENTS_LOADING_PROGRESS, (progress) => {
  console.log('Store received EVENTS_LOADING_PROGRESS', progress);
  store.setState({ eventsLoadingProgress: progress });
});

// Initial data load when the popup opens
loadInitialData();
