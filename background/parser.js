// background/parser.js
import { parse } from './node_modules/node-html-parser/dist/index.js';

/**
 * Parses an HTML document to find and extract artist data from an embedded JSON script tag.
 * @param {string} htmlText The raw HTML content of the page.
 * @returns {Array} An array of artist objects.
 * @throws {Error} If the script tag with data is not found or JSON is invalid.
 */
export function parseArtistsFromHTML(htmlText) {
  const root = parse(htmlText);

  // This selector might need to be adjusted based on the actual HTML structure.
  // We are looking for a script tag that likely contains the page's initial data.
  const scriptTag = root.querySelector('script[data-testid="artist-json"]'); // Example selector

  if (!scriptTag) {
    throw new Error('Could not find the data script tag in the HTML response.');
  }

  try {
    const jsonData = JSON.parse(scriptTag.textContent);
    // The path to the artists array within the JSON might also need adjustment.
    // e.g., jsonData.pageProps.artists or jsonData.artists
    const artists = jsonData.artists || []; 
    console.log(`Successfully parsed ${artists.length} artists.`);
    return artists;
  } catch (error) {
    throw new Error(`Failed to parse JSON from the script tag: ${error.message}`);
  }
}
