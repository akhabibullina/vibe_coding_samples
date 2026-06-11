import { Item, Rental } from '@/types';

export const mockItems: Item[] = [
  {
    id: '1',
    partnerId: 'p1',
    partnerName: 'Sarah Johnson',
    title: 'BabyBjorn Travel Crib Light',
    description: 'Lightweight and easy to set up travel crib. Perfect for trips and visits. Includes mattress and travel bag.',
    category: 'crib',
    dailyRate: 15,
    weeklyRate: 90,
    monthlyRate: 300,
    images: ['/crib1.jpg'],
    location: 'San Francisco, CA',
    condition: 'excellent',
    available: true,
    minRentalDays: 3,
    maxRentalDays: 30,
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    partnerId: 'p1',
    partnerName: 'Sarah Johnson',
    title: 'Medela Pump in Style Breast Pump',
    description: 'Hospital-grade double electric breast pump. Includes bottles, flanges, and cooler bag. Fully sanitized.',
    category: 'breast-pump',
    dailyRate: 10,
    weeklyRate: 60,
    monthlyRate: 200,
    images: ['/pump1.jpg'],
    location: 'San Francisco, CA',
    condition: 'excellent',
    available: true,
    minRentalDays: 7,
    maxRentalDays: 90,
    createdAt: new Date('2024-01-20'),
  },
  {
    id: '3',
    partnerId: 'p2',
    partnerName: 'Mike Chen',
    title: 'UPPAbaby Vista V2 Stroller',
    description: 'Premium stroller with bassinet and toddler seat. Includes rain cover and cup holder.',
    category: 'stroller',
    dailyRate: 20,
    weeklyRate: 120,
    monthlyRate: 400,
    images: ['/stroller1.jpg'],
    location: 'Oakland, CA',
    condition: 'good',
    available: true,
    minRentalDays: 3,
    maxRentalDays: 60,
    createdAt: new Date('2024-02-01'),
  },
  {
    id: '4',
    partnerId: 'p2',
    partnerName: 'Mike Chen',
    title: 'Graco SnugRide 35 Car Seat',
    description: 'Infant car seat with base. Easy installation and excellent safety ratings.',
    category: 'car-seat',
    dailyRate: 8,
    weeklyRate: 50,
    monthlyRate: 150,
    images: ['/carseat1.jpg'],
    location: 'Oakland, CA',
    condition: 'excellent',
    available: true,
    minRentalDays: 7,
    maxRentalDays: 180,
    createdAt: new Date('2024-02-05'),
  },
  {
    id: '5',
    partnerId: 'p3',
    partnerName: 'Emily Davis',
    title: 'Fisher-Price 4-in-1 High Chair',
    description: 'Convertible high chair that grows with your baby. Easy to clean and foldable.',
    category: 'high-chair',
    dailyRate: 5,
    weeklyRate: 30,
    monthlyRate: 100,
    images: ['/highchair1.jpg'],
    location: 'Berkeley, CA',
    condition: 'good',
    available: true,
    minRentalDays: 3,
    maxRentalDays: 90,
    createdAt: new Date('2024-02-10'),
  },
  {
    id: '6',
    partnerId: 'p3',
    partnerName: 'Emily Davis',
    title: 'Nanit Plus Baby Monitor',
    description: 'Smart baby monitor with HD camera, breathing motion monitoring, and sleep tracking.',
    category: 'baby-monitor',
    dailyRate: 12,
    weeklyRate: 75,
    monthlyRate: 250,
    images: ['/monitor1.jpg'],
    location: 'Berkeley, CA',
    condition: 'excellent',
    available: true,
    minRentalDays: 7,
    maxRentalDays: 60,
    createdAt: new Date('2024-02-15'),
  },
];

let rentals: Rental[] = [];

export const dataStore = {
  getItems: () => mockItems,
  
  getItemById: (id: string) => mockItems.find(item => item.id === id),
  
  getItemsByPartner: (partnerId: string) => mockItems.filter(item => item.partnerId === partnerId),
  
  getItemsByCategory: (category: string) => mockItems.filter(item => item.category === category),
  
  addItem: (item: Omit<Item, 'id' | 'createdAt'>) => {
    const newItem: Item = {
      ...item,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
    };
    mockItems.push(newItem);
    return newItem;
  },
  
  updateItem: (id: string, updates: Partial<Item>) => {
    const index = mockItems.findIndex(item => item.id === id);
    if (index !== -1) {
      mockItems[index] = { ...mockItems[index], ...updates };
      return mockItems[index];
    }
    return null;
  },
  
  deleteItem: (id: string) => {
    const index = mockItems.findIndex(item => item.id === id);
    if (index !== -1) {
      mockItems.splice(index, 1);
      return true;
    }
    return false;
  },
  
  getRentals: () => rentals,
  
  getRentalsByCustomer: (customerId: string) => rentals.filter(r => r.customerId === customerId),
  
  getRentalsByPartner: (partnerId: string) => rentals.filter(r => r.partnerId === partnerId),
  
  addRental: (rental: Omit<Rental, 'id' | 'createdAt'>) => {
    const newRental: Rental = {
      ...rental,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
    };
    rentals.push(newRental);
    return newRental;
  },
  
  updateRental: (id: string, updates: Partial<Rental>) => {
    const index = rentals.findIndex(r => r.id === id);
    if (index !== -1) {
      rentals[index] = { ...rentals[index], ...updates };
      return rentals[index];
    }
    return null;
  },
};
