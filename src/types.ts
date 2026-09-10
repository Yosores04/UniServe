export type Role = "customer" | "courier" | "store" | "admin";

export type ServiceType = "Food" | "Printing" | "Errand";

export type OrderStatus = "Pending" | "Accepted" | "Picked up" | "On the way" | "Delivered";

export type StoreOrderStatus = "New" | "Preparing" | "Ready for pickup" | "Completed";

export type CourierAvailability = "Available" | "Busy" | "Offline";

export type PaymentMethod = "COD" | "E-wallet";

export type ChatMessage = {
  sender: string;
  message: string;
  createdAt: string;
};

export type Complaint = {
  id: string;
  subject: string;
  detail: string;
  status: "Open" | "Resolved";
};

export type CampusPoint = {
  id: string;
  name: string;
  kind: "Gate" | "Academic" | "Service" | "Food" | "Admin";
  x: number;
  y: number;
};

export type Store = {
  id: string;
  name: string;
  category: string;
  location: string;
  rating: number;
  salesToday: number;
  status: "Open" | "Closed";
  operatingHours: string;
  featuredItems: string[];
};

export type Courier = {
  id: string;
  name: string;
  avatar: string;
  availability: CourierAvailability;
  rating: number;
  deliveriesToday: number;
  earningsToday: number;
  currentPoint: string;
};

export type Order = {
  id: string;
  serviceType: ServiceType;
  storeId: string;
  storeName: string;
  customerName: string;
  customerType: "Student" | "Faculty" | "Staff";
  items: string[];
  pickupPoint: string;
  dropoffPoint: string;
  status: OrderStatus;
  storeStatus: StoreOrderStatus;
  courierId?: string;
  total: number;
  fee: number;
  etaMinutes: number;
  paymentMethod: PaymentMethod;
  customerNote: string;
  createdAt: string;
  rating?: number;
  chat?: ChatMessage[];
};

export type AdminStats = {
  activeCouriers: number;
  activeOrders: number;
  availableOrders: number;
  totalOrders: number;
  totalRevenue: number;
  registeredStores: number;
  complaints: number;
  averageRating: number;
};

export type DemoState = {
  campusPoints: CampusPoint[];
  stores: Store[];
  couriers: Courier[];
  orders: Order[];
  stats: AdminStats;
  activity: string[];
  complaints: Complaint[];
};

export type NewOrderInput = {
  serviceType: ServiceType;
  storeId: string;
  items: string[];
  pickupPoint: string;
  dropoffPoint: string;
  customerNote: string;
};
