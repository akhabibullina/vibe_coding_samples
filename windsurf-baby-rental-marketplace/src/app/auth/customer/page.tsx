'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Navbar from '@/components/Navbar';

export default function CustomerAuth() {
  const [email, setEmail] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      login(email, 'customer');
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-md mx-auto mt-16 px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <span className="text-5xl">👶</span>
            <h1 className="text-2xl font-bold text-gray-900 mt-4">Rent Baby Items</h1>
            <p className="text-gray-600 mt-2">Sign in to start renting quality baby items</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="you@example.com"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-3 rounded-md font-medium hover:bg-blue-600 transition-colors"
            >
              Continue as Customer
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>By continuing, you agree to our Terms of Service</p>
          </div>
        </div>

        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h2 className="font-semibold text-gray-900 mb-2">Why Rent Baby Items?</h2>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>💰 Save money - try before you buy</li>
            <li>🌱 Reduce waste - reuse quality items</li>
            <li>🔄 Flexibility - rent for as long as you need</li>
            <li>✅ Quality assurance - all items inspected</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
