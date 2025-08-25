import { communicator, MessageType } from '../common/messaging.js';
import { store } from './store.js';
import { storageManager } from '../common/storage.js';

const CACHE_KEY = 'tracked-artists';

/**
 * Loads artists from local storage and updates the UI state.
 */
async function loadArtistsFromStorage() {
  console.log('Loading artists from storage...');
  store.setState({ isLoading: true });

  // 1. Get data from storage
  const storedData = await storageManager.get(CACHE_KEY, []);
  console.log('DEBUG: Data from storageManager.get:', storedData);

  store.setState({ artists: storedData.artists, isLoading: false });

  // const artistsView = document.querySelector('artists-view');
  // if (artistsView && artistsView.render) {
  //     console.log('Forcing artists-view re-render.');
  //     artistsView.render();
  // }
}

/**
 * Sets up event listeners for the popup.
 */
function initializeEventListeners() {
  // Listen for updates from the service worker
  communicator.on(MessageType.ARTISTS_UPDATED, () => {
    console.log('Received ARTISTS_UPDATED event, reloading from storage.');
    loadArtistsFromStorage();
  });
}

async function initializeMockToggle() {
  const toggle = document.getElementById('mock-toggle');

  const useMocks = await storageManager.get('useMocks', true);
  toggle.checked = useMocks;

  toggle.addEventListener('change', async (event) => {
    const newUseMocks = event.target.checked;
    await storageManager.set('useMocks', newUseMocks);
  });
}

// Initial setup
function initialize() {
  initializeEventListeners();
  initializeMockToggle();
  // Load initial data from storage.
  loadArtistsFromStorage();
}

initialize();
