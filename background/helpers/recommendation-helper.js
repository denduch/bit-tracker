
import { apiProvider } from '../api/index.js';
import { communicator, MessageType } from '../../common/messaging.js';
import { storageManager } from '../../common/storage.js';
import { fetchArtists } from './artists-helper.js';

const RECOMMENDATIONS_CACHE_KEY = 'recommendations-data';

export const fetchRecommendations = async () => {
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
        throw new Error('CSRF token not found. Please fetch it first.');
      }
      await apiProvider.setArtistTrackingStatus(artistId, track, csrfToken);
      await fetchArtists();
    } catch (error) {
      console.error(`Failed to set tracking status for artist ${artistId}:`, error);
    }
  }