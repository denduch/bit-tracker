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

communicator.on(MessageType.REQUEST_ARTIST_FETCH, fetchArtists);
communicator.on(MessageType.REQUEST_EVENTS_FETCH, fetchEvents);

console.log('Service worker is listening for messages...');
