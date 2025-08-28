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
    'AL': 'USA', 'AK': 'USA', 'AZ': 'USA', 'AR': 'USA', 'CA': 'USA', 'CO': 'USA', 'CT': 'USA', 'DE': 'USA', 'FL': 'USA', 'GA': 'USA',
    'HI': 'USA', 'ID': 'USA', 'IL': 'USA', 'IN': 'USA', 'IA': 'USA', 'KS': 'USA', 'KY': 'USA', 'LA': 'USA', 'ME': 'USA', 'MD': 'USA',
    'MA': 'USA', 'MI': 'USA', 'MN': 'USA', 'MS': 'USA', 'MO': 'USA', 'MT': 'USA', 'NE': 'USA', 'NV': 'USA', 'NH': 'USA', 'NJ': 'USA',
    'NM': 'USA', 'NY': 'USA', 'NC': 'USA', 'ND': 'USA', 'OH': 'USA', 'OK': 'USA', 'OR': 'USA', 'PA': 'USA', 'RI': 'USA', 'SC': 'USA',
    'SD': 'USA', 'TN': 'USA', 'TX': 'USA', 'UT': 'USA', 'VT': 'USA', 'VA': 'USA', 'WA': 'USA', 'WV': 'USA', 'WI': 'USA', 'WY': 'USA'
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

export { getCountryAndFlag };
