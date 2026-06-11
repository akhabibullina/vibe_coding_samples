'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { dataStore } from '@/lib/data';
import { Item } from '@/types';

export default function Home() {
  const [items] = useState<Item[]>(dataStore.getItems());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { value: 'all', label: 'All Items' },
    { value: 'crib', label: 'Cribs' },
    { value: 'breast-pump', label: 'Breast Pumps' },
    { value: 'stroller', label: 'Strollers' },
    { value: 'car-seat', label: 'Car Seats' },
    { value: 'high-chair', label: 'High Chairs' },
    { value: 'baby-monitor', label: 'Baby Monitors' },
  ];

  const filteredItems = selectedCategory === 'all' 
    ? items 
    : items.filter(item => item.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Rent Baby Items, Save Money, Reduce Waste
          </h1>
          <p className="text-xl text-gray-600">
            Try before you buy. Rent quality baby items from trusted partners in your area.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {categories.map(category => (
            <button
              key={category.value}
              onClick={() => setSelectedCategory(category.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category.value
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(item => (
            <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                <span className="text-6xl">👶</span>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-blue-600 uppercase">
                    {item.category.replace('-', ' ')}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    item.condition === 'excellent' ? 'bg-green-100 text-green-800' :
                    item.condition === 'good' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {item.condition}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-2xl font-bold text-gray-900">${item.dailyRate}</span>
                    <span className="text-gray-500 text-sm">/day</span>
                  </div>
                  {item.weeklyRate && (
                    <div className="text-right">
                      <span className="text-sm text-gray-500">${item.weeklyRate}/week</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>📍 {item.location}</span>
                  <span>👤 {item.partnerName}</span>
                </div>
                <button 
                  onClick={() => window.location.href = `/item/${item.id}`}
                  className="w-full bg-blue-500 text-white py-2 rounded-md font-medium hover:bg-blue-600 transition-colors"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No items found in this category.</p>
          </div>
        )}
      </main>
    </div>
  );
}
