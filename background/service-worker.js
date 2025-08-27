import { communicator, MessageType } from '../common/messaging.js';
import { apiProvider } from './api/index.js';
import { storageManager } from '../common/storage.js';

const ARTIST_CACHE_KEY = 'tracked-artists';
const EVENT_CACHE_KEY = 'tracked-events';
/**
 * Fetches the latest artist data from the API, stores it in the cache,
 * and then broadcasts a message to notify all parts of the extension.
 */
async function fetchAndNotify() {
  console.log('Starting artist fetch...');
  try {
    const artists = await apiProvider.getTrackedArtists();
    await storageManager.set(ARTIST_CACHE_KEY, artists, true); // The `true` flag marks it as cacheable data
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

/**
 * Fetches the latest event data from the API, stores it in the cache,
 * and then broadcasts a message to notify all parts of the extension.
 */
async function fetchEventsAndNotify() {
  console.log('Starting event fetch...');
  try {
    const events = await apiProvider.getArtistEvents();
    await storageManager.set(EVENT_CACHE_KEY, events, true);
    console.log('Successfully fetched and cached events.');
    await communicator.broadcast(MessageType.EVENTS_UPDATED);
  } catch (error) {
    console.error('Failed to fetch and cache events:', error);
    // Optionally, broadcast an error message so the UI can react
  }
}

// Listen for a request from the popup to start an event fetch operation.
communicator.on(MessageType.REQUEST_EVENTS_FETCH, (payload, sender) => {
  console.log('Received REQUEST_EVENTS_FETCH from', sender.tab ? 'tab ' + sender.tab.id : 'popup');
  fetchEventsAndNotify();
});

console.log('Service worker is listening for messages...');
