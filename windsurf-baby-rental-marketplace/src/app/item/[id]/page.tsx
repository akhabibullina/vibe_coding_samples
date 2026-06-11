'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Navbar from '@/components/Navbar';
import { dataStore } from '@/lib/data';
import { Item } from '@/types';

export default function ItemDetail() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [item, setItem] = useState<Item | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalCost, setTotalCost] = useState(0);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    const itemId = params.id as string;
    const foundItem = dataStore.getItemById(itemId);
    setItem(foundItem || null);
  }, [params.id]);

  useEffect(() => {
    if (item && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      
      if (days > 0) {
        let cost = 0;
        if (days >= 30 && item.monthlyRate) {
          const months = Math.ceil(days / 30);
          cost = months * item.monthlyRate;
        } else if (days >= 7 && item.weeklyRate) {
          const weeks = Math.ceil(days / 7);
          cost = weeks * item.weeklyRate;
        } else {
          cost = days * item.dailyRate;
        }
        setTotalCost(cost);
      } else {
        setTotalCost(0);
      }
    }
  }, [item, startDate, endDate]);

  const handleBookNow = () => {
    if (!isAuthenticated) {
      router.push('/auth/customer');
      return;
    }

    if (!item || !user || !startDate || !endDate) {
      alert('Please fill in all required fields');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    if (days < item.minRentalDays) {
      alert(`Minimum rental period is ${item.minRentalDays} days`);
      return;
    }

    if (item.maxRentalDays && days > item.maxRentalDays) {
      alert(`Maximum rental period is ${item.maxRentalDays} days`);
      return;
    }

    dataStore.addRental({
      itemId: item.id,
      customerId: user.id,
      customerName: user.name,
      partnerId: item.partnerId,
      startDate: start,
      endDate: end,
      totalAmount: totalCost,
      status: 'pending',
    });

    setBookingSuccess(true);
  };

  if (!item) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-gray-500">Item not found</p>
        </div>
      </div>
    );
  }

  if (bookingSuccess) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-md mx-auto mt-16 px-4">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <span className="text-6xl mb-4 block">✅</span>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Request Sent!</h1>
            <p className="text-gray-600 mb-6">Your rental request has been sent to the partner. They will confirm your booking soon.</p>
            <button
              onClick={() => router.push('/customer/rentals')}
              className="bg-blue-500 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-600 transition-colors"
            >
              View My Rentals
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.push('/')}
          className="text-blue-600 hover:text-blue-800 mb-6 inline-block"
        >
          ← Back to Marketplace
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="h-80 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                <span className="text-8xl">👶</span>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-blue-600 uppercase">
                    {item.category.replace('-', ' ')}
                  </span>
                  <span className={`text-sm px-3 py-1 rounded-full ${
                    item.condition === 'excellent' ? 'bg-green-100 text-green-800' :
                    item.condition === 'good' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {item.condition}
                  </span>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{item.title}</h1>
                <p className="text-gray-600 mb-6">{item.description}</p>
                
                <div className="border-t border-gray-200 pt-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">👤</span>
                    <div>
                      <p className="font-semibold text-gray-900">{item.partnerName}</p>
                      <p className="text-sm text-gray-500">Partner</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📍</span>
                    <p className="text-gray-700">{item.location}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📅</span>
                    <div>
                      <p className="text-gray-700">Min rental: {item.minRentalDays} days</p>
                      {item.maxRentalDays && <p className="text-gray-500">Max rental: {item.maxRentalDays} days</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Book This Item</h2>
              
              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-3xl font-bold text-gray-900">${item.dailyRate}</p>
                  <p className="text-gray-500">per day</p>
                </div>
                {item.weeklyRate && (
                  <div className="text-gray-600">
                    <span className="font-semibold">${item.weeklyRate}</span> / week
                  </div>
                )}
                {item.monthlyRate && (
                  <div className="text-gray-600">
                    <span className="font-semibold">${item.monthlyRate}</span> / month
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {totalCost > 0 && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Total Cost</span>
                    <span className="text-2xl font-bold text-blue-600">${totalCost}</span>
                  </div>
                </div>
              )}

              <button
                onClick={handleBookNow}
                disabled={!startDate || !endDate || totalCost === 0}
                className="w-full mt-6 bg-blue-500 text-white py-3 rounded-md font-medium hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isAuthenticated ? 'Book Now' : 'Sign In to Book'}
              </button>

              <p className="mt-4 text-sm text-gray-500 text-center">
                Your booking request will be sent to the partner for confirmation
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
