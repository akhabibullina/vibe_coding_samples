'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Navbar from '@/components/Navbar';
import { dataStore } from '@/lib/data';
import { Item } from '@/types';

export default function PartnerDashboard() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'partner') {
      router.push('/auth/partner');
      return;
    }
    setItems(dataStore.getItemsByPartner(user.id));
  }, [isAuthenticated, user, router]);

  const handleToggleAvailability = (itemId: string, currentStatus: boolean) => {
    dataStore.updateItem(itemId, { available: !currentStatus });
    setItems(items.map(item => 
      item.id === itemId ? { ...item, available: !currentStatus } : item
    ));
  };

  const handleDeleteItem = (itemId: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      dataStore.deleteItem(itemId);
      setItems(items.filter(item => item.id !== itemId));
    }
  };

  if (!isAuthenticated || user?.role !== 'partner') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Partner Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage your baby item listings</p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-green-500 text-white px-6 py-2 rounded-md font-medium hover:bg-green-600 transition-colors"
          >
            {showAddForm ? 'Cancel' : '+ Add New Item'}
          </button>
        </div>

        {showAddForm && <AddItemForm onItemAdded={() => {
          setItems(dataStore.getItemsByPartner(user.id));
          setShowAddForm(false);
        }} />}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Your Listings ({items.length})</h2>
          </div>
          
          {items.length === 0 ? (
            <div className="p-12 text-center">
              <span className="text-6xl mb-4 block">📦</span>
              <p className="text-gray-500 text-lg">No items listed yet</p>
              <p className="text-gray-400 mt-2">Add your first baby item to start earning</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {items.map(item => (
                <div key={item.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-4xl">👶</span>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                          <span className="text-sm text-blue-600 uppercase">{item.category.replace('-', ' ')}</span>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">{item.description}</p>
                      <div className="flex items-center gap-6 text-sm">
                        <div>
                          <span className="font-semibold text-gray-900">${item.dailyRate}</span>
                          <span className="text-gray-500">/day</span>
                        </div>
                        {item.weeklyRate && (
                          <div>
                            <span className="font-semibold text-gray-900">${item.weeklyRate}</span>
                            <span className="text-gray-500">/week</span>
                          </div>
                        )}
                        <div className="text-gray-500">
                          📍 {item.location}
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {item.available ? 'Available' : 'Unavailable'}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => handleToggleAvailability(item.id, item.available)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          item.available 
                            ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
                            : 'bg-green-500 text-white hover:bg-green-600'
                        }`}
                      >
                        {item.available ? 'Mark Unavailable' : 'Mark Available'}
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="px-4 py-2 rounded-md text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AddItemForm({ onItemAdded }: { onItemAdded: () => void }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'crib' as const,
    dailyRate: '',
    weeklyRate: '',
    monthlyRate: '',
    location: '',
    condition: 'excellent' as const,
    minRentalDays: '3',
    maxRentalDays: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const newItem = dataStore.addItem({
      partnerId: user.id,
      partnerName: user.name,
      title: formData.title,
      description: formData.description,
      category: formData.category,
      dailyRate: parseFloat(formData.dailyRate),
      weeklyRate: formData.weeklyRate ? parseFloat(formData.weeklyRate) : undefined,
      monthlyRate: formData.monthlyRate ? parseFloat(formData.monthlyRate) : undefined,
      images: [],
      location: formData.location,
      condition: formData.condition,
      available: true,
      minRentalDays: parseInt(formData.minRentalDays),
      maxRentalDays: formData.maxRentalDays ? parseInt(formData.maxRentalDays) : undefined,
    });

    onItemAdded();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Add New Item</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g., BabyBjorn Travel Crib"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="crib">Crib</option>
              <option value="breast-pump">Breast Pump</option>
              <option value="stroller">Stroller</option>
              <option value="car-seat">Car Seat</option>
              <option value="high-chair">High Chair</option>
              <option value="baby-monitor">Baby Monitor</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Describe the item, its features, and condition..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Daily Rate ($)</label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.dailyRate}
              onChange={(e) => setFormData({ ...formData, dailyRate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Weekly Rate ($)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.weeklyRate}
              onChange={(e) => setFormData({ ...formData, weeklyRate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Rate ($)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.monthlyRate}
              onChange={(e) => setFormData({ ...formData, monthlyRate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <input
              type="text"
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g., San Francisco, CA"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Condition</label>
            <select
              value={formData.condition}
              onChange={(e) => setFormData({ ...formData, condition: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Min Rental Days</label>
            <input
              type="number"
              required
              min="1"
              value={formData.minRentalDays}
              onChange={(e) => setFormData({ ...formData, minRentalDays: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Max Rental Days (optional)</label>
          <input
            type="number"
            min="1"
            value={formData.maxRentalDays}
            onChange={(e) => setFormData({ ...formData, maxRentalDays: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            className="bg-green-500 text-white px-6 py-2 rounded-md font-medium hover:bg-green-600 transition-colors"
          >
            Add Item
          </button>
          <button
            type="button"
            onClick={() => onItemAdded()}
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md font-medium hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
