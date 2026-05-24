import { getMunicipioForPoint, MUNICIPIOS_COCHABAMBA } from "../utils/CochabambaMunicipios";

const DEPOT = { lat: -17.3835, lng: -66.1568 };

const ZONE_ORDER = ["cercado", "colcapirhua", "quillacollo", "vinto", "tiquipaya", "sacaba"];

const haversineDistance = (a, b) => {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const x =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(x));
};

const getCoords = (client) => ({
    lat: Number(client?.client_location?.latitud),
    lng: Number(client?.client_location?.longitud),
});

const isValidClient = (c) => {
    const { lat, lng } = getCoords(c);
    return !isNaN(lat) && !isNaN(lng);
};

const nearestNeighborTSP = (clients, startPoint = DEPOT) => {
    if (!clients.length) return [];
    const remaining = [...clients];
    const route = [];
    let current = startPoint;

    while (remaining.length > 0) {
        let nearestIdx = 0;
        let nearestDist = Infinity;
        for (let i = 0; i < remaining.length; i++) {
            const d = haversineDistance(current, getCoords(remaining[i]));
            if (d < nearestDist) {
                nearestDist = d;
                nearestIdx = i;
            }
        }
        const next = remaining.splice(nearestIdx, 1)[0];
        route.push(next);
        current = getCoords(next);
    }
    return route;
};

const calculateRouteDistance = (route, startPoint = DEPOT) => {
    if (!route.length) return 0;
    let total = haversineDistance(startPoint, getCoords(route[0]));
    for (let i = 0; i < route.length - 1; i++) {
        total += haversineDistance(getCoords(route[i]), getCoords(route[i + 1]));
    }
    return total;
};

const twoOptSwap = (route, i, k) => {
    const newRoute = [...route.slice(0, i)];
    const reversed = route.slice(i, k + 1).reverse();
    return [...newRoute, ...reversed, ...route.slice(k + 1)];
};

const twoOptImprove = (route, startPoint = DEPOT, maxIterations = 100) => {
    if (route.length < 4) return route;
    let best = [...route];
    let bestDistance = calculateRouteDistance(best, startPoint);
    let improved = true;
    let iter = 0;

    while (improved && iter < maxIterations) {
        improved = false;
        iter++;
        for (let i = 1; i < best.length - 1; i++) {
            for (let k = i + 1; k < best.length; k++) {
                const candidate = twoOptSwap(best, i, k);
                const candidateDistance = calculateRouteDistance(candidate, startPoint);
                if (candidateDistance < bestDistance - 0.001) {
                    best = candidate;
                    bestDistance = candidateDistance;
                    improved = true;
                }
            }
        }
    }
    return best;
};

export const optimizeByProximity = (clients, startPoint = DEPOT) => {
    const valid = clients.filter(isValidClient);
    if (valid.length === 0) return { route: [], distance: 0, mode: "proximity" };

    const initialRoute = nearestNeighborTSP(valid, startPoint);
    const improvedRoute = twoOptImprove(initialRoute, startPoint);
    const distance = calculateRouteDistance(improvedRoute, startPoint);

    return {
        route: improvedRoute,
        distance: distance.toFixed(2),
        mode: "proximity",
        zones: null,
    };
};

export const optimizeByZones = (clients, startPoint = DEPOT, customZoneOrder = ZONE_ORDER) => {
    const valid = clients.filter(isValidClient);
    if (valid.length === 0) return { route: [], distance: 0, mode: "zones" };

    const byZone = {};
    const noZone = [];

    valid.forEach((client) => {
        const { lat, lng } = getCoords(client);
        const muni = getMunicipioForPoint(lat, lng);
        if (muni?.id) {
            if (!byZone[muni.id]) byZone[muni.id] = [];
            byZone[muni.id].push(client);
        } else {
            noZone.push(client);
        }
    });

    const orderedZones = [];
    let currentPoint = startPoint;
    const finalRoute = [];
    const zoneRoutes = [];

    for (const zoneId of customZoneOrder) {
        if (!byZone[zoneId] || byZone[zoneId].length === 0) continue;

        const zoneClients = byZone[zoneId];
        const nnRoute = nearestNeighborTSP(zoneClients, currentPoint);
        const optimizedRoute =
            zoneClients.length >= 4
                ? twoOptImprove(nnRoute, currentPoint)
                : nnRoute;

        zoneRoutes.push({
            zoneId,
            zoneName: MUNICIPIOS_COCHABAMBA[zoneId]?.name || zoneId,
            zoneColor: MUNICIPIOS_COCHABAMBA[zoneId]?.accent || "#64748B",
            count: optimizedRoute.length,
            clients: optimizedRoute,
        });

        finalRoute.push(...optimizedRoute);
        orderedZones.push(zoneId);
        currentPoint = getCoords(optimizedRoute[optimizedRoute.length - 1]);
    }

    if (noZone.length > 0) {
        const noZoneRoute = nearestNeighborTSP(noZone, currentPoint);
        const optimized =
            noZone.length >= 4 ? twoOptImprove(noZoneRoute, currentPoint) : noZoneRoute;

        zoneRoutes.push({
            zoneId: "other",
            zoneName: "Fuera de Kanata",
            zoneColor: "#94A3B8",
            count: optimized.length,
            clients: optimized,
        });
        finalRoute.push(...optimized);
    }

    const distance = calculateRouteDistance(finalRoute, startPoint);

    return {
        route: finalRoute,
        distance: distance.toFixed(2),
        mode: "zones",
        zones: zoneRoutes,
        zoneOrder: orderedZones,
    };
};

export const checkCapacity = (clients, capacity = 30) => {
    const count = clients.length;
    const cap = Number(capacity) || 30;
    return {
        count,
        capacity: cap,
        exceeded: count > cap,
        overflow: Math.max(0, count - cap),
        usagePercent: Math.round((count / cap) * 100),
    };
};

export const ZONE_PRESETS = {
    cochabamba_oeste: {
        label: "Cercado → Oeste",
        order: ["cercado", "colcapirhua", "quillacollo", "vinto"],
    },
    cochabamba_norte: {
        label: "Cercado → Norte",
        order: ["cercado", "tiquipaya"],
    },
    cochabamba_este: {
        label: "Cercado → Sacaba",
        order: ["cercado", "sacaba"],
    },
    full_metropolitan: {
        label: "Recorrido completo",
        order: ["cercado", "colcapirhua", "quillacollo", "vinto", "tiquipaya", "sacaba"],
    },
    reverse: {
        label: "Periferia → Cercado",
        order: ["sacaba", "tiquipaya", "vinto", "quillacollo", "colcapirhua", "cercado"],
    },
};

export { DEPOT, ZONE_ORDER };