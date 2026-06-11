export type UserRole = 'customer' | 'partner';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  location?: string;
}

export interface Item {
  id: string;
  partnerId: string;
  partnerName: string;
  title: string;
  description: string;
  category: 'crib' | 'breast-pump' | 'stroller' | 'car-seat' | 'high-chair' | 'baby-monitor' | 'other';
  dailyRate: number;
  weeklyRate?: number;
  monthlyRate?: number;
  images: string[];
  location: string;
  condition: 'excellent' | 'good' | 'fair';
  available: boolean;
  minRentalDays: number;
  maxRentalDays?: number;
  createdAt: Date;
}

export interface Rental {
  id: string;
  itemId: string;
  customerId: string;
  customerName: string;
  partnerId: string;
  startDate: Date;
  endDate: Date;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  createdAt: Date;
}

export interface BookingRequest {
  itemId: string;
  startDate: string;
  endDate: string;
}
