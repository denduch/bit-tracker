// background/api/index.js

import { liveProvider } from './live-provider.js';
import { mockProvider } from './mock-provider.js';

async function getProvider() {
  const { useMocks = true } = await chrome.storage.local.get('useMocks');
  console.log(`Using ${useMocks ? 'mock' : 'live'} provider.`);
  return useMocks ? mockProvider : liveProvider;
}

export const apiProvider = {
  async getTrackedArtists() {
    const provider = await getProvider();
    return provider.getTrackedArtists();
  },
  async getArtistEvents(artists) {
    const provider = await getProvider();
    return provider.getArtistEvents(artists);
  },
  async getRecommendations() {
    const provider = await getProvider();
    return provider.getRecommendations();
  },
  async setArtistTrackingStatus(artistId, track, csrfToken) {
    const provider = await getProvider();
    return provider.setArtistTrackingStatus(artistId, track, csrfToken);
  },
  async getCsrfToken() {
    const provider = await getProvider();
    return provider.getCsrfToken();
  },
};
