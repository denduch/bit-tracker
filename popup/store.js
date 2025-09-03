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
  recommendations: [],
  csrfToken: null,
  isLoading: true,
  isLoadingRecommendations: true,
  eventsLoadingProgress: { current: 0, total: 0 },
  activeFilters: { country: 'everywhere', date: 'anytime', artist: 'all' },
};

export const store = new Store(initialState);

async function loadInitialData() {
  store.setState({ isLoading: true });
  try {
    const [artists, recommendations, oldActiveFilter, activeFilters] = await Promise.all([
      storageManager.get('tracked-data', []),
      storageManager.get('recommendations-data', []),
      storageManager.get('activeEventFilter', null), // For migration
      storageManager.get('activeFilters', { country: 'everywhere', date: 'anytime', artist: 'all' })
    ]);

    if (oldActiveFilter) {
      activeFilters.country = oldActiveFilter;
      await storageManager.set('activeFilters', activeFilters);
      await storageManager.remove('activeEventFilter');
    }

    store.setState({
      artists,
      recommendations,
      activeFilters,
      isLoading: false,
      isLoadingRecommendations: false
    });
  } catch (error) {
    console.error('Failed to load initial data:', error);
    store.setState({ isLoading: false }); // Ensure loading state is always turned off
  }
}

// Listen for updates from the service worker
communicator.on(MessageType.DATA_UPDATED, async () => {
  console.log('Store received DATA_UPDATED');
  const [artists, recommendations] = await Promise.all([
    storageManager.get('tracked-data', []),
    storageManager.get('recommendations-data', [])
  ]);
  store.setState({ 
    artists, 
    recommendations,
    isLoading: false, 
    isLoadingRecommendations: false,
    eventsLoadingProgress: { current: 0, total: 0 } 
  });
});

communicator.on(MessageType.EVENTS_LOADING_PROGRESS, (progress) => {
  console.log('Store received EVENTS_LOADING_PROGRESS', progress);
  store.setState({ eventsLoadingProgress: progress });
});

communicator.on(MessageType.CSRF_TOKEN_UPDATED, ({ token }) => {
  console.log('Store received CSRF_TOKEN_UPDATED', token);
  store.setState({ csrfToken: token });
});

// Initial data load when the popup opens
loadInitialData();
