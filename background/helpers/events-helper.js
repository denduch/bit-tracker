
import { apiProvider } from '../api/index.js';
import { communicator, MessageType } from '../../common/messaging.js';
import { storageManager } from '../../common/storage.js';

const DATA_CACHE_KEY = 'tracked-data';

export const fetchEvents = async () => {
    try {
      const allArtists = await storageManager.get(DATA_CACHE_KEY, []);
  
      if (allArtists.length === 0) {
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
  
      const artistsById = new Map(allArtists.map(artist => [artist.id, artist]));

      const BATCH_SIZE = 2;
      const DELAY_MS = 2000;
      let shouldStop = false;
      const totalBatches = Math.ceil(artistsToUpdate.length / BATCH_SIZE);

      for (let i = 0; i < artistsToUpdate.length && !shouldStop; i += BATCH_SIZE) {
        const batch = artistsToUpdate.slice(i, i + BATCH_SIZE);
        const currentBatch = Math.floor(i / BATCH_SIZE) + 1;
        console.log(`Processing events batch ${currentBatch}/${totalBatches} (artists ${i + 1}-${Math.min(i + BATCH_SIZE, artistsToUpdate.length)} of ${artistsToUpdate.length})`);

        try {
          // Fetch events for the whole batch at once
          const batchResults = await apiProvider.getArtistEvents(batch);
          
          // Process and save each artist's results immediately
          for (const result of batchResults) {
            const { artistId, events, spotifyId } = result;
            const target = artistsById.get(artistId);
            if (target) {
              target.spotifyId = spotifyId;
              target.events = events.map(event => ({ ...event, startsAt: new Date(event.startsAt).getTime() }));
              target.eventsLastFetched = Date.now();
              
              // Persist immediately after each artist is processed
              const combinedData = Array.from(artistsById.values());
              await storageManager.set(DATA_CACHE_KEY, combinedData, true);
            }
          }
        } catch (err) {
          if (err && err.message === 'HTTP_403_FORBIDDEN') {
            console.error('Events fetch error: 403 Forbidden - stopping further requests');
            shouldStop = true;
            break;
          }
          console.error('Events fetch error:', err);
        }

        if (i + BATCH_SIZE < artistsToUpdate.length && !shouldStop) {
          await new Promise(resolve => setTimeout(resolve, DELAY_MS));
        }
      }

      console.log('Finished updating events.');
      await communicator.broadcast(MessageType.DATA_UPDATED);
  
    } catch (error) {
      console.error('Failed to fetch events:', error);
      await communicator.broadcast(MessageType.DATA_UPDATED); // Ensure UI resets loading state
    }
  }