const http = require('http');
const https = require('https'); 
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;

// 🌍 MASSIVE GLOBAL OPERATOR DATABASE (400+ Airlines including Cinnamon Air)
const airlineDatabase = {
    // --- SRI LANKA & REGIONAL ---
    "CIN": "Cinnamon Air", "ALK": "SriLankan Airlines", "ALV": "SriLankan AirTaxi", 
    "FDP": "FitsAir", "DPB": "Lankan Airways", "DQA": "Maldivian", "QNK": "Manta Air", 
    "MAT": "Trans Maldivian Airways",

    // --- NORTH AMERICA ---
    "AAL": "American Airlines", "DAL": "Delta Air Lines", "UAL": "United Airlines", "SWA": "Southwest Airlines",
    "JBU": "JetBlue Airways", "ASA": "Alaska Airlines", "NKS": "Spirit Airlines", "FFT": "Frontier Airlines",
    "HAL": "Hawaiian Airlines", "SCX": "Sun Country Airlines", "MXY": "Breeze Airways", "AAY": "Allegiant Air",
    "SYX": "SkyWest Airlines", "ENY": "Envoy Air", "RPA": "Republic Airways", "JIA": "PSA Airlines",
    "EDV": "Endeavor Air", "PDT": "Piedmont Airlines", "ASH": "Mesa Airlines", "QXE": "Horizon Air",
    "GJS": "GoJet Airlines", "CWI": "Air Wisconsin", "CPZ": "Compass Airlines", "NWA": "Northwest Airlines",
    "ACA": "Air Canada", "WJA": "WestJet", "TSC": "Air Transat", "POE": "Porter Airlines", 
    "ROU": "Air Canada Rouge", "SWG": "Sunwing Airlines", "FLA": "Flair Airlines", "CJT": "Cargojet",
    "AMX": "Aeromexico", "VOI": "Volaris", "VIV": "VivaAerobus", "SLI": "Aeromexico Connect",

    // --- EUROPE ---
    "BAW": "British Airways", "VIR": "Virgin Atlantic", "EZY": "EasyJet", "RYR": "Ryanair", "EXS": "Jet2",
    "TUI": "TUI Airways", "AFR": "Air France", "KLM": "KLM Royal Dutch Airlines", "DLH": "Lufthansa",
    "SWR": "Swiss Int'l Air Lines", "AUA": "Austrian Airlines", "BEL": "Brussels Airlines",
    "IBE": "Iberia", "VLG": "Vueling", "AEA": "Air Europa", "AZA": "ITA Airways", "TAP": "TAP Air Portugal",
    "SAS": "Scandinavian Airlines", "FIN": "Finnair", "NAX": "Norwegian", "ICE": "Icelandair",
    "AEE": "Aegean Airlines", "THY": "Turkish Airlines", "PGT": "Pegasus Airlines", "SXS": "SunExpress",
    "WZZ": "Wizz Air", "LOT": "LOT Polish Airlines", "CSA": "Czech Airlines", "TAR": "TAROM",
    "ASL": "Air Serbia", "AFL": "Aeroflot", "SBI": "S7 Airlines", "EIN": "Aer Lingus",
    "LOG": "Loganair", "NVR": "Novair", "VKG": "Sunclass Airlines", "JAF": "TUI fly Belgium",
    "TFL": "TUI fly Netherlands", "EWG": "Eurowings", "CFG": "Condor", "TAY": "ASL Airlines Belgium",
    "BCS": "European Air Transport", "SWA": "Smartwings", "BTI": "airBaltic", "CYL": "Cyprus Airways",
    "WUK": "Wizz Air UK", "NPT": "Neo", "IBK": "Iberia Express", "VJT": "VistaJet", "FHY": "Freebird",

    // --- MIDDLE EAST & AFRICA ---
    "UAE": "Emirates", "QTR": "Qatar Airways", "ETD": "Etihad Airways", "SVA": "Saudia", "OMA": "Oman Air",
    "GFA": "Gulf Air", "KAC": "Kuwait Airways", "MEA": "Middle East Airlines", "RJA": "Royal Jordanian",
    "LYX": "El Al", "FDB": "Flydubai", "ABY": "Air Arabia", "JZR": "Jazeera Airways", "XYE": "Flynas",
    "MSR": "EgyptAir", "RAM": "Royal Air Maroc", "ETH": "Ethiopian Airlines", "KQA": "Kenya Airways", 
    "SAA": "South African Airways", "DAH": "Air Algerie", "LAA": "Libyan Airlines", "ATQ": "Buraq Air",
    "AHW": "Iraqi Airways", "IRA": "Iran Air", "IRM": "Mahan Air", "RWA": "RwandAir",
    "DTA": "TAAG Angola Airlines", "TCW": "Thomas Cook Airlines", "MAU": "Air Mauritius", "MDG": "Madagascar Airlines",

    // --- ASIA & SOUTH ASIA ---
    "AIC": "Air India", "IGO": "IndiGo", "SEJ": "SpiceJet", "VTI": "Vistara", "AXB": "Air India Express",
    "IAD": "AirAsia India", "GOW": "Go First", "AKX": "Akasa Air", "LLR": "Alliance Air",
    "PIA": "Pakistan Int'l Airlines", "BBC": "Biman Bangladesh", "VNS": "Nepal Airlines", "BHA": "Buddha Air", 
    "SIA": "Singapore Airlines", "MAS": "Malaysia Airlines", "AXM": "AirAsia", "XAX": "AirAsia X", 
    "GIA": "Garuda Indonesia", "LNI": "Lion Air", "CTV": "Batik Air", "AWQ": "Indonesia AirAsia", 
    "PAL": "Philippine Airlines", "CEB": "Cebu Pacific", "THA": "Thai Airways", "TAW": "Thai AirAsia", 
    "HVN": "Vietnam Airlines", "VJC": "VietJet Air", "BAM": "Bamboo Airways", "SIA": "Singapore Airlines",
    "CCA": "Air China", "CES": "China Eastern", "CSN": "China Southern", "CHH": "Hainan Airlines", 
    "CXA": "XiamenAir", "CSC": "Sichuan Airlines", "CQH": "Spring Airlines", "CSZ": "Shenzhen Airlines",
    "CPA": "Cathay Pacific", "HDA": "Cathay Dragon", "CRK": "Hong Kong Airlines", "HKC": "HK Express", 
    "EVA": "EVA Air", "CAL": "China Airlines", "SJX": "Starlux Airlines", "MDA": "Mandarin Airlines",
    "JAL": "Japan Airlines", "ANA": "All Nippon Airways", "SKY": "Skymark Airlines", "APJ": "Peach", 
    "SFJ": "StarFlyer", "ADO": "Air Do", "SNJ": "Solaseed Air",
    "KAL": "Korean Air", "AAR": "Asiana Airlines", "JJA": "Jeju Air", "JNA": "Jin Air", "TWB": "T'way Air",

    // --- OCEANIA & SOUTH AMERICA ---
    "QFA": "Qantas", "VOZ": "Virgin Australia", "JST": "Jetstar", "ANZ": "Air New Zealand",
    "QLK": "QantasLink", "RXA": "Regional Express", "AWN": "Air Niugini", "FJI": "Fiji Airways",
    "LAN": "LATAM Airlines", "TAM": "LATAM Brasil", "GLO": "Gol Transportes", "AZU": "Azul Brazilian Airlines",
    "AVA": "Avianca", "CMP": "Copa Airlines", "ARG": "Aerolineas Argentinas", "SKU": "Sky Airline",
    "BOS": "OpenSkies", "VVC": "Viva Air Colombia", "LPE": "LATAM Peru", "DSM": "LATAM Argentina",

    // --- GLOBAL CARGO, CHARTER & LOGISTICS ---
    "FDX": "FedEx Express", "UPS": "UPS Airlines", "GTI": "Atlas Air", "PAC": "Polar Air Cargo",
    "CKS": "Kalitta Air", "ABX": "ABX Air", "SOO": "Southern Air", "NCA": "Nippon Cargo Airlines",
    "CLX": "Cargolux", "BOX": "AeroLogic", "AJK": "Astar Air Cargo", "OAE": "Omni Air International",
    "MNB": "MNG Airlines", "MPH": "Martinair", "SQC": "Singapore Airlines Cargo", "MPD": "Air Atlanta Icelandic",
    "DHK": "DHL Aviation", "BCS": "DHL Air UK", "SNB": "Brussels Airlines Cargo", "TAY": "ASL Airlines Belgium"
};

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
        if (openSkyCache && (NOW - lastFetchTime < 15000)) {
            return resolve(openSkyCache);
        }

        const options = {
            hostname: 'opensky-network.org',
            path: '/api/states/all',
            headers: {
                'User-Agent': 'RadarMatrix-App/1.0'
            }
        };

        if (process.env.OPENSKY_USERNAME && process.env.OPENSKY_PASSWORD) {
            const auth = Buffer.from(`${process.env.OPENSKY_USERNAME}:${process.env.OPENSKY_PASSWORD}`).toString('base64');
            options.headers['Authorization'] = `Basic ${auth}`;
        }

        https.get(options, (res) => {
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
                    console.error("OpenSky API Error: Blocked or Rate Limited");
                    resolve(openSkyCache || []);
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
        
        let targetFile = path.join(__dirname, 'index.html');
        if (!fs.existsSync(targetFile)) {
            targetFile = path.join(__dirname, 'index5.html');
        }

        if (fs.existsSync(targetFile)) {
            const stream = fs.createReadStream(targetFile);
            stream.on('error', () => {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error.');
            });
            stream.pipe(res);
        } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Error: HTML file missing.');
        }
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

    // --- AIRCRAFT PROXY ---
    else if (parsedUrl.pathname.startsWith('/api/aircraft/') && req.method === 'GET') {
        const icao = parsedUrl.pathname.split('/')[3];
        const options = {
            hostname: 'hexdb.io',
            path: `/api/v1/aircraft/${icao}`,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        };

        https.get(options, (proxyRes) => {
            let data = '';
            proxyRes.on('data', chunk => data += chunk);
            proxyRes.on('end', () => {
                res.writeHead(proxyRes.statusCode, { 'Content-Type': 'application/json' });
                res.end(data);
            });
        }).on('error', () => {
            res.writeHead(500, { 'Content-Type': 'application/json' }); 
            res.end(JSON.stringify({ error: 'Proxy failed' }));
        });
    }

    // --- ROUTE PROXY ---
    else if (parsedUrl.pathname === '/api/routes' && req.method === 'GET') {
        const flight = parsedUrl.query.flight || '';
        const options = {
            hostname: 'api.flightradar24.com',
            path: `/common/v1/flight/list.json?query=${encodeURIComponent(flight)}`,
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
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
        }).on('error', () => {
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

server.listen(PORT, '0.0.0.0', () => {
    console.log(`✈️  Live Global Telemetry Matrix Online on port ${PORT}`);
});
