const usStates = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
    'D.C.', 'DC', 'Washington D.C.'
];

const canadianProvinces = [
    'AB', 'BC', 'MB', 'NB', 'NL',
    'NS', 'NT', 'NU', 'ON', 'PE',
    'QC', 'SK', 'YT'
];

const locationNormalizationMap = {
    'USA': 'United States',
    'UK': 'United Kingdom',
    'Czechia': 'Czech Republic',
    'South Korea': 'Korea',
    'UAE': 'United Arab Emirates',
    '日本大阪市': 'Japan',
    '日本江東区': 'Japan',
};

const countryToCodeMap = {
    'United States': 'us',
    'United Kingdom': 'gb',
    'Canada': 'ca',
    'Australia': 'au',
    'Germany': 'de',
    'France': 'fr',
    'Spain': 'es',
    'Ireland': 'ie',
    'Netherlands': 'nl',
    'Japan': 'jp',
    'Korea': 'kr',
    'United Arab Emirates': 'ae',
    // European countries
    'Albania': 'al',
    'Andorra': 'ad',
    'Austria': 'at',
    'Belarus': 'by',
    'Belgium': 'be',
    'Bosnia and Herzegovina': 'ba',
    'Bulgaria': 'bg',
    'Croatia': 'hr',
    'Cyprus': 'cy',
    'Czech Republic': 'cz',
    'Denmark': 'dk',
    'Estonia': 'ee',
    'Finland': 'fi',
    'Georgia': 'ge',
    'Greece': 'gr',
    'Hungary': 'hu',
    'Iceland': 'is',
    'Italy': 'it',
    'Latvia': 'lv',
    'Liechtenstein': 'li',
    'Lithuania': 'lt',
    'Luxembourg': 'lu',
    'Malta': 'mt',
    'Moldova': 'md',
    'Monaco': 'mc',
    'Montenegro': 'me',
    'North Macedonia': 'mk',
    'Norway': 'no',
    'Poland': 'pl',
    'Portugal': 'pt',
    'Romania': 'ro',
    'Russia': 'ru',
    'San Marino': 'sm',
    'Serbia': 'rs',
    'Slovakia': 'sk',
    'Slovenia': 'si',
    'Sweden': 'se',
    'Switzerland': 'ch',
    'Turkey': 'tr',
    'Ukraine': 'ua',
    'Vatican City': 'va',
    // World countries
    'Argentina': 'ar',
    'Brazil': 'br',
    'Chile': 'cl',
    'China': 'cn',
    'Colombia': 'co',
    'Costa Rica': 'cr',
    'Egypt': 'eg',
    'El Salvador': 'sv',
    'India': 'in',
    'Indonesia': 'id',
    'Israel': 'il',
    'Kazakhstan': 'kz',
    'Malaysia': 'my',
    'Mexico': 'mx',
    'Morocco': 'ma',
    'New Zealand': 'nz',
    'Nigeria': 'ng',
    'Peru': 'pe',
    'Philippines': 'ph',
    'Singapore': 'sg',
    'South Africa': 'za',
    'Thailand': 'th',
    'Venezuela': 've',
    'Vietnam': 'vn',
    'Bahrain': 'bh'
};

function removeCountryFromLocation(location, country) {
    if (!location || !country) return location;
    
    const parts = location.split(',').map(part => part.trim());
    
    // Remove exact country matches from the end
    const filteredParts = parts.filter((part, index) => {
        // Don't remove if it's the only part
        if (parts.length === 1) return true;
        
        // Check if this part matches the country name
        const normalizedPart = normalizeCountry(part);
        return normalizedPart !== country;
    });
    
    return filteredParts.join(', ');
}

function getCountryAndFlag(location) {
    if (!location) {
        return { country: '', code: '', cleanLocation: '' };
    }

    const normalizedCountry = normalizeCountry(location);
    const countryCode = countryToCodeMap[normalizedCountry] || '';
    const cleanLocation = removeCountryFromLocation(location, normalizedCountry);
    
    return { 
        country: normalizedCountry || '', 
        code: countryCode,
        cleanLocation: cleanLocation
    };
}

const europeanCountries = [
    'Albania', 'Andorra', 'Austria', 'Belarus', 'Belgium', 'Bosnia and Herzegovina', 'Bulgaria', 'Croatia', 
    'Cyprus', 'Czech Republic', 'Denmark', 'Estonia', 'Finland', 'France', 'Georgia', 'Germany',
    'Greece', 'Hungary', 'Iceland', 'Ireland', 'Italy', 'Latvia', 'Liechtenstein', 'Lithuania', 
    'Luxembourg', 'Malta', 'Moldova', 'Monaco', 'Montenegro', 'Netherlands', 'North Macedonia', 
    'Norway', 'Poland', 'Portugal', 'Romania', 'Russia', 'San Marino', 'Serbia', 'Slovakia', 
    'Slovenia', 'Spain', 'Sweden', 'Switzerland', 'Turkey', 'Ukraine', 'United Kingdom', 'Vatican City'
];

function normalizeCountry(location) {
    if (!location) return null;

    const trimmedLocation = location.trim();
    if (locationNormalizationMap[trimmedLocation]) return locationNormalizationMap[trimmedLocation];

    const parts = trimmedLocation.split(',').map(part => part.trim());
    const lastPart = parts[parts.length - 1];

    if (usStates.includes(lastPart)) return 'United States';
    if (canadianProvinces.includes(lastPart)) return 'Canada';
    if (locationNormalizationMap[lastPart]) return locationNormalizationMap[lastPart];
    if (trimmedLocation.includes('日本')) return 'Japan';

    return lastPart;
}

function getCountryFilterGroups(events) {
    const uniqueCountries = [...new Set(events.map(event => normalizeCountry(event.location)).filter(Boolean))].sort();

    const generalOptions = [
        { label: 'Everywhere', value: 'everywhere', group: 'general', default: true },
        { label: 'Europe', value: 'europe', group: 'general' },
    ];

    const polandOption = uniqueCountries.includes('Poland') 
        ? [{ label: 'Poland', value: 'Poland', group: 'poland' }]
        : [];

    const europeanOptions = uniqueCountries
        .filter(c => c !== 'Poland' && europeanCountries.includes(c))
        .map(c => ({
            label: c,
            value: c,
            group: 'europe',
        }));

    const restOfTheWorldOptions = uniqueCountries
        .filter(c => !europeanCountries.includes(c))
        .map(c => ({ 
            label: c, 
            value: c, 
            group: 'world' 
        }));

    return [{
        label: 'Filter by country',
        group: 'country',
        options: [...generalOptions, ...polandOption, ...europeanOptions, ...restOfTheWorldOptions]
    }];
}

export const getArtistFilterGroups = (events, eventsFilteredByCountryAndDate) => {
    console.log('eventsFilteredByCountryAndDate', eventsFilteredByCountryAndDate);
    const artists = [...new Set(events.map(event => event.artist.name))].sort();

    const artistOptions = [
        { value: 'all', label: 'All artists', default: true },
        ...artists.map(artist => ({ value: artist, label: artist, hidden: !eventsFilteredByCountryAndDate.some(event => event.artist.name === artist) }))
    ].map(option => ({ ...option, group: 'artist' }));

    return [{
        label: 'Filter by artist',
        group: 'artist',
        options: artistOptions
    }];
}

const getDateFilterGroups = () => {
    const dateOptions = [
        { value: 'anytime', label: 'Anytime', default: true },
        { value: 'today', label: 'Today' },
        { value: 'tomorrow', label: 'Tomorrow' },
        { value: 'week', label: 'Next 7 days' },
        { value: 'month', label: 'Next 30 days' },
        { value: '3months', label: 'Next 3 months' },
        { value: '6months', label: 'Next 6 months' },
    ].map(option => ({ ...option, group: 'date' }));

    return [{
        label: 'Filter by date',
        group: 'date',
        options: dateOptions
    }];
};

const europeanCountryCodes = new Set([
    'al', 'ad', 'at', 'by', 'be', 'ba', 'bg', 'hr', 'cy', 'cz', 'dk', 'ee', 'fo', 'fi', 'fr', 'de', 'gi', 'gr', 'gg', 'hu', 'is', 'ie', 'im', 'it', 'je', 'lv', 'li', 'lt', 'lu', 'mk', 'mt', 'md', 'mc', 'me', 'nl', 'no', 'pl', 'pt', 'ro', 'ru', 'sm', 'rs', 'sk', 'si', 'es', 'sj', 'se', 'ch', 'ua', 'gb', 'va', 'eu'
]);

export function isCountryInEurope(countryCode) {
    return europeanCountryCodes.has(countryCode?.toLowerCase());
}

export { getCountryAndFlag, getCountryFilterGroups, europeanCountries, usStates, normalizeCountry, getDateFilterGroups };
