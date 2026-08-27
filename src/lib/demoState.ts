import type {
  AdminStats,
  CourierAvailability,
  DemoState,
  NewOrderInput,
  Order,
  OrderStatus,
  StoreOrderStatus
} from "../types";

const statusFlow: OrderStatus[] = ["Pending", "Accepted", "Picked up", "On the way", "Delivered"];

const campusPoints = [
  { id: "main-gate", name: "Main Gate", kind: "Gate" as const, x: 11, y: 70 },
  { id: "student-center", name: "Student Center", kind: "Service" as const, x: 34, y: 44 },
  { id: "library", name: "University Library", kind: "Academic" as const, x: 60, y: 27 },
  { id: "cot", name: "College of Technologies", kind: "Academic" as const, x: 75, y: 58 },
  { id: "admin", name: "Admin Building", kind: "Admin" as const, x: 48, y: 68 },
  { id: "canteen", name: "Main Canteen", kind: "Food" as const, x: 28, y: 24 },
  { id: "business", name: "Business Building", kind: "Academic" as const, x: 68, y: 78 }
];

const stores = [
  {
    id: "canteen-express",
    name: "Canteen Express",
    category: "Meals and snacks",
    location: "Main Canteen",
    rating: 4.8,
    salesToday: 6840,
    status: "Open" as const,
    featuredItems: ["Chicken pastel", "Iced coffee", "Banana cue"]
  },
  {
    id: "print-hub",
    name: "Print Hub",
    category: "Printing service",
    location: "Student Center",
    rating: 4.7,
    salesToday: 3280,
    status: "Open" as const,
    featuredItems: ["Research paper", "Thesis draft", "ID photocopy"]
  },
  {
    id: "market-stall",
    name: "Student Market Stall",
    category: "Student entrepreneur",
    location: "Business Building",
    rating: 4.9,
    salesToday: 5120,
    status: "Open" as const,
    featuredItems: ["Cookies", "School supplies", "Packed lunch"]
  }
];

const couriers = [
  {
    id: "courier-1",
    name: "Mara D.",
    avatar: "MD",
    availability: "Available" as const,
    rating: 4.95,
    deliveriesToday: 8,
    earningsToday: 420,
    currentPoint: "Student Center"
  },
  {
    id: "courier-2",
    name: "Ken A.",
    avatar: "KA",
    availability: "Available" as const,
    rating: 4.82,
    deliveriesToday: 5,
    earningsToday: 265,
    currentPoint: "University Library"
  },
  {
    id: "courier-3",
    name: "Lia S.",
    avatar: "LS",
    availability: "Busy" as const,
    rating: 4.89,
    deliveriesToday: 7,
    earningsToday: 360,
    currentPoint: "College of Technologies"
  }
];

const orders: Order[] = [
  {
    id: "order-1001",
    serviceType: "Food",
    storeId: "canteen-express",
    storeName: "Canteen Express",
    customerName: "Jessa M.",
    customerType: "Student",
    items: ["Chicken pastel", "Iced coffee"],
    pickupPoint: "Main Canteen",
    dropoffPoint: "College of Technologies",
    status: "Pending",
    storeStatus: "Ready for pickup",
    total: 155,
    fee: 25,
    etaMinutes: 12,
    paymentMethod: "COD",
    customerNote: "Meet near the COT lobby.",
    createdAt: "10:16 AM"
  },
  {
    id: "order-1002",
    serviceType: "Printing",
    storeId: "print-hub",
    storeName: "Print Hub",
    customerName: "Mr. Alvaro",
    customerType: "Faculty",
    items: ["Class handouts, 30 pages"],
    pickupPoint: "Student Center",
    dropoffPoint: "Admin Building",
    status: "Accepted",
    storeStatus: "New",
    courierId: "courier-3",
    total: 230,
    fee: 30,
    etaMinutes: 18,
    paymentMethod: "COD",
    customerNote: "Please keep pages in order.",
    createdAt: "10:22 AM"
  }
];

export function calculateStats(state: Omit<DemoState, "stats">): AdminStats {
  const activeOrders = state.orders.filter((order) => order.status !== "Delivered").length;
  const availableOrders = state.orders.filter((order) => order.status === "Pending").length;
  const activeCouriers = state.couriers.filter((courier) => courier.availability === "Available").length;
  const totalRevenue = state.orders.reduce((sum, order) => sum + order.fee, 0);
  const averageRating =
    state.stores.reduce((sum, store) => sum + store.rating, 0) / Math.max(1, state.stores.length);

  return {
    activeCouriers,
    activeOrders,
    availableOrders,
    totalOrders: state.orders.length,
    totalRevenue,
    registeredStores: state.stores.length,
    complaints: 2,
    averageRating: Number(averageRating.toFixed(1))
  };
}

export function createDemoState(): DemoState {
  const base = {
    campusPoints,
    stores,
    couriers,
    orders,
    activity: [
      "Admin verified Student Market Stall",
      "Mara D. switched to Available",
      "Print Hub received a printing request"
    ]
  };

  return {
    ...base,
    stats: calculateStats(base)
  };
}

export function placeOrder(state: DemoState, input: NewOrderInput): DemoState {
  const store = state.stores.find((candidate) => candidate.id === input.storeId) ?? state.stores[0];
  const serviceBase = input.serviceType === "Printing" ? 95 : input.serviceType === "Errand" ? 130 : 120;
  const fee = input.serviceType === "Errand" ? 35 : 25;
  const order: Order = {
    id: `order-${1000 + state.orders.length + 1}`,
    serviceType: input.serviceType,
    storeId: store.id,
    storeName: store.name,
    customerName: "Demo Customer",
    customerType: "Student",
    items: input.items,
    pickupPoint: input.pickupPoint,
    dropoffPoint: input.dropoffPoint,
    status: "Pending",
    storeStatus: input.serviceType === "Food" ? "Preparing" : "New",
    total: serviceBase + fee,
    fee,
    etaMinutes: input.serviceType === "Printing" ? 20 : 14,
    paymentMethod: "COD",
    customerNote: input.customerNote,
    createdAt: "Just now"
  };

  const next = {
    ...state,
    orders: [order, ...state.orders],
    activity: [`${order.customerName} placed a ${order.serviceType.toLowerCase()} request`, ...state.activity]
  };

  return { ...next, stats: calculateStats(next) };
}

export function cancelOrder(state: DemoState, orderId: string): DemoState {
  const order = state.orders.find((candidate) => candidate.id === orderId);
  if (!order || order.status !== "Pending") {
    return state;
  }

  const next = {
    ...state,
    orders: state.orders.filter((candidate) => candidate.id !== orderId),
    activity: [`${orderId} was cancelled by the customer`, ...state.activity]
  };

  return { ...next, stats: calculateStats(next) };
}

export function acceptOrder(state: DemoState, orderId: string, courierId: string): DemoState {
  const courier = state.couriers.find((candidate) => candidate.id === courierId);
  if (!courier || courier.availability !== "Available") {
    return state;
  }

  const next = {
    ...state,
    orders: state.orders.map((order) =>
      order.id === orderId && order.status === "Pending"
        ? { ...order, courierId, status: "Accepted" as const }
        : order
    ),
    couriers: state.couriers.map((candidate) =>
      candidate.id === courierId ? { ...candidate, availability: "Busy" as const } : candidate
    ),
    activity: [`${courier.name} accepted ${orderId}`, ...state.activity]
  };

  return { ...next, stats: calculateStats(next) };
}

export function advanceOrderStatus(state: DemoState, orderId: string): DemoState {
  let completedCourierId: string | undefined;

  const nextOrders = state.orders.map((order) => {
    if (order.id !== orderId) {
      return order;
    }

    const currentIndex = statusFlow.indexOf(order.status);
    const nextStatus = statusFlow[Math.min(currentIndex + 1, statusFlow.length - 1)];
    if (nextStatus === "Delivered") {
      completedCourierId = order.courierId;
    }

    return {
      ...order,
      status: nextStatus,
      storeStatus: nextStatus === "Delivered" ? ("Completed" as const) : order.storeStatus
    };
  });

  const next = {
    ...state,
    orders: nextOrders,
    couriers: state.couriers.map((courier) =>
      courier.id === completedCourierId
        ? {
            ...courier,
            availability: "Available" as const,
            deliveriesToday: courier.deliveriesToday + 1,
            earningsToday: courier.earningsToday + 30
          }
        : courier
    ),
    activity: [`${orderId} moved to ${nextOrders.find((order) => order.id === orderId)?.status ?? "Updated"}`, ...state.activity]
  };

  return { ...next, stats: calculateStats(next) };
}

export function setCourierAvailability(
  state: DemoState,
  courierId: string,
  availability: CourierAvailability
): DemoState {
  const courier = state.couriers.find((candidate) => candidate.id === courierId);
  const next = {
    ...state,
    couriers: state.couriers.map((candidate) =>
      candidate.id === courierId ? { ...candidate, availability } : candidate
    ),
    activity: courier ? [`${courier.name} switched to ${availability}`, ...state.activity] : state.activity
  };

  return { ...next, stats: calculateStats(next) };
}

export function setStoreOrderStatus(
  state: DemoState,
  orderId: string,
  storeStatus: StoreOrderStatus
): DemoState {
  const next = {
    ...state,
    orders: state.orders.map((order) => (order.id === orderId ? { ...order, storeStatus } : order)),
    activity: [`Store marked ${orderId} as ${storeStatus}`, ...state.activity]
  };

  return { ...next, stats: calculateStats(next) };
}
