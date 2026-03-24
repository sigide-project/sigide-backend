# Sigide Backend

Backend API for Sigide - a lost & found platform.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL with PostGIS extension
- **ORM**: Sequelize
- **Cache**: Redis
- **Auth**: JWT (jsonwebtoken)
- **File Upload**: Multer + AWS S3
- **Testing**: Mocha + Chai + Supertest

## Prerequisites

- Node.js 18+
- PostgreSQL 14+ with PostGIS extension
- Redis (optional, for caching)

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Create databases**:
   ```sql
   CREATE DATABASE sigide_dev;
   CREATE DATABASE sigide_test;
   
   -- Enable PostGIS extension in each database
   \c sigide_dev
   CREATE EXTENSION IF NOT EXISTS postgis;
   
   \c sigide_test
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```

4. **Run migrations**:
   ```bash
   npm run migrate
   ```

5. **Start the server**:
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## Testing

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration
```

## API Endpoints

### Items

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/items` | No | List items with optional geo-filtering |
| GET | `/api/items/:id` | No | Get single item |
| GET | `/api/items/me` | Yes | List current user's items |
| POST | `/api/items` | Yes | Create new item |
| PUT | `/api/items/:id` | Yes | Update item |
| PATCH | `/api/items/:id/resolve` | Yes | Mark item as resolved |
| DELETE | `/api/items/:id` | Yes | Soft delete item |

### Query Parameters for GET /api/items

- `lat` - Latitude for geo search
- `lng` - Longitude for geo search
- `radius` - Search radius in kilometers (requires lat/lng)
- `type` - Filter by `lost` or `found`
- `category` - Filter by category
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)

## Project Structure

```
src/
├── config/         # Configuration files
├── controllers/    # Request/response handling
├── db/
│   ├── migrations/ # Database migrations
│   └── seeds/      # Seed data
├── middlewares/    # Auth, validation, uploads
├── models/         # Sequelize models
├── routes/         # Route definitions
├── services/       # Business logic
└── index.js        # App entry point

tests/
├── integration/    # Supertest route tests
├── unit/           # Service-level tests
├── helpers.js      # Test utilities
└── setup.js        # Test configuration
```

## Models

- **User** - Platform users
- **Item** - Lost or found items with PostGIS location
- **Claim** - Claims submitted by finders
- **Message** - Chat messages per claim
- **Reward** - Reward records (display only, no payment in phase 1)
- **Notification** - User notifications

## License

ISC
