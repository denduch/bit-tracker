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

    const groups = [
        { label: 'General', options: [{ label: 'Everywhere', value: 'everywhere' }, { label: 'Europe', value: 'europe' }] },
    ];

    const poland = uniqueCountries.find(c => c === 'Poland');
    if (poland) {
        groups.push({ label: 'Featured', options: [{ label: 'Poland', value: 'Poland' }] });
    }

    const otherEuropean = uniqueCountries.filter(c => c !== 'Poland' && europeanCountries.includes(c));
    if (otherEuropean.length > 0) {
        groups.push({ label: 'Europe', options: otherEuropean.map(c => ({ label: c, value: c })) });
    }

    const restOfTheWorld = uniqueCountries.filter(c => !europeanCountries.includes(c) && c !== 'Poland');
    if (restOfTheWorld.length > 0) {
        groups.push({ label: 'Rest of the World', options: restOfTheWorld.map(c => ({ label: c, value: c })) });
    }

    return groups;
}

export { getCountryAndFlag, getCountryFilterGroups, europeanCountries, usStates, normalizeCountry };
