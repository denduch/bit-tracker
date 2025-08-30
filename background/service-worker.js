import { communicator, MessageType } from '../common/messaging.js';
import { apiProvider } from './api/index.js';
import { storageManager } from '../common/storage.js';

const DATA_CACHE_KEY = 'tracked-data';

async function combineAndStore(artists, events) {
  const artistsById = new Map(artists.map(artist => [artist.id, { ...artist, events: [] }]));
  for (const event of events) {
    const artist = artistsById.get(event.artist_id);
    if (artist) {
      artist.events.push(event);
    }
  }
  const combinedData = Array.from(artistsById.values());
  await storageManager.set(DATA_CACHE_KEY, combinedData, true);
  console.log('Successfully combined and cached data.');
  await communicator.broadcast(MessageType.DATA_UPDATED);
}

async function fetchArtists() {
  try {
    console.log('Fetching artists...');
    const newArtists = await apiProvider.getTrackedArtists();
    const currentData = await storageManager.get(DATA_CACHE_KEY, []);
    const currentEvents = currentData.flatMap(artist => artist.events || []);
    await combineAndStore(newArtists, currentEvents);
  } catch (error) {
    console.error('Failed to fetch artists:', error);
  }
}

async function fetchEvents() {
  try {
    console.log('Fetching events...');
    const currentData = await storageManager.get(DATA_CACHE_KEY, []);
    const currentArtists = currentData.map(({ events, ...artist }) => artist);

    if (currentArtists.length === 0) {
      console.log('No artists in cache, skipping event fetch.');
      return;
    }
    const newEvents = await apiProvider.getArtistEvents(currentArtists);
    await combineAndStore(currentArtists, newEvents);
  } catch (error) {
    console.error('Failed to fetch events:', error);
  }
}

communicator.on(MessageType.REQUEST_ARTIST_FETCH, fetchArtists);
communicator.on(MessageType.REQUEST_EVENTS_FETCH, fetchEvents);

console.log('Service worker is listening for messages...');
