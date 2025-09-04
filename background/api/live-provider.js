import { parseEventsFromHTML } from './parser.js';
import { communicator, MessageType } from '../../common/messaging.js';
const BANDSINTOWN_ARTISTS_URL = 'https://www.bandsintown.com/u/trackedArtists?max=10000';
const BANDSINTOWN_RECOMMENDATIONS_URL = 'https://www.bandsintown.com/searchArtists?searchTerm&genres=recommended';

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
  const { artists } = await response.json();
  return artists;
}

async function getRecommendations() {
  console.log('Fetching recommendations from Bandsintown...');
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
  console.log(`Fetching events for ${artist.name} from ${artist.artistPageUrl}`);
  const response = await fetch(artist.artistPageUrl);
  if (!response.ok) {
    console.error(`Failed to fetch page for ${artist.name}: ${response.statusText}`);
    return { events: [], spotifyId: null };
  }
  const html = await response.text();
  const events = parseEventsFromHTML(html);
  console.log('events: ', events);

  const spotifyLinkMatch = html.match(/href="https:\/\/open\.spotify\.com\/artist\/([a-zA-Z0-9]{22})/);
  const spotifyId = spotifyLinkMatch ? spotifyLinkMatch[1] : null;

  const eventsWithArtistId = events.map(event => ({ ...event, artist_id: artist.id }));
  console.log('eventsWithArtistId: ', eventsWithArtistId);
  const output = { events: eventsWithArtistId, spotifyId, artistId: artist.id };
  console.log('Output: ', output);
  return output;
}

async function setArtistTrackingStatus(artistId, track, csrfToken) {
  const action = track ? 'track' : 'untrack';
  console.log(`${action.toUpperCase()}ING artist ${artistId}...`);
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
  console.log('Fetching events from Bandsintown...');
  let allEvents = [];
  const BATCH_SIZE = 2;
  const DELAY_MS = 200;

  for (let i = 0; i < artists.length; i += BATCH_SIZE) {
    const batch = artists.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch starting with artist ${i + 1}/${artists.length}...`);

    const batchPromises = batch.map(artist => 
      getEventsForArtist(artist).catch(error => {
        console.error(`Error processing artist ${artist.name}:`, error);
        return [];
      })
    );

    const results = await Promise.all(batchPromises);
    allEvents = allEvents.concat(results.flat());
    console.log('allEvents: ', allEvents);


    communicator.broadcast(MessageType.EVENTS_LOADING_PROGRESS, { 
      current: Math.min(i + BATCH_SIZE, artists.length),
      total: artists.length 
    });

    if (i + BATCH_SIZE < artists.length) {
      console.log(`Waiting for ${DELAY_MS}ms before the next batch...`);
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }
  }

  console.log('Finished fetching all artist events.');
  return allEvents;
}

export const liveProvider = {
  getTrackedArtists,
  getArtistEvents,
  getRecommendations,
  setArtistTrackingStatus,
  getCsrfToken,
};
