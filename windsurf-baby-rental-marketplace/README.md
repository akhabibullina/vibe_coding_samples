# BabyRent - Baby Item Marketplace

A marketplace app where customers can rent baby items and partners can post items for rent. This helps parents save costs, try different items before buying, and reduce waste.

## Features

### For Customers
- Browse baby items by category (cribs, breast pumps, strollers, car seats, high chairs, baby monitors)
- View item details including condition, location, and pricing
- Book items for rent with flexible date selection
- View and manage rental history
- Cancel pending rentals

### For Partners
- Post baby items for rent with detailed descriptions
- Set daily, weekly, and monthly rental rates
- Manage item availability
- View and delete listings
- Track rental requests

## Tech Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **TailwindCSS** - Modern utility-first CSS framework
- **React Context** - State management for authentication

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm, yarn, pnpm, or bun package manager

### Installation

1. Navigate to the project directory:
```bash
cd baby-rental-marketplace
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── app/
│   ├── auth/
│   │   ├── customer/    # Customer login page
│   │   └── partner/     # Partner login page
│   ├── customer/
│   │   └── rentals/     # Customer rental history
│   ├── partner/
│   │   └── dashboard/   # Partner dashboard for managing items
│   ├── item/
│   │   └── [id]/        # Item detail and booking page
│   ├── layout.tsx       # Root layout with auth provider
│   └── page.tsx         # Home marketplace page
├── components/
│   └── Navbar.tsx       # Navigation component
├── lib/
│   ├── auth-context.tsx # Authentication context
│   └── data.ts          # Mock data store
└── types/
    └── index.ts         # TypeScript type definitions
```

## Data Model

### User
- id, email, name, role (customer/partner), phone, location

### Item
- id, partnerId, partnerName, title, description, category, dailyRate, weeklyRate, monthlyRate, images, location, condition, available, minRentalDays, maxRentalDays, createdAt

### Rental
- id, itemId, customerId, customerName, partnerId, startDate, endDate, totalAmount, status (pending/confirmed/active/completed/cancelled), createdAt

## Current Implementation Notes

This is a prototype/demo application with:
- Client-side authentication using React Context and localStorage
- In-memory data store with mock data
- No real database or backend API
- No payment processing
- No real-time notifications

## Future Enhancements

- Backend API with real database (PostgreSQL, MongoDB)
- User authentication with JWT or OAuth
- Payment integration (Stripe)
- Real-time notifications
- Image upload for items
- Reviews and ratings system
- Advanced search and filters
- Insurance coverage options
- Delivery/pickup scheduling

## Building for Production

```bash
npm run build
npm start
```

## Deploy on Vercel

The easiest way to deploy is using the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
