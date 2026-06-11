'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Navbar from '@/components/Navbar';
import { dataStore } from '@/lib/data';
import { Rental } from '@/types';

export default function CustomerRentals() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [rentals, setRentals] = useState<Rental[]>([]);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'customer') {
      router.push('/auth/customer');
      return;
    }
    setRentals(dataStore.getRentalsByCustomer(user.id));
  }, [isAuthenticated, user, router]);

  const handleCancelRental = (rentalId: string) => {
    if (confirm('Are you sure you want to cancel this rental?')) {
      dataStore.updateRental(rentalId, { status: 'cancelled' });
      setRentals(rentals.map(r => 
        r.id === rentalId ? { ...r, status: 'cancelled' } : r
      ));
    }
  };

  if (!isAuthenticated || user?.role !== 'customer') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Rentals</h1>
          <p className="text-gray-600 mt-1">View and manage your baby item rentals</p>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {rentals.length === 0 ? (
            <div className="p-12 text-center">
              <span className="text-6xl mb-4 block">📦</span>
              <p className="text-gray-500 text-lg">No rentals yet</p>
              <p className="text-gray-400 mt-2">Start browsing the marketplace to rent baby items</p>
              <button
                onClick={() => router.push('/')}
                className="mt-4 bg-blue-500 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-600 transition-colors"
              >
                Browse Items
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {rentals.map(rental => {
                const item = dataStore.getItemById(rental.itemId);
                if (!item) return null;

                const startDate = new Date(rental.startDate);
                const endDate = new Date(rental.endDate);
                const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

                return (
                  <div key={rental.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-4xl">👶</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{item.partnerName}</p>
                          <div className="mt-2 text-sm text-gray-500">
                            <p>📅 {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()} ({days} days)</p>
                            <p>📍 {item.location}</p>
                          </div>
                          <div className="mt-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              rental.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                              rental.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              rental.status === 'active' ? 'bg-blue-100 text-blue-800' :
                              rental.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {rental.status.charAt(0).toUpperCase() + rental.status.slice(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">${rental.totalAmount}</p>
                        <p className="text-sm text-gray-500">Total</p>
                        {(rental.status === 'pending' || rental.status === 'confirmed') && (
                          <button
                            onClick={() => handleCancelRental(rental.id)}
                            className="mt-2 text-sm text-red-600 hover:text-red-800"
                          >
                            Cancel Rental
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
