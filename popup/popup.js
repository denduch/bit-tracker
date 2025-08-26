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

  const storedData = await storageManager.get(CACHE_KEY, []);
  console.log('DEBUG: Data from storageManager.get:', storedData);

  store.setState({ artists: storedData.artists, isLoading: false });
}

/**
 * Sets up event listeners for the popup.
 */
function initializeEventListeners() {
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

function initialize() {
  initializeEventListeners();
  initializeMockToggle();
  loadArtistsFromStorage();
}

initialize();
