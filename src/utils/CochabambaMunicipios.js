import { CERCADO_OSM, VINTO, SACABA, QUILLACOLLO, TIQUIPAYA, COLCAPIRHUA } from "./CitiesCoordinates";

const MUNI_COLOR = "#475569";
const MUNI_COLOR_LIGHT = "#64748B";
function buildPolygon(data) {

    const relation = data.elements.find(e => e.type === "relation");

    let ways = relation.members
        .filter(m => m.role === "outer" && m.geometry)
        .map(w => [...w.geometry]);

    let polygon = [...ways.shift()];

    while (ways.length) {

        const last = polygon[polygon.length - 1];

        const idx = ways.findIndex(w => {

            const start = w[0];
            const end = w[w.length - 1];

            return (
                (Math.abs(start.lat - last.lat) < 1e-6 &&
                 Math.abs(start.lon - last.lon) < 1e-6)
                ||
                (Math.abs(end.lat - last.lat) < 1e-6 &&
                 Math.abs(end.lon - last.lon) < 1e-6)
            );
        });

        if (idx === -1) break;

        let next = ways.splice(idx, 1)[0];

        const start = next[0];
        const end = next[next.length - 1];

        if (
            Math.abs(end.lat - last.lat) < 1e-6 &&
            Math.abs(end.lon - last.lon) < 1e-6
        ) {
            next.reverse();
        }

        polygon.push(...next.slice(1));
    }

    return polygon.map(p => ({
        lat: p.lat,
        lng: p.lon
    }));
}
export const isPointInMunicipio = (lat, lng, municipio) => {
    if (!municipio || !municipio.bounds) return false;
    const { north, south, east, west } = municipio.bounds;
    return lat <= north && lat >= south && lng <= east && lng >= west;
};
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
       paths: buildPolygon(CERCADO_OSM),
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
        paths: buildPolygon(QUILLACOLLO),
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
       paths: buildPolygon(SACABA),
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
       paths: buildPolygon(TIQUIPAYA),
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
              paths: buildPolygon(COLCAPIRHUA),

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
              paths: buildPolygon(VINTO),

    },
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