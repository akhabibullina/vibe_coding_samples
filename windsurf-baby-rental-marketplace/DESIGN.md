# BabyRent - Design Document

## 1. System Architecture

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   Customer   │  │   Partner    │  │    Admin     │        │
│  │   Interface  │  │   Interface  │  │   Interface  │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Application Layer                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   Next.js    │  │   React      │  │   Context    │        │
│  │   App Router │  │ Components  │  │   State      │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Data Layer                                │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   In-Memory  │  │  LocalStorage│  │   Future:    │        │
│  │   Data Store │  │   (Auth)     │  │   Database   │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Component Architecture

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout with AuthProvider
│   ├── page.tsx                 # Home/marketplace page
│   ├── auth/
│   │   ├── customer/page.tsx    # Customer login
│   │   └── partner/page.tsx     # Partner login
│   ├── customer/
│   │   └── rentals/page.tsx     # Customer rental history
│   ├── partner/
│   │   └── dashboard/page.tsx   # Partner item management
│   └── item/
│       └── [id]/page.tsx        # Item details & booking
├── components/
│   └── Navbar.tsx               # Navigation component
├── lib/
│   ├── auth-context.tsx         # Authentication context
│   └── data.ts                  # Data store & operations
└── types/
    └── index.ts                 # TypeScript type definitions
```

## 2. Data Flow Diagrams

### 2.1 Customer Booking Flow

```
Customer                    App                    Data Store
   │                         │                         │
   ├─ Browse Items ─────────┤                         │
   │                         ├─ Get Items ────────────┤
   │                         │◄─ Return Items ───────┤
   │◄─ Display Items ────────┤                         │
   │                         │                         │
   ├─ View Item Details ─────┤                         │
   │                         ├─ Get Item by ID ───────┤
   │                         │◄─ Return Item ─────────┤
   │◄─ Display Details ──────┤                         │
   │                         │                         │
   ├─ Select Dates ──────────┤                         │
   │                         ├─ Calculate Cost ───────┤
   │                         │◄─ Return Cost ─────────┤
   │◄─ Display Cost ─────────┤                         │
   │                         │                         │
   ├─ Book Item ─────────────┤                         │
   │                         ├─ Validate Auth ─────────┤
   │                         │◄─ Auth Status ─────────┤
   │                         ├─ Add Rental ───────────┤
   │                         │◄─ Success ─────────────┤
   │◄─ Booking Confirmed───┤                         │
```

### 2.2 Partner Item Management Flow

```
Partner                      App                    Data Store
   │                         │                         │
   ├─ View Dashboard ────────┤                         │
   │                         ├─ Get Partner Items ─────┤
   │                         │◄─ Return Items ─────────┤
   │◄─ Display Items ────────┤                         │
   │                         │                         │
   ├─ Add New Item ──────────┤                         │
   │                         ├─ Validate Form ─────────┤
   │                         ├─ Add Item ─────────────┤
   │                         │◄─ Success ─────────────┤
   │◄─ Item Added ───────────┤                         │
   │                         │                         │
   ├─ Toggle Availability ───┤                         │
   │                         ├─ Update Item ───────────┤
   │                         │◄─ Success ─────────────┤
   │◄─ Status Updated ───────┤                         │
   │                         │                         │
   ├─ Delete Item ───────────┤                         │
   │                         ├─ Check Active Rentals ──┤
   │                         │◄─ No Active Rentals ────┤
   │                         ├─ Delete Item ───────────┤
   │                         │◄─ Success ─────────────┤
   │◄─ Item Deleted ─────────┤                         │
```

## 3. Database Schema Design

### 3.1 Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    User     │       │    Item     │       │   Rental    │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │       │ id (PK)     │       │ id (PK)     │
│ email       │       │ partnerId   │───────│ partnerId   │
│ name        │       │ partnerName │       │ itemId      │───────┐
│ role        │       │ title       │       │ customerId  │       │
│ phone       │       │ description │       │ customerName│       │
│ location    │       │ category    │       │ startDate   │       │
│ createdAt   │       │ dailyRate   │       │ endDate     │       │
└─────────────┘       │ weeklyRate  │       │ totalAmount │       │
       │              │ monthlyRate │       │ status      │       │
       │              │ location    │       │ createdAt   │       │
       │              │ condition   │       └─────────────┘       │
       │              │ available   │                             │
       │              │ minRental   │                             │
       │              │ maxRental   │                             │
       │              │ images      │                             │
       │              │ createdAt   │                             │
       │              └─────────────┘                             │
       │                                                     │
       └─────────────────────────────────────────────────────┘
```

### 3.2 Table Definitions

#### Users Table
```sql
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role ENUM('customer', 'partner') NOT NULL,
  phone VARCHAR(20),
  location VARCHAR(255),
  password_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

#### Items Table
```sql
CREATE TABLE items (
  id VARCHAR(36) PRIMARY KEY,
  partner_id VARCHAR(36) NOT NULL,
  partner_name VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category ENUM('crib', 'breast-pump', 'stroller', 'car-seat', 'high-chair', 'baby-monitor', 'other') NOT NULL,
  daily_rate DECIMAL(10,2) NOT NULL,
  weekly_rate DECIMAL(10,2),
  monthly_rate DECIMAL(10,2),
  location VARCHAR(255) NOT NULL,
  condition ENUM('excellent', 'good', 'fair') NOT NULL,
  available BOOLEAN DEFAULT TRUE,
  min_rental_days INT NOT NULL,
  max_rental_days INT,
  images JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (partner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_items_partner ON items(partner_id);
CREATE INDEX idx_items_category ON items(category);
CREATE INDEX idx_items_available ON items(available);
CREATE INDEX idx_items_location ON items(location);
```

#### Rentals Table
```sql
CREATE TABLE rentals (
  id VARCHAR(36) PRIMARY KEY,
  item_id VARCHAR(36) NOT NULL,
  customer_id VARCHAR(36) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  partner_id VARCHAR(36) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status ENUM('pending', 'confirmed', 'active', 'completed', 'cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE RESTRICT,
  FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (partner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx rentals_customer ON rentals(customer_id);
CREATE INDEX idx rentals_partner ON rentals(partner_id);
CREATE INDEX idx rentals_item ON rentals(item_id);
CREATE INDEX idx rentals_status ON rentals(status);
CREATE INDEX idx rentals_dates ON rentals(start_date, end_date);
```

## 4. API Design (Future Backend)

### 4.1 REST API Endpoints

#### Authentication
```
POST   /api/auth/register      - Register new user
POST   /api/auth/login         - Login user
POST   /api/auth/logout        - Logout user
POST   /api/auth/refresh       - Refresh access token
POST   /api/auth/forgot-password - Request password reset
POST   /api/auth/reset-password - Reset password
```

#### Users
```
GET    /api/users/me           - Get current user profile
PUT    /api/users/me           - Update current user profile
GET    /api/users/:id          - Get user by ID (public profile)
```

#### Items
```
GET    /api/items              - List all items (with filters)
GET    /api/items/:id          - Get item by ID
POST   /api/items              - Create new item (partner only)
PUT    /api/items/:id          - Update item (partner only)
DELETE /api/items/:id          - Delete item (partner only)
PATCH  /api/items/:id/availability - Toggle availability (partner only)
GET    /api/partners/:id/items - Get items by partner
```

#### Rentals
```
GET    /api/rentals            - List rentals (filtered by user role)
GET    /api/rentals/:id        - Get rental by ID
POST   /api/rentals           - Create rental request
PUT    /api/rentals/:id/status - Update rental status
DELETE /api/rentals/:id        - Cancel rental
GET    /api/items/:id/rentals  - Get rentals for item
GET    /api/users/:id/rentals  - Get rentals for user
```

#### Search
```
GET    /api/search/items       - Search items with filters
GET    /api/search/partners    - Search partners
```

### 4.2 Request/Response Examples

#### Create Item
```json
POST /api/items
Authorization: Bearer <token>

Request:
{
  "title": "BabyBjorn Travel Crib Light",
  "description": "Lightweight and easy to set up travel crib",
  "category": "crib",
  "dailyRate": 15,
  "weeklyRate": 90,
  "monthlyRate": 300,
  "location": "San Francisco, CA",
  "condition": "excellent",
  "minRentalDays": 3,
  "maxRentalDays": 30,
  "images": ["url1.jpg", "url2.jpg"]
}

Response:
{
  "id": "abc123",
  "partnerId": "partner123",
  "title": "BabyBjorn Travel Crib Light",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

#### Create Rental
```json
POST /api/rentals
Authorization: Bearer <token>

Request:
{
  "itemId": "abc123",
  "startDate": "2024-02-01",
  "endDate": "2024-02-15"
}

Response:
{
  "id": "rental123",
  "itemId": "abc123",
  "customerId": "customer456",
  "startDate": "2024-02-01",
  "endDate": "2024-02-15",
  "totalAmount": 210.00,
  "status": "pending",
  "createdAt": "2024-01-20T15:30:00Z"
}
```

## 5. State Management

### 5.1 Authentication State

```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, role: UserRole) => void;
  logout: () => void;
}
```

### 5.2 Data Store State

```typescript
interface DataStore {
  items: Item[];
  rentals: Rental[];
  getItems(): Item[];
  getItemById(id: string): Item | undefined;
  addItem(item: Omit<Item, 'id' | 'createdAt'>): Item;
  updateItem(id: string, updates: Partial<Item>): Item | null;
  deleteItem(id: string): boolean;
  addRental(rental: Omit<Rental, 'id' | 'createdAt'>): Rental;
  updateRental(id: string, updates: Partial<Rental>): Rental | null;
}
```

## 6. Security Design

### 6.1 Authentication Flow

```
Client                    Server                    Database
   │                         │                         │
   ├─ Login Request ────────┤                         │
   │  {email, password}      │                         │
   │                         ├─ Validate Credentials ──┤
   │                         │◄─ User Data ────────────┤
   │                         ├─ Generate JWT Token     │
   │◄─ Access Token ─────────┤                         │
   │  {token, user}          │                         │
   │                         │                         │
   ├─ Protected Request ─────┤                         │
   │  Authorization: Bearer  │                         │
   │                         ├─ Verify Token           │
   │                         ├─ Extract User ID        │
   │                         ├─ Get User Data ─────────┤
   │                         │◄─ User Data ────────────┤
   │◄─ Response ─────────────┤                         │
```

### 6.2 Authorization Matrix

| Resource        | Customer | Partner | Admin |
|-----------------|----------|---------|-------|
| Browse Items    | ✓        | ✓       | ✓     |
| View Item       | ✓        | ✓       | ✓     |
| Book Item       | ✓        | ✗       | ✗     |
| Add Item        | ✗        | ✓       | ✓     |
| Edit Item       | ✗        | ✓*      | ✓     |
| Delete Item     | ✗        | ✓*      | ✓     |
| View Rentals    | ✓*       | ✓*      | ✓     |
| Cancel Rental   | ✓*       | ✓*      | ✓     |

* = Own resources only

## 7. UI/UX Design

### 7.1 Page Hierarchy

```
Home (Marketplace)
├── Auth
│   ├── Customer Login
│   └── Partner Login
├── Customer
│   └── My Rentals
├── Partner
│   └── Dashboard
│       ├── My Items
│       └── Add Item Form
└── Item
    └── [id] (Item Details)
        └── Booking Form
```

### 7.2 Color Scheme

- Primary Blue: `#3B82F6` (Actions, Links)
- Success Green: `#10B981` (Success states)
- Warning Yellow: `#F59E0B` (Warnings)
- Error Red: `#EF4444` (Errors, Delete)
- Neutral Gray: `#6B7280` (Secondary text)
- Background: `#F9FAFB` (Light gray)

### 7.3 Component Design Patterns

**Card Component**
```
┌─────────────────────────┐
│  [Image/Icon]          │
│  Category Badge        │
│  Title                 │
│  Description           │
│  Price                 │
│  Location              │
│  [View Details Button] │
└─────────────────────────┘
```

**Form Component**
```
┌─────────────────────────┐
│  Label                 │
│  [Input Field]         │
│  Label                 │
│  [Input Field]         │
│  [Submit Button]       │
└─────────────────────────┘
```

## 8. Performance Optimization

### 8.1 Caching Strategy

- **Static Assets:** CDN caching
- **API Responses:** Redis caching (future)
- **Item Listings:** Client-side pagination
- **User Sessions:** JWT tokens with short expiry

### 8.2 Lazy Loading

- Route-based code splitting (Next.js automatic)
- Image lazy loading
- Component lazy loading for large lists

### 8.3 Database Optimization

- Indexes on frequently queried fields
- Query optimization with proper joins
- Connection pooling
- Read replicas for scaling (future)

## 9. Deployment Architecture

### 9.1 Current Deployment (Vercel)

```
┌─────────────┐
│   Vercel    │
│  (Next.js)  │
└─────────────┘
      │
      ▼
┌─────────────┐
│  Browser    │
└─────────────┘
```

### 9.2 Future Production Architecture

```
                    ┌─────────────┐
                    │   CDN       │
                    │  (Cloudflare)│
                    └─────────────┘
                           │
                           ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Load      │────│   Next.js   │────│  Database   │
│  Balancer   │    │  (Multiple)│    │ (PostgreSQL)│
└─────────────┘    └─────────────┘    └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │    Redis    │
                    │   (Cache)   │
                    └─────────────┘
```

## 10. Testing Strategy

### 10.1 Unit Tests
- Component testing with React Testing Library
- Utility function testing
- Data store operations testing

### 10.2 Integration Tests
- API endpoint testing
- Database operation testing
- Authentication flow testing

### 10.3 E2E Tests
- User journey testing (Playwright)
- Cross-browser testing
- Mobile responsiveness testing

## 11. Monitoring & Logging

### 11.1 Metrics to Track
- Page load times
- API response times
- Error rates
- User engagement
- Conversion rates

### 11.2 Logging
- User actions
- API requests/responses
- Errors and exceptions
- System events

## 12. Future Technology Considerations

### 12.1 Backend Framework Options
- Node.js with Express/Fastify
- Python with Django/FastAPI
- Go with Gin/Echo

### 12.2 Database Options
- PostgreSQL (Relational)
- MongoDB (Document)
- Supabase (Managed PostgreSQL)

### 12.3 Real-time Features
- WebSockets (Socket.io)
- Server-Sent Events
- Push notifications (Firebase)

### 12.4 File Storage
- AWS S3
- Cloudinary
- Firebase Storage
