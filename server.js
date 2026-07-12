const http = require('http');
const https = require('https'); 
const fs = require('fs');
const path = require('path');
const url = require('url');

// --- DYNAMIC PORT CONFIGURATION ---
// Render provides the PORT via environment variables. 
// We default to 3000 for local development.
const PORT = process.env.PORT || 3000;

// Massive Global Operator Database (Commercial, Regional, & Cargo)
const airlineDatabase = {
    // ... (Keep your existing airlineDatabase object here)
    "AAL": "American Airlines", "DAL": "Delta Air Lines", "UAL": "United Airlines", "SWA": "Southwest Airlines",
    "JBU": "JetBlue Airways", "ASA": "Alaska Airlines", "NKS": "Spirit Airlines", "FFT": "Frontier Airlines",
    "SYX": "SkyWest Airlines", "ENY": "Envoy Air", "RPA": "Republic Airways", "JIA": "PSA Airlines",
    "EDV": "Endeavor Air", "ACA": "Air Canada", "WJA": "WestJet", "TSC": "Air Transat", "POE": "Porter Airlines",
    "AMX": "Aeromexico", "VOI": "Volaris", "VIV": "VivaAerobus",
    "BAW": "British Airways", "VIR": "Virgin Atlantic", "EZY": "EasyJet", "RYR": "Ryanair", "EXS": "Jet2.com",
    "TUI": "TUI Airways", "AFR": "Air France", "KLM": "KLM Royal Dutch Airlines", "DLH": "Lufthansa",
    "SWR": "Swiss International Air Lines", "AUA": "Austrian Airlines", "BEL": "Brussels Airlines",
    "IBE": "Iberia", "VLG": "Vueling", "AEA": "Air Europa", "AZA": "ITA Airways", "TAP": "TAP Air Portugal",
    "SAS": "Scandinavian Airlines", "FIN": "Finnair", "NAX": "Norwegian", "ICE": "Icelandair",
    "AEE": "Aegean Airlines", "THY": "Turkish Airlines", "PGT": "Pegasus Airlines", "SXS": "SunExpress",
    "WZZ": "Wizz Air", "LOT": "LOT Polish Airlines", "CSA": "Czech Airlines", "TAR": "TAROM",
    "ASL": "Air Serbia", "AFL": "Aeroflot", "SBI": "S7 Airlines", "EIN": "Aer Lingus",
    "UAE": "Emirates", "QTR": "Qatar Airways", "ETD": "Etihad Airways", "SVA": "Saudia", "OMA": "Oman Air",
    "GFA": "Gulf Air", "KAC": "Kuwait Airways", "MEA": "Middle East Airlines", "RJA": "Royal Jordanian",
    "LYX": "El Al", "FDB": "Flydubai", "ABY": "Air Arabia", "MSR": "EgyptAir", "RAM": "Royal Air Maroc",
    "ETH": "Ethiopian Airlines", "KQA": "Kenya Airways", "SAA": "South African Airways", "DAH": "Air Algerie",
    "AIC": "Air India", "IGO": "IndiGo", "SEJ": "SpiceJet", "VTI": "Vistara", "AXB": "Air India Express",
    "ALK": "SriLankan Airlines", "ALV": "SriLankan AirTaxi", "FDP": "FitsAir", "PIA": "Pakistan International",
    "BBC": "Biman Bangladesh", "VNS": "Nepal Airlines", "SIA": "Singapore Airlines", "MAS": "Malaysia Airlines", 
    "AXM": "AirAsia", "XAX": "AirAsia X", "GIA": "Garuda Indonesia", "LNI": "Lion Air", "CTV": "Batik Air", 
    "AWQ": "Indonesia AirAsia", "PAL": "Philippine Airlines", "CEB": "Cebu Pacific", "THA": "Thai Airways", 
    "TAW": "Thai AirAsia", "HVN": "Vietnam Airlines", "VJC": "VietJet Air", "CCA": "Air China", 
    "CES": "China Eastern", "CSN": "China Southern", "CHH": "Hainan Airlines", "CXA": "XiamenAir", 
    "CSC": "Sichuan Airlines", "CQH": "Spring Airlines", "CPA": "Cathay Pacific", "HDA": "Cathay Dragon", 
    "CRK": "Hong Hong Airlines", "HKC": "HK Express", "EVA": "EVA Air", "CAL": "China Airlines", 
    "SJX": "Starlux Airlines", "JAL": "Japan Airlines", "ANA": "All Nippon Airways", "SKY": "Skymark Airlines", 
    "APJ": "Peach Aviation", "KAL": "Korean Air", "AAR": "Asiana Airlines", "JJA": "Jeju Air", "JNA": "Jin Air",
    "QFA": "Qantas", "VOZ": "Virgin Australia", "JST": "Jetstar", "ANZ": "Air New Zealand",
    "LAN": "LATAM Airlines", "TAM": "LATAM Brasil", "GLO": "Gol Transportes", "AZU": "Azul Brazilian",
    "AVA": "Avianca", "CMP": "Copa Airlines", "ARG": "Aerolineas Argentinas",
    "FDX": "FedEx Express", "UPS": "UPS Airlines", "GTI": "Atlas Air", "PAC": "Polar Air Cargo",
    "CKS": "Kalitta Air", "ABX": "ABX Air", "SOO": "Southern Air", "NCA": "Nippon Cargo Airlines",
    "CLX": "Cargolux", "BOX": "AeroLogic"
};

// ... (Keep all your helper functions: firBoundaries, isPointInPolygon, getGlobalFIR, resolveAirlineName, fetchLiveTelemetry)
let firBoundaries = { features: [] };
try {
    const filePath = path.join(__dirname, 'fir_boundaries.json');
    if (fs.existsSync(filePath)) {
        firBoundaries = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
} catch (err) { console.error("Error loading boundaries:", err.message); }

function isPointInPolygon(lat, lon, feature) {
    if (!feature.geometry || !feature.geometry.coordinates) return false;
    const coords = feature.geometry.type === 'MultiPolygon' ? feature.geometry.coordinates[0][0] : feature.geometry.coordinates[0];
    let inside = false;
    for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
        const xi = coords[i][0], yi = coords[i][1];
        const xj = coords[j][0], yj = coords[j][1];
        const intersect = ((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

function getGlobalFIR(lat, lon) {
    if (lat === null || lon === null) return { name: 'Oceanic Sector', icao: null };
    for (const feature of firBoundaries.features) {
        if (isPointInPolygon(lat, lon, feature)) {
            const icao = feature.properties.ICAO || '';
            let name = feature.properties.name || feature.properties.fir_name || icao;
            name = name.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
            const fullName = name.toUpperCase() !== icao.toUpperCase() && icao ? `${name} FIR (${icao})` : `${name} FIR`;
            return { name: fullName, icao: icao };
        }
    }
    return { name: 'Oceanic Sector', icao: null };
}

function resolveAirlineName(callsign) {
    if (!callsign || callsign === 'UNKNOWN') return 'Private/General Aviation';
    const prefix = callsign.substring(0, 3).toUpperCase();
    return airlineDatabase[prefix] || `${prefix} Operator`;
}

let openSkyCache = null;
let lastFetchTime = 0;

function fetchLiveTelemetry() {
    return new Promise((resolve) => {
        const NOW = Date.now();
        if (openSkyCache && (NOW - lastFetchTime < 15000)) return resolve(openSkyCache);
        https.get('https://opensky-network.org/api/states/all', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed && parsed.states) { openSkyCache = parsed.states; lastFetchTime = NOW; }
                    resolve(openSkyCache || []);
                } catch (err) { resolve(openSkyCache || []); }
            });
        }).on('error', () => resolve(openSkyCache || []));
    });
}

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    if (parsedUrl.pathname === '/' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        fs.createReadStream(path.join(__dirname, 'index5.html')).pipe(res);
    } else if (parsedUrl.pathname === '/api/search' && req.method === 'GET') {
        const rawQuery = (parsedUrl.query.q || '').toUpperCase();
        const cleanQuery = rawQuery.replace(/\s+/g, '');
        if (!cleanQuery) { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify([])); }
        fetchLiveTelemetry().then(states => {
            const matches = states.filter(flight => {
                const callsign = flight[1] ? flight[1].trim().toUpperCase() : '';
                const icao = flight[0] ? flight[0].trim().toUpperCase() : '';
                return callsign === cleanQuery || icao === cleanQuery || callsign.startsWith(cleanQuery);
            }).map(flight => {
                const callsign = flight[1] ? flight[1].trim() : 'UNKNOWN';
                const firData = getGlobalFIR(flight[6], flight[5]);
                return {
                    icao24: flight[0] ? flight[0].toLowerCase() : 'UNKNOWN',
                    flightNumber: callsign,
                    airline: resolveAirlineName(callsign),
                    country: flight[2] || 'UNKNOWN',
                    longitude: flight[5], latitude: flight[6],
                    firArea: firData.name, firIcao: firData.icao,
                    altitude: flight[7] ? Math.round(flight[7]) : 'N/A',
                    velocity: flight[9] ? Math.round(flight[9] * 3.6) : 'N/A',
                    heading: flight[10] ? Math.round(flight[10]) : 0
                };
            });
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(matches.slice(0, 100))); 
        });
    } else if (parsedUrl.pathname.startsWith('/api/aircraft/') && req.method === 'GET') {
        const icao = parsedUrl.pathname.split('/')[3];
        https.get(`https://hexdb.io/api/v1/aircraft/${icao}`, (proxyRes) => {
            let data = '';
            proxyRes.on('data', chunk => data += chunk);
            proxyRes.on('end', () => { res.writeHead(proxyRes.statusCode, { 'Content-Type': 'application/json' }); res.end(data); });
        }).on('error', () => { res.writeHead(500); res.end(); });
    } else if (parsedUrl.pathname === '/api/routes' && req.method === 'GET') {
        const flight = parsedUrl.query.flight || '';
        https.get(`https://api.flightradar24.com/common/v1/flight/list.json?query=${encodeURIComponent(flight)}`, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (proxyRes) => {
            let data = '';
            proxyRes.on('data', chunk => data += chunk);
            proxyRes.on('end', () => { res.writeHead(proxyRes.statusCode, { 'Content-Type': 'application/json' }); res.end(data); });
        }).on('error', () => { res.writeHead(500); res.end(); });
    } else if (parsedUrl.pathname.startsWith('/api/boundary/') && req.method === 'GET') {
        const icao = parsedUrl.pathname.split('/')[3];
        const feature = firBoundaries.features.find(f => f.properties.ICAO === icao);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(feature || null));
    }
});

// --- CORRECTED LISTEN BLOCK FOR RENDER ---
server.listen(PORT, '0.0.0.0', () => {
    console.log(`✈️  Live Global Telemetry Matrix Online: http://0.0.0.0:${PORT}`);
});        firBoundaries = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        console.log(`✅ Loaded ${firBoundaries.features.length} Global Boundaries.`);
    }
} catch (err) { console.error("Error loading boundaries:", err.message); }

function isPointInPolygon(lat, lon, feature) {
    if (!feature.geometry || !feature.geometry.coordinates) return false;
    const coords = feature.geometry.type === 'MultiPolygon' ? feature.geometry.coordinates[0][0] : feature.geometry.coordinates[0];
    let inside = false;
    for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
        const xi = coords[i][0], yi = coords[i][1];
        const xj = coords[j][0], yj = coords[j][1];
        const intersect = ((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

function getGlobalFIR(lat, lon) {
    if (lat === null || lon === null) return { name: 'Oceanic Sector', icao: null };
    for (const feature of firBoundaries.features) {
        if (isPointInPolygon(lat, lon, feature)) {
            const icao = feature.properties.ICAO || '';
            let name = feature.properties.name || feature.properties.fir_name || icao;
            name = name.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
            const fullName = name.toUpperCase() !== icao.toUpperCase() && icao ? `${name} FIR (${icao})` : `${name} FIR`;
            return { name: fullName, icao: icao };
        }
    }
    return { name: 'Oceanic Sector', icao: null };
}

function resolveAirlineName(callsign) {
    if (!callsign || callsign === 'UNKNOWN') return 'Private/General Aviation';
    const prefix = callsign.substring(0, 3).toUpperCase();
    return airlineDatabase[prefix] || `${prefix} Operator`;
}

// In-memory cache to prevent hammering the live API on rapid inputs
let openSkyCache = null;
let lastFetchTime = 0;

function fetchLiveTelemetry() {
    return new Promise((resolve) => {
        const NOW = Date.now();
        // 15-second cache buffer strictly required for public unauthenticated endpoints
        if (openSkyCache && (NOW - lastFetchTime < 15000)) {
            return resolve(openSkyCache);
        }

        https.get('https://opensky-network.org/api/states/all', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed && parsed.states) {
                        openSkyCache = parsed.states;
                        lastFetchTime = NOW;
                    }
                    resolve(openSkyCache || []);
                } catch (err) {
                    resolve(openSkyCache || []); // Fallback on failure
                }
            });
        }).on('error', () => {
            resolve(openSkyCache || []);
        });
    });
}

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);

    // --- STATIC FILES ---
    if (parsedUrl.pathname === '/' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        // NOTE: Ensure your HTML file is named index5.html in the same directory, or change this to match your filename.
        fs.createReadStream(path.join(__dirname, 'index5.html')).pipe(res);
    } 
    
    // --- SEARCH PROXY ---
    else if (parsedUrl.pathname === '/api/search' && req.method === 'GET') {
        const rawQuery = (parsedUrl.query.q || '').toUpperCase();
        const cleanQuery = rawQuery.replace(/\s+/g, '');

        if (!cleanQuery) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify([])); 
        }

        fetchLiveTelemetry().then(states => {
            const matches = states.filter(flight => {
                const callsign = flight[1] ? flight[1].trim().toUpperCase() : '';
                const icao = flight[0] ? flight[0].trim().toUpperCase() : '';
                
                if (cleanQuery.length >= 3) {
                    return callsign === cleanQuery || icao === cleanQuery || callsign.startsWith(cleanQuery);
                } else {
                    return callsign === cleanQuery || icao === cleanQuery;
                }
            }).map(flight => {
                const callsign = flight[1] ? flight[1].trim() : 'UNKNOWN';
                const firData = getGlobalFIR(flight[6], flight[5]);
                return {
                    icao24: flight[0] ? flight[0].toLowerCase() : 'UNKNOWN',
                    flightNumber: callsign,
                    airline: resolveAirlineName(callsign),
                    country: flight[2] || 'UNKNOWN',
                    longitude: flight[5], latitude: flight[6],
                    firArea: firData.name, firIcao: firData.icao,
                    altitude: flight[7] ? Math.round(flight[7]) : 'N/A',
                    velocity: flight[9] ? Math.round(flight[9] * 3.6) : 'N/A',
                    heading: flight[10] ? Math.round(flight[10]) : 0
                };
            });
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(matches.slice(0, 100))); 
        });
    } 

    // --- AIRCRAFT PROXY (Bypasses HexDB CORS) ---
    else if (parsedUrl.pathname.startsWith('/api/aircraft/') && req.method === 'GET') {
        const icao = parsedUrl.pathname.split('/')[3];
        const options = {
            hostname: 'hexdb.io',
            path: `/api/v1/aircraft/${icao}`,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        };

        https.get(options, (proxyRes) => {
            let data = '';
            proxyRes.on('data', chunk => data += chunk);
            proxyRes.on('end', () => {
                res.writeHead(proxyRes.statusCode, { 'Content-Type': 'application/json' });
                res.end(data);
            });
        }).on('error', (err) => {
            res.writeHead(500, { 'Content-Type': 'application/json' }); 
            res.end(JSON.stringify({ error: 'Proxy failed' }));
        });
    }

    // --- ROUTE PROXY (Bypasses Flightradar24 CORS & Restrictions) ---
    else if (parsedUrl.pathname === '/api/routes' && req.method === 'GET') {
        const flight = parsedUrl.query.flight || '';
        const options = {
            hostname: 'api.flightradar24.com',
            path: `/common/v1/flight/list.json?query=${encodeURIComponent(flight)}`,
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json'
            }
        };

        https.get(options, (proxyRes) => {
            let data = '';
            proxyRes.on('data', chunk => data += chunk);
            proxyRes.on('end', () => {
                res.writeHead(proxyRes.statusCode, { 'Content-Type': 'application/json' });
                res.end(data);
            });
        }).on('error', (err) => {
            res.writeHead(500, { 'Content-Type': 'application/json' }); 
            res.end(JSON.stringify({ error: 'Proxy failed' }));
        });
    }

    // --- BOUNDARY DATA ---
    else if (parsedUrl.pathname.startsWith('/api/boundary/') && req.method === 'GET') {
        const icao = parsedUrl.pathname.split('/')[3];
        const feature = firBoundaries.features.find(f => f.properties.ICAO === icao);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(feature || null));
    }
});

server.listen(PORT, () => {
    console.log(`✈️  Live Global Telemetry Matrix Online: http://localhost:${PORT}`);
});
