const DEPOT = { lat: -17.3835, lng: -66.1568 };

const BOTTLES_PER_FULL_BOX = 12;
const BOTTLES_PER_HALF_BOX = 6;

export const haversineDistance = (a, b) => {
  if (!a || !b) return Infinity;
  const R = 6371;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
};

export const calculateProductPacking = (quantity) => {
  const qty = Number(quantity) || 0;
  if (qty <= 0) {
    return { fullBoxes: 0, halfBoxes: 0, looseBottles: 0, totalBottles: 0 };
  }
  const fullBoxes = Math.floor(qty / BOTTLES_PER_FULL_BOX);
  const remainderAfterFull = qty % BOTTLES_PER_FULL_BOX;
  const halfBoxes = Math.floor(remainderAfterFull / BOTTLES_PER_HALF_BOX);
  const looseBottles = remainderAfterFull % BOTTLES_PER_HALF_BOX;
  return { fullBoxes, halfBoxes, looseBottles, totalBottles: qty };
};

export const calculateOrderPacking = (order) => {
  if (!order?.products || !Array.isArray(order.products)) {
    return {
      fullBoxes: 0, halfBoxes: 0, looseBottles: 0, totalBottles: 0,
      physicalBoxes: 0, productBreakdown: [],
    };
  }

  let totalFull = 0;
  let totalHalf = 0;
  let totalLoose = 0;
  let totalBottles = 0;
  const productBreakdown = [];

  for (const product of order.products) {
    const packing = calculateProductPacking(product.cantidad);
    totalFull += packing.fullBoxes;
    totalHalf += packing.halfBoxes;
    totalLoose += packing.looseBottles;
    totalBottles += packing.totalBottles;
    productBreakdown.push({
      nombre: product.nombre,
      cantidad: product.cantidad,
      ...packing,
    });
  }

  const mixedBoxes = Math.ceil(totalLoose / BOTTLES_PER_FULL_BOX);
  const physicalBoxes = totalFull + totalHalf + mixedBoxes;

  return {
    fullBoxes: totalFull, halfBoxes: totalHalf, looseBottles: totalLoose,
    mixedBoxes, physicalBoxes, totalBottles, productBreakdown,
  };
};

export const calculateOrderBoxes = (order) => {
  return calculateOrderPacking(order).physicalBoxes;
};

export const getOrderCoords = (order) => {
  const loc = order?.client_location || order?.id_client?.client_location;
  if (!loc) return null;
  const lat = Number(loc.latitud);
  const lng = Number(loc.longitud);
  if (isNaN(lat) || isNaN(lng)) return null;
  return { lat, lng };
};

export const generateDetailedStackingPlan = (orders) => {
  const fullBoxesDetailed = [];
  const halfBoxesDetailed = [];
  const looseBottlesPool = [];

  for (const order of orders) {
    const clientName = order?.id_client
      ? `${order.id_client.name || ""} ${order.id_client.lastName || ""}`.trim()
      : order?.name
      ? `${order.name} ${order.lastName || ""}`.trim()
      : "Cliente";
    const receiveNumber = order.receiveNumber || "—";

    if (!order?.products || !Array.isArray(order.products)) continue;

    for (const product of order.products) {
      const packing = calculateProductPacking(product.cantidad);

      for (let i = 0; i < packing.fullBoxes; i++) {
        fullBoxesDetailed.push({
          producto: product.nombre,
          cliente: clientName,
          receiveNumber,
          bottles: BOTTLES_PER_FULL_BOX,
        });
      }

      for (let i = 0; i < packing.halfBoxes; i++) {
        halfBoxesDetailed.push({
          producto: product.nombre,
          cliente: clientName,
          receiveNumber,
          bottles: BOTTLES_PER_HALF_BOX,
        });
      }

      if (packing.looseBottles > 0) {
        looseBottlesPool.push({
          producto: product.nombre,
          cliente: clientName,
          receiveNumber,
          bottles: packing.looseBottles,
        });
      }
    }
  }

  const mixedBoxes = [];
  let currentBox = { contents: [], totalBottles: 0 };

  looseBottlesPool.sort((a, b) => b.bottles - a.bottles);

  for (const item of looseBottlesPool) {
    let remaining = item.bottles;

    while (remaining > 0) {
      const spaceLeft = BOTTLES_PER_FULL_BOX - currentBox.totalBottles;
      const toAdd = Math.min(remaining, spaceLeft);

      const existing = currentBox.contents.find(
        c => c.producto === item.producto &&
             c.cliente === item.cliente &&
             c.receiveNumber === item.receiveNumber
      );

      if (existing) {
        existing.bottles += toAdd;
      } else {
        currentBox.contents.push({
          producto: item.producto,
          cliente: item.cliente,
          receiveNumber: item.receiveNumber,
          bottles: toAdd,
        });
      }

      currentBox.totalBottles += toAdd;
      remaining -= toAdd;

      if (currentBox.totalBottles >= BOTTLES_PER_FULL_BOX) {
        mixedBoxes.push(currentBox);
        currentBox = { contents: [], totalBottles: 0 };
      }
    }
  }

  if (currentBox.totalBottles > 0) {
    mixedBoxes.push(currentBox);
  }

  const totalLoose = looseBottlesPool.reduce((s, x) => s + x.bottles, 0);

  return {
    bottom: {
      label: "Base (cajas cerradas de 12)",
      count: fullBoxesDetailed.length,
      bottlesPerUnit: BOTTLES_PER_FULL_BOX,
      totalBottles: fullBoxesDetailed.length * BOTTLES_PER_FULL_BOX,
      boxes: fullBoxesDetailed,
    },
    middle: {
      label: "Medio (medias cajas de 6)",
      count: halfBoxesDetailed.length,
      bottlesPerUnit: BOTTLES_PER_HALF_BOX,
      totalBottles: halfBoxesDetailed.length * BOTTLES_PER_HALF_BOX,
      boxes: halfBoxesDetailed,
    },
    top: {
      label: "Superior (cajas mixtas)",
      count: mixedBoxes.length,
      bottlesPerUnit: 0,
      totalBottles: totalLoose,
      looseBottles: totalLoose,
      boxes: mixedBoxes,
    },
    totalPhysicalBoxes: fullBoxesDetailed.length + halfBoxesDetailed.length + mixedBoxes.length,
    totalBottles:
      fullBoxesDetailed.length * BOTTLES_PER_FULL_BOX +
      halfBoxesDetailed.length * BOTTLES_PER_HALF_BOX +
      totalLoose,
  };
};

export const generateStackingPlan = (orders) => {
  return generateDetailedStackingPlan(orders);
};

export const binPackOrders = (orders, capacity, depot = DEPOT) => {
  if (!orders.length || capacity <= 0) return [];

  const ordersWithMeta = orders
    .map((o) => {
      const packing = calculateOrderPacking(o);
      return {
        order: o, boxes: packing.physicalBoxes,
        fullBoxes: packing.fullBoxes, halfBoxes: packing.halfBoxes,
        looseBottles: packing.looseBottles, totalBottles: packing.totalBottles,
        coords: getOrderCoords(o),
      };
    })
    .filter((x) => x.coords);

  const oversized = ordersWithMeta.filter((x) => x.boxes > capacity);
  const fittable = ordersWithMeta.filter((x) => x.boxes <= capacity);

  fittable.sort((a, b) => {
    if (b.fullBoxes !== a.fullBoxes) return b.fullBoxes - a.fullBoxes;
    return b.boxes - a.boxes;
  });

  const trips = [];

  fittable.forEach((item) => {
    let bestTripIdx = -1;
    let bestScore = Infinity;

    trips.forEach((trip, idx) => {
      if (trip.boxes + item.boxes > capacity) return;

      const lastPoint =
        trip.items.length > 0
          ? trip.items[trip.items.length - 1].coords
          : depot;
      const distance = haversineDistance(lastPoint, item.coords);
      const wastePenalty = capacity - (trip.boxes + item.boxes);
      const score = distance + wastePenalty * 0.1;

      if (score < bestScore) {
        bestScore = score;
        bestTripIdx = idx;
      }
    });

    if (bestTripIdx >= 0) {
      trips[bestTripIdx].items.push(item);
      trips[bestTripIdx].boxes += item.boxes;
      trips[bestTripIdx].fullBoxes += item.fullBoxes;
      trips[bestTripIdx].halfBoxes += item.halfBoxes;
      trips[bestTripIdx].looseBottles += item.looseBottles;
      trips[bestTripIdx].totalBottles += item.totalBottles;
    } else {
      trips.push({
        items: [item], boxes: item.boxes,
        fullBoxes: item.fullBoxes, halfBoxes: item.halfBoxes,
        looseBottles: item.looseBottles, totalBottles: item.totalBottles,
      });
    }
  });

  oversized.forEach((item) => {
    trips.push({
      items: [item], boxes: item.boxes,
      fullBoxes: item.fullBoxes, halfBoxes: item.halfBoxes,
      looseBottles: item.looseBottles, totalBottles: item.totalBottles,
      oversized: true,
    });
  });

  return trips;
};

export const nearestNeighborSort = (items, startPoint = DEPOT) => {
  if (items.length <= 1) return items;
  const remaining = [...items];
  const sorted = [];
  let current = startPoint;

  while (remaining.length > 0) {
    let nearestIdx = 0;
    let nearestDist = haversineDistance(current, remaining[0].coords);
    for (let i = 1; i < remaining.length; i++) {
      const d = haversineDistance(current, remaining[i].coords);
      if (d < nearestDist) {
        nearestDist = d;
        nearestIdx = i;
      }
    }
    sorted.push(remaining[nearestIdx]);
    current = remaining[nearestIdx].coords;
    remaining.splice(nearestIdx, 1);
  }
  return sorted;
};

const calculateTotalDistance = (items, depot) => {
  let total = 0;
  let prev = depot;
  for (const item of items) {
    total += haversineDistance(prev, item.coords);
    prev = item.coords;
  }
  total += haversineDistance(prev, depot);
  return total;
};

export const twoOptOptimize = (items, depot = DEPOT, maxIterations = 100) => {
  if (items.length < 3) return items;
  let route = [...items];
  let improved = true;
  let iteration = 0;

  while (improved && iteration < maxIterations) {
    improved = false;
    iteration++;
    for (let i = 0; i < route.length - 1; i++) {
      for (let j = i + 1; j < route.length; j++) {
        const newRoute = [
          ...route.slice(0, i),
          ...route.slice(i, j + 1).reverse(),
          ...route.slice(j + 1),
        ];
        const oldDist = calculateTotalDistance(route, depot);
        const newDist = calculateTotalDistance(newRoute, depot);
        if (newDist < oldDist - 0.001) {
          route = newRoute;
          improved = true;
        }
      }
    }
  }
  return route;
};

export const optimizeRoutes = (orders, capacity, depot = DEPOT) => {
  if (!orders.length) {
    return { trips: [], stats: emptyStats(capacity) };
  }

  const trips = binPackOrders(orders, capacity, depot);

  const optimizedTrips = trips.map((trip, idx) => {
    const sorted = nearestNeighborSort(trip.items, depot);
    const optimized = twoOptOptimize(sorted, depot);
    const distance = calculateTotalDistance(optimized, depot);
    const utilization = (trip.boxes / capacity) * 100;
    const orderList = optimized.map((x) => x.order);
    const stackingPlan = generateDetailedStackingPlan(orderList);

    return {
      tripNumber: idx + 1, orders: orderList, boxes: trip.boxes,
      fullBoxes: trip.fullBoxes, halfBoxes: trip.halfBoxes,
      looseBottles: trip.looseBottles, totalBottles: trip.totalBottles,
      capacity,
      utilization: Math.min(100, Math.round(utilization * 10) / 10),
      distance: Math.round(distance * 10) / 10,
      estimatedTime: Math.round((distance / 30) * 60 + optimized.length * 5),
      oversized: trip.oversized || false,
      stackingPlan,
    };
  });

  const totalBoxes = optimizedTrips.reduce((s, t) => s + t.boxes, 0);
  const totalBottles = optimizedTrips.reduce((s, t) => s + t.totalBottles, 0);
  const totalFullBoxes = optimizedTrips.reduce((s, t) => s + t.fullBoxes, 0);
  const totalDistance = optimizedTrips.reduce((s, t) => s + t.distance, 0);
  const totalTime = optimizedTrips.reduce((s, t) => s + t.estimatedTime, 0);
  const totalOrders = optimizedTrips.reduce((s, t) => s + t.orders.length, 0);
  const avgUtilization =
    optimizedTrips.length > 0
      ? optimizedTrips.reduce((s, t) => s + t.utilization, 0) / optimizedTrips.length
      : 0;

  return {
    trips: optimizedTrips,
    stats: {
      totalTrips: optimizedTrips.length, totalOrders, totalBoxes,
      totalBottles, totalFullBoxes,
      totalDistance: Math.round(totalDistance * 10) / 10,
      totalTime,
      avgUtilization: Math.round(avgUtilization * 10) / 10,
      capacity,
    },
  };
};

const emptyStats = (capacity = 0) => ({
  totalTrips: 0, totalOrders: 0, totalBoxes: 0, totalBottles: 0,
  totalFullBoxes: 0, totalDistance: 0, totalTime: 0,
  avgUtilization: 0, capacity,
});

export const formatDuration = (minutes) => {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
};

export const TRIP_COLORS = [
  "#D3423E", "#F97316", "#EAB308", "#22C55E",
  "#3B82F6", "#8B5CF6", "#EC4899", "#14B8A6",
];

export const getTripColor = (tripNumber) => {
  return TRIP_COLORS[(tripNumber - 1) % TRIP_COLORS.length];
};

export const MIN_ORDERS_TO_OPTIMIZE = 4;