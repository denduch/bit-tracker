import { communicator, MessageType } from '../common/messaging.js';
import { apiProvider } from './api/index.js';
import { storageManager } from '../common/storage.js';

const CACHE_KEY = 'tracked-artists';
/**
 * Fetches the latest artist data from the API, stores it in the cache,
 * and then broadcasts a message to notify all parts of the extension.
 */
async function fetchAndNotify() {
  console.log('Starting artist fetch...');
  try {
    const artists = await apiProvider.getTrackedArtists();
    await storageManager.set(CACHE_KEY, artists, true); // The `true` flag marks it as cacheable data
    console.log('Successfully fetched and cached artists.');
    await communicator.broadcast(MessageType.ARTISTS_UPDATED);
  } catch (error) {
    console.error('Failed to fetch and cache artists:', error);
    // Optionally, broadcast an error message so the UI can react
    // await communicator.broadcast(MessageType.ARTIST_FETCH_FAILED, { message: error.message });
  }
}

// Listen for a request from the popup to start a fetch operation.
communicator.on(MessageType.REQUEST_ARTIST_FETCH, (payload, sender) => {
  console.log('Received REQUEST_ARTIST_FETCH from', sender.tab ? 'tab ' + sender.tab.id : 'popup');
  fetchAndNotify();
});

console.log('Service worker is listening for messages...');
