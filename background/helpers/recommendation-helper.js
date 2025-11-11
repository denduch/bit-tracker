
import { apiProvider } from '../api/index.js';
import { communicator, MessageType } from '../../common/messaging.js';
import { storageManager } from '../../common/storage.js';
import { fetchArtists } from './artists-helper.js';

const RECOMMENDATIONS_CACHE_KEY = 'recommendations-data';
const RECOMMENDATIONS_LAST_FETCHED_KEY = 'recommendations-last-fetched';

async function combineAndStoreRecommendations(newRecommendations) {
  const oldRecommendations = await storageManager.get(RECOMMENDATIONS_CACHE_KEY, []);
  const oldRecommendationsMap = new Map(oldRecommendations.map(rec => [rec.id, rec]));

  const finalRecommendations = newRecommendations.map(newRec => {
    const oldRec = oldRecommendationsMap.get(newRec.id);
    if (oldRec) {
      // Artist exists, merge new data but preserve old events as a fallback
      return {
        ...oldRec, // Start with old data to preserve properties like isTracked
        ...newRec, // Overwrite with new data
        events: newRec.events && newRec.events.length > 0 ? newRec.events : oldRec.events || [], // Prioritize new events
      };
    } else {
      // This is a completely new recommendation
      return newRec;
    }
  });

  await storageManager.set(RECOMMENDATIONS_CACHE_KEY, finalRecommendations, true);
}

export const fetchRecommendations = async () => {
  try {
    const lastFetched = await storageManager.get(RECOMMENDATIONS_LAST_FETCHED_KEY, 0);
    const twentyFourHoursAgo = Date.now() - 1 * 60 * 60 * 1000;

    if (lastFetched > twentyFourHoursAgo) {
      return;
    }

    const recommendations = await apiProvider.getRecommendations();

    const oldRecommendations = await storageManager.get(RECOMMENDATIONS_CACHE_KEY, []);
    const oldRecommendationsMap = new Map(oldRecommendations.map(rec => [rec.id, rec]));

    const artistsToFetchDetailsFor = recommendations.filter(newRec => {
      const oldRec = oldRecommendationsMap.get(newRec.id);
      return !oldRec || oldRec.spotifyId === undefined;
    });

    const eventData = artistsToFetchDetailsFor.length > 0
      ? await apiProvider.getArtistEvents(artistsToFetchDetailsFor)
      : [];

    const eventDataByArtistId = new Map(eventData.map(data => [data.artistId, data]));

    const recommendationsWithEvents = recommendations.map(artist => {
      const newEventData = eventDataByArtistId.get(artist.id);
      if (newEventData) {
        // We fetched new data for this artist, so use it.
        return {
          ...artist,
          events: newEventData.events.map(event => ({ ...event, startsAt: new Date(event.startsAt).getTime() })),
          spotifyId: newEventData.spotifyId,
        };
      } else {
        // We skipped this artist, so reuse their old data.
        const oldRec = oldRecommendationsMap.get(artist.id);
        return oldRec || artist; // Fallback to the basic artist object if no old record exists
      }
    });

    await combineAndStoreRecommendations(recommendationsWithEvents);
    await storageManager.set(RECOMMENDATIONS_LAST_FETCHED_KEY, Date.now());
    await communicator.broadcast(MessageType.DATA_UPDATED);
  } catch (error) {
    console.error('Failed to fetch recommendations:', error);
    await communicator.broadcast(MessageType.DATA_UPDATED); // Ensure UI resets loading state
  }
}

export const skipRecommendation = async (artistId) => {
  try {
    const recommendations = await storageManager.get(RECOMMENDATIONS_CACHE_KEY, []);
    const recommendationToSkip = recommendations.find(rec => rec.id === artistId);

    if (recommendationToSkip) {
      recommendationToSkip.skipped = true;
      await storageManager.set(RECOMMENDATIONS_CACHE_KEY, recommendations, true);
    }
  } catch (error) {
    console.error(`Failed to skip recommendation for artist ${artistId}:`, error);
  }
};

export const fetchCsrfToken = async () => {
  try {
    const token = await apiProvider.getCsrfToken();
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