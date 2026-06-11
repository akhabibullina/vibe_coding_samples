'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Navbar from '@/components/Navbar';

export default function PartnerAuth() {
  const [email, setEmail] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      login(email, 'partner');
      router.push('/partner/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-md mx-auto mt-16 px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <span className="text-5xl">🏪</span>
            <h1 className="text-2xl font-bold text-gray-900 mt-4">Become a Partner</h1>
            <p className="text-gray-600 mt-2">Share your baby items and earn money</p>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="you@example.com"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-green-500 text-white py-3 rounded-md font-medium hover:bg-green-600 transition-colors"
            >
              Continue as Partner
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>By continuing, you agree to our Partner Terms of Service</p>
          </div>
        </div>

        <div className="mt-8 bg-green-50 rounded-lg p-6">
          <h2 className="font-semibold text-gray-900 mb-2">Why Become a Partner?</h2>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>💵 Earn passive income from unused items</li>
            <li>🌱 Help reduce waste and support families</li>
            <li>📈 Flexible - list items when available</li>
            <li>🛡️ Insurance coverage for your items</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
