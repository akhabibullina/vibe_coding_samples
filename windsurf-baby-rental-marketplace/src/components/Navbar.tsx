'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl">👶</span>
              <span className="text-xl font-bold text-gray-900">BabyRent</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
              Marketplace
            </Link>
            
            {isAuthenticated && user?.role === 'partner' && (
              <Link href="/partner/dashboard" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Partner Dashboard
              </Link>
            )}
            
            {isAuthenticated && user?.role === 'customer' && (
              <Link href="/customer/rentals" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                My Rentals
              </Link>
            )}
            
            {isAuthenticated ? (
              <>
                <span className="text-gray-500 text-sm">Welcome, {user?.name}</span>
                <button
                  onClick={logout}
                  className="bg-red-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-600"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/customer" className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-600">
                  Rent Items
                </Link>
                <Link href="/auth/partner" className="bg-green-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-600">
                  Become a Partner
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
