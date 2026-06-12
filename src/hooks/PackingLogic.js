export const BOTTLES_PER_BOX = 12;
export const BOTTLES_PER_HALF_BOX = 6;

export const packBottles = (totalBottles) => {
  const bottles = Math.max(0, Math.floor(Number(totalBottles) || 0));
  const fullBoxes = Math.floor(bottles / BOTTLES_PER_BOX);
  const remainder = bottles % BOTTLES_PER_BOX;
  const halfBoxes = remainder >= BOTTLES_PER_HALF_BOX ? 1 : 0;
  const looseBottles = remainder - halfBoxes * BOTTLES_PER_HALF_BOX;
  const physicalBoxes = fullBoxes + halfBoxes + (looseBottles > 0 ? 1 : 0);
  return { totalBottles: bottles, fullBoxes, halfBoxes, looseBottles, physicalBoxes };
};

export const getOrderBottles = (order) => {
  if (!order) return 0;
  if (Number.isFinite(Number(order.totalBottles)) && Number(order.totalBottles) > 0) {
    return Number(order.totalBottles);
  }
  const lines = order.products || order.orderProducts || order.items || [];
  if (Array.isArray(lines) && lines.length) {
    return lines.reduce((sum, line) => {
      const qty = Number(line.quantity ?? line.cantidad ?? 0) || 0;
      const perUnit = Number(line.bottlesPerUnit ?? line.unidades ?? 1) || 1;
      return sum + qty * perUnit;
    }, 0);
  }
  return 0;
};

export const calculateOrderPacking = (order) => packBottles(getOrderBottles(order));

export const calculateOrderBoxes = (order) => calculateOrderPacking(order).physicalBoxes;

export const aggregateTripPacking = (orders = []) =>
  orders.reduce(
    (acc, order) => {
      const p = calculateOrderPacking(order);
      return {
        totalBottles: acc.totalBottles + p.totalBottles,
        fullBoxes: acc.fullBoxes + p.fullBoxes,
        halfBoxes: acc.halfBoxes + p.halfBoxes,
        looseBottles: acc.looseBottles + p.looseBottles,
        physicalBoxes: acc.physicalBoxes + p.physicalBoxes,
      };
    },
    { totalBottles: 0, fullBoxes: 0, halfBoxes: 0, looseBottles: 0, physicalBoxes: 0 },
  );

export const generateStackingPlan = (orders = []) => {
  const p = aggregateTripPacking(orders);
  return {
    totalPhysicalBoxes: p.physicalBoxes,
    totalBottles: p.totalBottles,
    bottom: { count: p.fullBoxes, label: `${p.fullBoxes} cajas de 12` },
    middle: { count: p.halfBoxes, label: `${p.halfBoxes} medias cajas de 6` },
    top: {
      looseBottles: p.looseBottles,
      boxes: p.physicalBoxes - p.fullBoxes - p.halfBoxes,
      label: p.looseBottles > 0 ? `${p.looseBottles} botellas sueltas en caja parcial` : "Sin sueltas",
    },
    perOrder: orders.map((o) => ({
      _id: o._id,
      receiveNumber: o.receiveNumber ?? o.orderId?.receiveNumber ?? null,
      ...calculateOrderPacking(o),
    })),
  };
};

export const tripPackingFields = (orders, capacity) => {
  const p = aggregateTripPacking(orders);
  return {
    boxes: p.physicalBoxes,
    fullBoxes: p.fullBoxes,
    halfBoxes: p.halfBoxes,
    looseBottles: p.looseBottles,
    totalBottles: p.totalBottles,
    capacity,
    utilization: capacity > 0 ? Math.round((p.physicalBoxes / capacity) * 100) : 0,
    oversized: p.physicalBoxes > capacity,
    stackingPlan: generateStackingPlan(orders),
  };
};