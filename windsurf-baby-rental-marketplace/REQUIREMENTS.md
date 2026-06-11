# BabyRent - Requirements Document

## 1. Project Overview

**Project Name:** BabyRent - Baby Item Marketplace  
**Purpose:** A marketplace platform where customers can rent baby items and partners can post items for rent, helping parents save costs, try different items before purchasing, and reduce waste.

## 2. User Roles

### 2.1 Customer
- Parents or caregivers looking to rent baby items temporarily
- Can browse, search, and book items
- Manages their rental history and bookings

### 2.2 Partner
- Individuals or businesses that own baby items available for rent
- Can list items, manage availability, and track rental requests
- Earns income from renting out their items

## 3. Functional Requirements

### 3.1 Authentication & Authorization

**FR-1 User Registration**
- Customers can register with email and basic information
- Partners can register with additional business information
- Email verification (future enhancement)

**FR-2 User Login**
- Users can log in with email and password
- Session management with secure tokens
- Password reset functionality (future enhancement)

**FR-3 Role-Based Access Control**
- Customers can only access customer-specific features
- Partners can only access partner-specific features
- Admin role for platform management (future enhancement)

### 3.2 Item Management (Partner)

**FR-4 Item Listing**
- Partners can create item listings with:
  - Title and description
  - Category selection
  - Daily, weekly, and monthly pricing
  - Item condition rating
  - Location
  - Minimum and maximum rental duration
  - Product images

**FR-5 Item Editing**
- Partners can edit item details
- Partners can update pricing
- Partners can change item availability status

**FR-6 Item Deletion**
- Partners can delete their listings
- System checks for active rentals before deletion

**FR-7 Availability Management**
- Partners can mark items as available/unavailable
- Calendar view for availability scheduling (future enhancement)

### 3.3 Marketplace Browsing (Customer)

**FR-8 Item Search**
- Customers can search items by keyword
- Filter by category, price range, location, condition
- Sort by price, popularity, rating (future enhancement)

**FR-9 Category Filtering**
- Browse items by predefined categories:
  - Cribs
  - Breast Pumps
  - Strollers
  - Car Seats
  - High Chairs
  - Baby Monitors
  - Other

**FR-10 Item Details View**
- View complete item information
- See partner profile and ratings (future enhancement)
- View item condition and photos
- See rental history and reviews (future enhancement)

### 3.4 Rental Booking System

**FR-11 Date Selection**
- Customers select start and end dates
- System validates date range against item constraints
- Shows availability calendar (future enhancement)

**FR-12 Price Calculation**
- Automatic cost calculation based on duration
- Applies appropriate rate (daily/weekly/monthly)
- Shows total cost before booking

**FR-13 Booking Creation**
- Customers submit booking requests
- System validates all required fields
- Creates pending rental record

**FR-14 Booking Confirmation**
- Partners receive booking requests
- Partners can confirm or reject requests
- Customers receive notification of status

**FR-15 Rental Status Management**
- Status transitions: pending → confirmed → active → completed
- Cancellation option for pending/confirmed rentals
- Automatic status updates based on dates (future enhancement)

### 3.5 Rental Management

**FR-16 Customer Rental History**
- Customers view all their rentals
- Filter by status (active, completed, cancelled)
- View rental details and receipts

**FR-17 Partner Rental Tracking**
- Partners view all rental requests for their items
- Track rental status and revenue
- View customer information (future enhancement)

**FR-18 Cancellation**
- Customers can cancel pending/confirmed rentals
- Partners can cancel confirmed rentals
- Refund policy enforcement (future enhancement)

### 3.6 User Profile

**FR-19 Profile Management**
- Users can update personal information
- Users can change password
- Partners can update business information

**FR-20 Communication**
- In-app messaging between customers and partners (future enhancement)
- Email notifications for booking updates (future enhancement)

## 4. Non-Functional Requirements

### 4.1 Performance
- **NFR-1:** Page load time < 2 seconds
- **NFR-2:** Search results returned within 1 second
- **NFR-3:** Support 1000 concurrent users (future)

### 4.2 Security
- **NFR-4:** All user data encrypted at rest
- **NFR-5:** HTTPS/TLS for all communications
- **NFR-6:** Secure password hashing (bcrypt)
- **NFR-7:** Protection against SQL injection, XSS, CSRF

### 4.3 Reliability
- **NFR-8:** 99.5% uptime target
- **NFR-9:** Regular data backups
- **NFR-10:** Graceful error handling

### 4.4 Scalability
- **NFR-11:** Horizontal scaling capability
- **NFR-12:** Database sharding support (future)
- **NFR-13:** CDN for static assets (future)

### 4.5 Usability
- **NFR-14:** Mobile-responsive design
- **NFR-15:** Intuitive navigation
- **NFR-16:** Accessibility compliance (WCAG 2.1 AA)

### 4.6 Compatibility
- **NFR-17:** Support modern browsers (Chrome, Firefox, Safari, Edge)
- **NFR-18:** iOS and Android mobile support

## 5. Data Requirements

### 5.1 User Data
- Email, name, phone, location
- Password hash
- Role (customer/partner)
- Profile picture (future)

### 5.2 Item Data
- Title, description, category
- Pricing (daily/weekly/monthly)
- Condition rating
- Location
- Availability status
- Rental constraints
- Images

### 5.3 Rental Data
- Item ID, customer ID, partner ID
- Start and end dates
- Total amount
- Status
- Timestamps

## 6. Business Rules

**BR-1:** Minimum rental duration must be respected
**BR-2:** Maximum rental duration must be respected (if set)
**BR-3:** Items cannot be booked when marked unavailable
**BR-4:** Partners cannot delete items with active rentals
**BR-5:** Cancellation policy applies based on timing (future)
**BR-6:** Revenue sharing with platform (future)

## 7. Future Enhancements

### Phase 2 Features
- Real database integration (PostgreSQL/MongoDB)
- Payment processing (Stripe)
- Image upload and storage
- Reviews and ratings system
- Advanced search and filters
- Real-time notifications
- In-app messaging
- Delivery/pickup scheduling
- Insurance coverage options

### Phase 3 Features
- Mobile apps (iOS/Android)
- Geographic location search
- Dynamic pricing
- Subscription plans for partners
- Analytics dashboard
- Partner verification program
- Customer loyalty program

## 8. Constraints

- Budget constraints for initial development
- Timeline for MVP delivery
- Regulatory compliance (future)
- Insurance requirements (future)

## 9. Assumptions

- Users have internet access
- Users have compatible devices
- Partners are responsible for item maintenance
- Customers return items in good condition
- Platform acts as intermediary, not owner of items

## 10. Success Metrics

- Number of registered users
- Number of active listings
- Number of successful rentals
- Customer satisfaction ratings
- Partner earnings
- Platform revenue
- User retention rate
