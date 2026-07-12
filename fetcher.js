const fs = require('fs');
const axios = require('axios');
const qs = require('qs');

// Replace these values with your actual OpenSky credentials
const CLIENT_ID = 'aero tech-api-client';
const CLIENT_SECRET = '9wCkMSYj2eMxTPgcMpnYVr4a59faFC6C';

async function updateFlightData() {
    try {
        console.log('Requesting access token...');
        // 1. OAuth2 Client Credentials Token Request
        const tokenResponse = await axios.post('https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token', 
            qs.stringify({ grant_type: 'client_credentials', client_id: CLIENT_ID, client_secret: CLIENT_SECRET }),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        const token = tokenResponse.data.access_token;
        console.log('Token secured! Fetching live state vectors...');

        // 2. Fetch data using the bearer token
        const dataResponse = await axios.get('https://opensky-network.org/api/states/all', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        // 3. Save to your local folder
        fs.writeFileSync('flight_data.json', JSON.stringify(dataResponse.data));
        console.log('SUCCESS: flight_data.json updated at ' + new Date().toLocaleTimeString());
    } catch (e) {
        console.error('Fetch error:', e.message);
    }
}

// Automatically refresh data every 60 seconds to stay safely within your 4,000 daily credits
setInterval(updateFlightData, 60000);
updateFlightData();