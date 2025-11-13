import { storageManager } from '../common/storage.js';

class Store {
  constructor() {
    this.state = { isReady: false };
    this.listeners = new Set();
  }

  getState() {
    return this.state;
  }

  setState(newState) {
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

  async loadInitialData() {
    try {
      const [artists, recommendations, activeFilters] = await Promise.all([
        storageManager.get('tracked-data', []),
        storageManager.get('recommendations-data', []),
        storageManager.get('activeFilters', { country: 'everywhere', date: 'anytime', artist: 'all', favorites: false })
      ]);

      this.setState({
        artists,
        recommendations,
        activeFilters,
        isReady: true,
      });
    } catch (error) {
      console.error('Failed to load initial data:', error);
      this.setState({ isReady: true });
    } 
  }
}

const store = new Store();
await store.loadInitialData();

export { store };


// // Listen for updates from the service worker
// communicator.on(MessageType.DATA_UPDATED, async () => {
//   console.log('Store received DATA_UPDATED');
//   const [artists, recommendations] = await Promise.all([
//     storageManager.get('tracked-data', []),
//     storageManager.get('recommendations-data', [])
//   ]);
//   store.setState({ 
//     artists, 
//     recommendations,
//     isLoading: false, 
//     isLoadingRecommendations: false,
//     eventsLoadingProgress: { current: 0, total: 0 } 
//   });
// });

// communicator.on(MessageType.EVENTS_LOADING_PROGRESS, (progress) => {
//   console.log('Store received EVENTS_LOADING_PROGRESS', progress);
//   store.setState({ eventsLoadingProgress: progress });
// });

// communicator.on(MessageType.CSRF_TOKEN_UPDATED, ({ token }) => {
//   console.log('Store received CSRF_TOKEN_UPDATED', token);
//   store.setState({ csrfToken: token });
// });

