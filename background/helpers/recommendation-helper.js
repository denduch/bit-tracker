
import { apiProvider } from '../api/index.js';
import { communicator, MessageType } from '../../common/messaging.js';
import { storageManager } from '../../common/storage.js';
import { fetchArtists } from './artists-helper.js';

const RECOMMENDATIONS_CACHE_KEY = 'recommendations-data';

export const fetchRecommendations = async () => {
  try {
    console.log('Fetching recommendations...');
    const recommendations = await apiProvider.getRecommendations();

    console.log('Fetching events for recommendations...');
    const eventData = await apiProvider.getArtistEvents(recommendations);

    const eventDataByArtistId = new Map(eventData.map(data => [data.artistId, data]));

    const recommendationsWithEvents = recommendations.map(artist => {
      const artistEventData = eventDataByArtistId.get(artist.id);
      if (artistEventData) {
        return {
          ...artist,
          events: artistEventData.events,
          spotifyId: artistEventData.spotifyId,
        };
      }
      return artist;
    });

    await storageManager.set(RECOMMENDATIONS_CACHE_KEY, recommendationsWithEvents, true);
    console.log('Successfully cached recommendations with events.');
    await communicator.broadcast(MessageType.DATA_UPDATED);
  } catch (error) {
    console.error('Failed to fetch recommendations:', error);
    await communicator.broadcast(MessageType.DATA_UPDATED); // Ensure UI resets loading state
  }
}

export const fetchCsrfToken = async () => {
  try {
    console.log('Fetching CSRF token...');
    const token = await apiProvider.getCsrfToken();
    console.log('CSRF token fetched:', token);
    await storageManager.set('csrf-token', token);
    await communicator.broadcast(MessageType.CSRF_TOKEN_UPDATED, { token });
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
  }
}

export const setArtistTrackingStatus = async ({ artistId, track }) => {
    try {
      const csrfToken = await storageManager.get('csrf-token');
      if (!csrfToken) {
        await fetchCsrfToken();
      }
      await apiProvider.setArtistTrackingStatus(artistId, track, csrfToken);

      if (track) {
        const recommendations = await storageManager.get('recommendations-data', []);
        const trackedArtists = await storageManager.get('tracked-data', []);
        const artistToTrack = recommendations.find(artist => artist.id === parseInt(artistId));

        if (artistToTrack && !trackedArtists.some(artist => artist.id === artistId)) {
          const updatedTrackedArtists = [...trackedArtists, artistToTrack].sort((a, b) => a.name.localeCompare(b.name));
          await storageManager.set('tracked-data', updatedTrackedArtists, true);
        }
        await communicator.broadcast(MessageType.REDRAW);
      }
    } catch (error) {
      console.error(`Failed to set tracking status for artist ${artistId}:`, error);
    }
  }