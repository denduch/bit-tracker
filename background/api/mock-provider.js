// background/api/mock-provider.js

async function getTrackedArtists() {
  console.log('Fetching artists from mock JSON file...');
  const response = await fetch('../mocks/artist-list-mock.json');
  if (!response.ok) {
    throw new Error(`Failed to fetch mock artists: ${response.statusText}`);
  }
  const data = await response.json();
  // Assuming the JSON structure is { "artists": [...] }
  console.log('Mock artists:', data.artists)
  return data;
}

export const mockProvider = {
  getTrackedArtists,
};
