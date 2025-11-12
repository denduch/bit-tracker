import { parseEventsFromHTML } from './parser.js';
import { communicator, MessageType } from '../../common/messaging.js';
const BANDSINTOWN_ARTISTS_URL = 'https://www.bandsintown.com/u/trackedArtists?max=10000';
const BANDSINTOWN_RECOMMENDATIONS_URL = 'https://www.bandsintown.com/searchArtists?searchTerm&genres=recommended';

async function getTrackedArtists() {
  const response = await fetch(BANDSINTOWN_ARTISTS_URL, {
    headers: {
      'Accept': 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch tracked artists: ${response.statusText}`);
  }
  const { artists } = await response.json();
  return artists;
}

async function getRecommendations() {
  const response = await fetch(BANDSINTOWN_RECOMMENDATIONS_URL, {
    headers: {
      'Accept': 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch recommendations: ${response.statusText}`);
  }
  const { artists } = await response.json();
  return artists;
}

async function getEventsForArtist(artist) {
  const response = await fetch(artist.artistPageUrl);
  if (response.status === 403) {
    console.log(`Access forbidden (403) for ${artist.name}`);
    return { events: [], spotifyId: null, artistId: artist.id, is403: true };
  }
  if (!response.ok) {
    console.error(`Failed to fetch ${artist.name}: ${response.statusText}`);
    return { events: [], spotifyId: null, artistId: artist.id };
  }
  const html = await response.text();
  const events = parseEventsFromHTML(html);

  const spotifyLinkMatch = html.match(/href="https:\/\/open\.spotify\.com\/artist\/([a-zA-Z0-9]{22})/);
  const spotifyId = spotifyLinkMatch ? spotifyLinkMatch[1] : null;

  const eventsWithArtistId = events.map(event => ({ ...event, artist_id: artist.id }));
  return { events: eventsWithArtistId, spotifyId, artistId: artist.id };
}

async function setArtistTrackingStatus(artistId, track, csrfToken) {
  const action = track ? 'track' : 'untrack';
  const url = `https://www.bandsintown.com/a/${artistId}/track`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'x-csrf-token': csrfToken,
    },
    body: JSON.stringify({ artistTrackingAction: action }),
  });

  if (!response.ok) {
    throw new Error(`Failed to ${action} artist: ${response.statusText}`);
  }

  return response.json();
}

async function getCsrfToken() {
  const url = 'https://www.bandsintown.com/u/explore';
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch explore page for CSRF token: ${response.statusText}`);
  }
  const html = await response.text();
  const match = html.match(/CSRFTOKEN='([^']+)';/);
  if (match && match[1]) {
    return match[1];
  }
  throw new Error('CSRF token not found on explore page.');
}

async function getArtistEvents(artists) {
  let allEvents = [];
  const BATCH_SIZE = 2;
  const DELAY_MS = 2000;

  for (let i = 0; i < artists.length; i += BATCH_SIZE) {
    const batch = artists.slice(i, i + BATCH_SIZE);

    const batchPromises = batch.map(artist => 
      getEventsForArtist(artist).catch(error => {
        console.error(`Error processing ${artist.name}:`, error);
        return { events: [], spotifyId: null, artistId: artist.id };
      })
    );

    const results = await Promise.all(batchPromises);
    allEvents = allEvents.concat(results);

    communicator.broadcast(MessageType.EVENTS_LOADING_PROGRESS, { 
      current: Math.min(i + BATCH_SIZE, artists.length),
      total: artists.length 
    });

    if (i + BATCH_SIZE < artists.length) {
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }
  }

  return allEvents;
}

export const liveProvider = {
  getTrackedArtists,
  getArtistEvents,
  getRecommendations,
  setArtistTrackingStatus,
  getCsrfToken,
};
