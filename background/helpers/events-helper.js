
import { apiProvider } from '../api/index.js';
import { communicator, MessageType } from '../../common/messaging.js';
import { storageManager } from '../../common/storage.js';

const DATA_CACHE_KEY = 'tracked-data';

export const fetchEvents = async () => {
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

      // Update spotifyIds for artists
      for (const { artistId, events, spotifyId } of newEvents) {
        const artist = artistsById.get(artistId);
        if (artist) {
          artist.spotifyId = spotifyId;
          artist.events = events;
          artist.eventsLastFetched = Date.now();
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