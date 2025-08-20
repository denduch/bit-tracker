// background/api/live-provider.js
const BANDSINTOWN_ARTISTS_URL = 'https://www.bandsintown.com/u/trackedArtists?max=10000';

async function getTrackedArtists() {
  console.log('Fetching artists from Bandsintown...');
  const response = await fetch(BANDSINTOWN_ARTISTS_URL, {
    headers: {
      'Accept': 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch tracked artists: ${response.statusText}`);
  }
  const artists = await response.json();
  return artists;
}

export const liveProvider = {
  getTrackedArtists,
};
