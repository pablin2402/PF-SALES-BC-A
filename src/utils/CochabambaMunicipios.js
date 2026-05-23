const MUNI_COLOR = "#475569";
const MUNI_COLOR_LIGHT = "#64748B";

export const MUNICIPIOS_COCHABAMBA = {
    cercado: {
        id: "cercado",
        name: "Cercado",
        fullName: "Cochabamba (Cercado)",
        color: MUNI_COLOR,
        accent: "#0EA5E9",
        fillColor: "#0EA5E9",
        fillOpacity: 0.06,
        strokeColor: "#0EA5E9",
        strokeOpacity: 0.55,
        strokeWeight: 1.5,
        center: { lat: -17.3895, lng: -66.1568 },
        bounds: {
            north: -17.345,
            south: -17.430,
            east: -66.105,
            west: -66.205,
        },
        paths: [
            { lat: -17.345, lng: -66.205 },
            { lat: -17.345, lng: -66.105 },
            { lat: -17.385, lng: -66.105 },
            { lat: -17.420, lng: -66.115 },
            { lat: -17.430, lng: -66.150 },
            { lat: -17.430, lng: -66.190 },
            { lat: -17.410, lng: -66.205 },
            { lat: -17.345, lng: -66.205 },
        ],
    },
    quillacollo: {
        id: "quillacollo",
        name: "Quillacollo",
        fullName: "Quillacollo",
        color: MUNI_COLOR,
        accent: "#7C3AED",
        fillColor: "#7C3AED",
        fillOpacity: 0.06,
        strokeColor: "#7C3AED",
        strokeOpacity: 0.55,
        strokeWeight: 1.5,
        center: { lat: -17.395, lng: -66.270 },
        bounds: {
            north: -17.345,
            south: -17.450,
            east: -66.245,
            west: -66.310,
        },
        paths: [
            { lat: -17.345, lng: -66.310 },
            { lat: -17.345, lng: -66.245 },
            { lat: -17.380, lng: -66.245 },
            { lat: -17.420, lng: -66.250 },
            { lat: -17.450, lng: -66.275 },
            { lat: -17.450, lng: -66.305 },
            { lat: -17.420, lng: -66.310 },
            { lat: -17.345, lng: -66.310 },
        ],
    },
    sacaba: {
        id: "sacaba",
        name: "Sacaba",
        fullName: "Sacaba",
        color: MUNI_COLOR,
        accent: "#059669",
        fillColor: "#059669",
        fillOpacity: 0.06,
        strokeColor: "#059669",
        strokeOpacity: 0.55,
        strokeWeight: 1.5,
        center: { lat: -17.390, lng: -66.045 },
        bounds: {
            north: -17.345,
            south: -17.445,
            east: -65.975,
            west: -66.100,
        },
        paths: [
            { lat: -17.345, lng: -66.100 },
            { lat: -17.345, lng: -65.975 },
            { lat: -17.395, lng: -65.975 },
            { lat: -17.440, lng: -65.995 },
            { lat: -17.445, lng: -66.030 },
            { lat: -17.430, lng: -66.080 },
            { lat: -17.405, lng: -66.100 },
            { lat: -17.345, lng: -66.100 },
        ],
    },
    tiquipaya: {
        id: "tiquipaya",
        name: "Tiquipaya",
        fullName: "Tiquipaya",
        color: MUNI_COLOR,
        accent: "#CA8A04",
        fillColor: "#CA8A04",
        fillOpacity: 0.06,
        strokeColor: "#CA8A04",
        strokeOpacity: 0.55,
        strokeWeight: 1.5,
        center: { lat: -17.320, lng: -66.200 },
        bounds: {
            north: -17.270,
            south: -17.343,
            east: -66.150,
            west: -66.245,
        },
        paths: [
            { lat: -17.270, lng: -66.245 },
            { lat: -17.270, lng: -66.150 },
            { lat: -17.310, lng: -66.150 },
            { lat: -17.330, lng: -66.180 },
            { lat: -17.343, lng: -66.205 },
            { lat: -17.343, lng: -66.245 },
            { lat: -17.270, lng: -66.245 },
        ],
    },
    colcapirhua: {
        id: "colcapirhua",
        name: "Colcapirhua",
        fullName: "Colcapirhua",
        color: MUNI_COLOR,
        accent: "#DB2777",
        fillColor: "#DB2777",
        fillOpacity: 0.06,
        strokeColor: "#DB2777",
        strokeOpacity: 0.55,
        strokeWeight: 1.5,
        center: { lat: -17.395, lng: -66.225 },
        bounds: {
            north: -17.370,
            south: -17.425,
            east: -66.207,
            west: -66.243,
        },
        paths: [
            { lat: -17.370, lng: -66.243 },
            { lat: -17.370, lng: -66.207 },
            { lat: -17.410, lng: -66.207 },
            { lat: -17.425, lng: -66.220 },
            { lat: -17.425, lng: -66.243 },
            { lat: -17.370, lng: -66.243 },
        ],
    },
    vinto: {
        id: "vinto",
        name: "Vinto",
        fullName: "Vinto",
        color: MUNI_COLOR,
        accent: "#EA580C",
        fillColor: "#EA580C",
        fillOpacity: 0.06,
        strokeColor: "#EA580C",
        strokeOpacity: 0.55,
        strokeWeight: 1.5,
        center: { lat: -17.410, lng: -66.340 },
        bounds: {
            north: -17.355,
            south: -17.460,
            east: -66.312,
            west: -66.395,
        },
        paths: [
            { lat: -17.355, lng: -66.395 },
            { lat: -17.355, lng: -66.312 },
            { lat: -17.410, lng: -66.312 },
            { lat: -17.460, lng: -66.345 },
            { lat: -17.460, lng: -66.395 },
            { lat: -17.355, lng: -66.395 },
        ],
    },
};

export const isPointInMunicipio = (lat, lng, municipio) => {
    if (!municipio || !municipio.bounds) return false;
    const { north, south, east, west } = municipio.bounds;
    return lat <= north && lat >= south && lng <= east && lng >= west;
};

export const getMunicipioForPoint = (lat, lng) => {
    const numLat = Number(lat);
    const numLng = Number(lng);
    if (isNaN(numLat) || isNaN(numLng)) return null;

    const priority = ["cercado", "quillacollo", "sacaba", "colcapirhua", "tiquipaya", "vinto"];

    for (const id of priority) {
        const m = MUNICIPIOS_COCHABAMBA[id];
        if (isPointInMunicipio(numLat, numLng, m)) return m;
    }

    let closest = null;
    let minDistance = Infinity;

    Object.values(MUNICIPIOS_COCHABAMBA).forEach(m => {
        const d = Math.sqrt(
            Math.pow(numLat - m.center.lat, 2) +
            Math.pow(numLng - m.center.lng, 2)
        );
        if (d < minDistance) {
            minDistance = d;
            closest = m;
        }
    });

    if (minDistance < 0.15) return closest;
    return null;
};

export const groupClientsByMunicipio = (clients) => {
    const groups = {};

    Object.keys(MUNICIPIOS_COCHABAMBA).forEach(id => {
        groups[id] = { municipio: MUNICIPIOS_COCHABAMBA[id], count: 0, clients: [] };
    });
    groups.other = { municipio: null, count: 0, clients: [] };

    clients.forEach(client => {
        const lat = client?.client_location?.latitud;
        const lng = client?.client_location?.longitud;
        if (!lat || !lng) return;

        const m = getMunicipioForPoint(lat, lng);
        if (m) {
            groups[m.id].count++;
            groups[m.id].clients.push(client);
        } else {
            groups.other.count++;
            groups.other.clients.push(client);
        }
    });

    return groups;
};