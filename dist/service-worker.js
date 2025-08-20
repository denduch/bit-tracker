import { c as communicator, M as MessageType } from "./chunks/messaging.js";
const BANDSINTOWN_ARTISTS_URL = "https://www.bandsintown.com/u/trackedArtists?max=10000";
async function getTrackedArtists$1() {
  console.log("Fetching artists from Bandsintown...");
  const response = await fetch(BANDSINTOWN_ARTISTS_URL, {
    headers: {
      "Accept": "application/json"
    }
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch tracked artists: ${response.statusText}`);
  }
  const artists = await response.json();
  return artists;
}
const liveProvider = {
  getTrackedArtists: getTrackedArtists$1
};
async function getTrackedArtists() {
  console.log("Fetching artists from mock JSON file...");
  const response = await fetch("/mocks/artist-list-mock.json");
  if (!response.ok) {
    throw new Error(`Failed to fetch mock artists: ${response.statusText}`);
  }
  const data = await response.json();
  return data.artists;
}
const mockProvider = {
  getTrackedArtists
};
async function getProvider() {
  const { useMocks = true } = await chrome.storage.local.get("useMocks");
  console.log(`Using ${useMocks ? "mock" : "live"} provider.`);
  return useMocks ? mockProvider : liveProvider;
}
const apiProvider = {
  async getTrackedArtists() {
    const provider = await getProvider();
    return provider.getTrackedArtists();
  }
  // Add other methods like getArtistDetails in the future
};
communicator.on(MessageType.GET_ARTISTS, async (payload, sender) => {
  console.log("Received GET_ARTISTS request", { payload, sender });
  try {
    const artists = await apiProvider.getTrackedArtists();
    return { status: "success", data: artists };
  } catch (error) {
    console.error("Error fetching artists:", error);
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    return { status: "error", message };
  }
});
console.log("Service worker is listening for messages...");
