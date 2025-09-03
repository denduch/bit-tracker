
import { apiProvider } from '../api/index.js';
import { communicator, MessageType } from '../../common/messaging.js';
import { storageManager } from '../../common/storage.js';
import { fetchEvents } from './events-helper.js';

const ARTISTS_LAST_FETCHED_KEY = 'artists-last-fetched';
const DATA_CACHE_KEY = 'tracked-data';

async function combineAndStore(newArtists) {
  const oldArtists = await storageManager.get(DATA_CACHE_KEY, []);
  const oldArtistsMap = new Map(oldArtists.map(artist => [artist.id, artist]));

  const finalArtists = newArtists.map(newArtist => {
    const oldArtist = oldArtistsMap.get(newArtist.id);
    if (oldArtist) {
      // Artist exists, merge new data but preserve old events and timestamp
      return { ...oldArtist, ...newArtist };
    } else {
      // This is a completely new artist, return it as is
      return newArtist;
    }
  });

  await storageManager.set(DATA_CACHE_KEY, finalArtists, true);
  console.log('Successfully combined and cached data.');
  await communicator.broadcast(MessageType.DATA_UPDATED);
}

export const fetchArtists = async () => {
  try {
    const lastFetched = await storageManager.get(ARTISTS_LAST_FETCHED_KEY, 0);
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;

    if (lastFetched > twentyFourHoursAgo) {
      console.log('Artists list is up-to-date, skipping fetch. Fetching events instead.');
      await fetchEvents();
      return;
    }

    console.log('Fetching artists...');
    const newArtists = await apiProvider.getTrackedArtists();
    await combineAndStore(newArtists);
    await storageManager.set(ARTISTS_LAST_FETCHED_KEY, Date.now());
    await fetchEvents(); // Chain event fetching after artists are fetched
  } catch (error) {
    console.error('Failed to fetch artists:', error);
  }
}