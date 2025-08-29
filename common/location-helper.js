const countryData = {
    'United States': { name: 'USA', flag: '🇺🇸' },
    'United Kingdom': { name: 'UK', flag: '🇬🇧' },
    'Canada': { name: 'CAN', flag: '🇨🇦' },
    'Australia': { name: 'AUS', flag: '🇦🇺' },
    'Germany': { name: 'DE', flag: '🇩🇪' },
    'France': { name: 'FR', flag: '🇫🇷' },
    'Spain': { name: 'ES', flag: '🇪🇸' },
    'Ireland': { name: 'IE', flag: '🇮🇪' },
    'Netherlands': { name: 'NL', flag: '🇳🇱' },
    'Japan': { name: 'JP', flag: '🇯🇵' },
};

const usStates = {
    'AL': 'United States', 'AK': 'United States', 'AZ': 'United States', 'AR': 'United States', 'CA': 'United States', 'CO': 'United States', 'CT': 'United States', 'DE': 'United States', 'FL': 'United States', 'GA': 'United States',
    'HI': 'United States', 'ID': 'United States', 'IL': 'United States', 'IN': 'United States', 'IA': 'United States', 'KS': 'United States', 'KY': 'United States', 'LA': 'United States', 'ME': 'United States', 'MD': 'United States',
    'MA': 'United States', 'MI': 'United States', 'MN': 'United States', 'MS': 'United States', 'MO': 'United States', 'MT': 'United States', 'NE': 'United States', 'NV': 'United States', 'NH': 'United States', 'NJ': 'United States',
    'NM': 'United States', 'NY': 'United States', 'NC': 'United States', 'ND': 'United States', 'OH': 'United States', 'OK': 'United States', 'OR': 'United States', 'PA': 'United States', 'RI': 'United States', 'SC': 'United States',
    'SD': 'United States', 'TN': 'United States', 'TX': 'United States', 'UT': 'United States', 'VT': 'United States', 'VA': 'United States', 'WA': 'United States', 'WV': 'United States', 'WI': 'United States', 'WY': 'United States',
    'D.C.': 'United States', 'DC': 'United States', 'Washington D.C.': 'United States'
};

const canadianProvinces = {
    'AB': 'Canada', 'BC': 'Canada', 'MB': 'Canada', 'NB': 'Canada', 'NL': 'Canada',
    'NS': 'Canada', 'NT': 'Canada', 'NU': 'Canada', 'ON': 'Canada', 'PE': 'Canada',
    'QC': 'Canada', 'SK': 'Canada', 'YT': 'Canada'
};

const locationNormalizationMap = {
    'USA': 'United States',
    'UK': 'United Kingdom',
    'Czechia': 'Czech Republic',
    '日本大阪市': 'Japan',
    '日本江東区': 'Japan',
};

function getCountryAndFlag(location) {
    if (!location) {
        return { country: '', flag: '' };
    }

    const parts = location.split(',').map(part => part.trim());
    const lastPart = parts[parts.length - 1];

    if (usStates[lastPart]) {
        const countryInfo = countryData['United States'];
        return { country: countryInfo.name, flag: countryInfo.flag };
    }

    for (const [countryName, data] of Object.entries(countryData)) {
        if (lastPart === countryName) {
            return { country: data.name, flag: data.flag };
        }
    }
    
    return { country: lastPart, flag: '' };
}

const europeanCountries = [
    'Austria', 'Belgium', 'Croatia', 'Czech Republic', 'Denmark', 'Estonia', 'Finland', 'France', 'Germany',
    'Greece', 'Hungary', 'Ireland', 'Italy', 'Luxembourg', 'Netherlands', 'Norway', 'Poland',
    'Portugal', 'Romania', 'Spain', 'Sweden', 'Switzerland', 'United Kingdom'
];

function normalizeCountry(location) {
    if (!location) return null;

    const trimmedLocation = location.trim();
    if (locationNormalizationMap[trimmedLocation]) return locationNormalizationMap[trimmedLocation];

    const parts = trimmedLocation.split(',').map(part => part.trim());
    const lastPart = parts[parts.length - 1];

    if (usStates[lastPart]) return 'United States';
    if (canadianProvinces[lastPart]) return 'Canada';
    if (locationNormalizationMap[lastPart]) return locationNormalizationMap[lastPart];
    if (trimmedLocation.includes('日本')) return 'Japan';

    return lastPart;
}

function getCountryFilterGroups(events) {
    const uniqueCountries = [...new Set(events.map(event => normalizeCountry(event.location)).filter(Boolean))].sort();

    const generalOptions = [
        { label: 'Everywhere', value: 'everywhere', group: 'general' },
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
        options: [...generalOptions, ...polandOption, ...europeanOptions, ...restOfTheWorldOptions]
    }];
}

export const getArtistFilterGroups = (events) => {
        const artists = [...new Set(events.map(event => event.artist.name))].sort();

    const artistOptions = [
        { value: 'all', label: 'All artists' },
        ...artists.map(artist => ({ value: artist, label: artist }))
    ].map(option => ({ ...option, group: 'artist' }));

    return [{
        label: 'Filter by artist',
        options: artistOptions
    }];
}

const getDateFilterGroups = () => {
    const dateOptions = [
        { value: 'anytime', label: 'Anytime' },
        { value: 'today', label: 'Today' },
        { value: 'tomorrow', label: 'Tomorrow' },
        { value: 'week', label: 'Next 7 days' },
        { value: 'month', label: 'Next 30 days' },
        { value: '3months', label: 'Next 3 months' },
        { value: '6months', label: 'Next 6 months' },
    ].map(option => ({ ...option, group: 'date' }));

    return [{
        label: 'Filter by date',
        options: dateOptions
    }];
};

export { getCountryAndFlag, getCountryFilterGroups, europeanCountries, usStates, normalizeCountry, getDateFilterGroups };
