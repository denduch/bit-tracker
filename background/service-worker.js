import { communicator, MessageType } from '../common/messaging.js';
import { fetchRecommendations, fetchCsrfToken, setArtistTrackingStatus, skipRecommendation } from './helpers/recommendation-helper.js';
import { fetchArtists } from './helpers/artists-helper.js';
import { fetchEvents } from './helpers/events-helper.js';
import { storageManager } from '../common/storage.js';

const FETCH_ALARM_NAME = 'fetch-data-alarm';

communicator.on(MessageType.REQUEST_ARTIST_FETCH, fetchArtists);
communicator.on(MessageType.REQUEST_EVENTS_FETCH, fetchEvents);
communicator.on(MessageType.REQUEST_RECOMMENDATIONS_FETCH, fetchRecommendations);
communicator.on(MessageType.REQUEST_CSRF_TOKEN_FETCH, fetchCsrfToken);
communicator.on(MessageType.SET_ARTIST_TRACKING_STATUS, setArtistTrackingStatus);
communicator.on(MessageType.SKIP_RECOMMENDATION, (data) => {
  skipRecommendation(data.artistId);
});

communicator.on(MessageType.SET_EVENT_FAVORITE, async (data) => {
  const { eventId, favorite } = data;
  const favoriteEvents = await storageManager.get('favorite-events', []);
  const eventIdInt = parseInt(eventId);
  
  if (favorite) {
    if (!favoriteEvents.map(id => parseInt(id)).includes(eventIdInt)) {
      favoriteEvents.push(eventIdInt);
    }
  } else {
    const index = favoriteEvents.findIndex(id => parseInt(id) === eventIdInt);
    if (index > -1) {
      favoriteEvents.splice(index, 1);
    }
  }
  
  await storageManager.set('favorite-events', favoriteEvents);
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create(FETCH_ALARM_NAME, {
    delayInMinutes: 1, // Start after 1 minute
    periodInMinutes: 60 // Repeat every hour
  });
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === FETCH_ALARM_NAME) {
    await fetchArtists();
  }
});
