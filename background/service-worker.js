import { communicator, MessageType } from '../common/messaging.js';
import { apiProvider } from './api/index.js';
import { storageManager } from '../common/storage.js';

const DATA_CACHE_KEY = 'tracked-data';
const ARTISTS_LAST_FETCHED_KEY = 'artists-last-fetched';
const FETCH_ALARM_NAME = 'fetch-data-alarm';
const RECOMMENDATIONS_CACHE_KEY = 'recommendations-data';

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

async function fetchArtists(force = false) {
  try {
    const lastFetched = await storageManager.get(ARTISTS_LAST_FETCHED_KEY, 0);
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;

    if (!force && lastFetched > twentyFourHoursAgo) {
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

async function fetchEvents() {
  try {
    console.log('Checking for events to fetch...');
    const allArtists = await storageManager.get(DATA_CACHE_KEY, []);

    if (allArtists.length === 0) {
      console.log('No artists in cache, skipping event fetch.');
      await communicator.broadcast(MessageType.DATA_UPDATED);
      return;
    }

    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
    const artistsToUpdate = allArtists.filter(artist => 
      !artist.eventsLastFetched || artist.eventsLastFetched < twentyFourHoursAgo
    );

    if (artistsToUpdate.length === 0) {
      console.log('All artist events are up-to-date.');
      await communicator.broadcast(MessageType.DATA_UPDATED);
      return;
    }

    console.log(`Found ${artistsToUpdate.length} artists needing event updates.`);
    const newEvents = await apiProvider.getArtistEvents(artistsToUpdate);

    const artistsById = new Map(allArtists.map(artist => [artist.id, artist]));

    // Update timestamps and clear old events for updated artists
    for (const updatedArtist of artistsToUpdate) {
      const artist = artistsById.get(updatedArtist.id);
      if (artist) {
        artist.events = []; // Clear old events
        artist.eventsLastFetched = Date.now();
      }
    }

    // Add new events
    for (const event of newEvents) {
      const artist = artistsById.get(event.artist_id);
      if (artist) {
        artist.events.push(event);
      }
    }

    const combinedData = Array.from(artistsById.values());
    await storageManager.set(DATA_CACHE_KEY, combinedData, true);
    console.log('Successfully updated events and timestamps.');
    await communicator.broadcast(MessageType.DATA_UPDATED);

  } catch (error) {
    console.error('Failed to fetch events:', error);
    await communicator.broadcast(MessageType.DATA_UPDATED); // Ensure UI resets loading state
  }
}

communicator.on(MessageType.REQUEST_ARTIST_FETCH, () => fetchArtists(true));
async function fetchRecommendations() {
  try {
    console.log('Fetching recommendations...');
    const recommendations = await apiProvider.getRecommendations();
    await storageManager.set(RECOMMENDATIONS_CACHE_KEY, recommendations, true);
    console.log('Successfully cached recommendations.');
    await communicator.broadcast(MessageType.DATA_UPDATED);
  } catch (error) {
    console.error('Failed to fetch recommendations:', error);
    await communicator.broadcast(MessageType.DATA_UPDATED); // Ensure UI resets loading state
  }
}

communicator.on(MessageType.REQUEST_ARTIST_FETCH, () => fetchArtists(true));
communicator.on(MessageType.REQUEST_EVENTS_FETCH, fetchEvents);
communicator.on(MessageType.REQUEST_RECOMMENDATIONS_FETCH, fetchRecommendations);

// Alarms for periodic fetching
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed, creating alarm.');
  chrome.alarms.create(FETCH_ALARM_NAME, {
    delayInMinutes: 1, // Start after 1 minute
    periodInMinutes: 60 // Repeat every hour
  });
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === FETCH_ALARM_NAME) {
    console.log('Alarm triggered: fetching fresh data...');
    await fetchArtists(false);
  }
});

console.log('Service worker is listening for messages and alarms...');
