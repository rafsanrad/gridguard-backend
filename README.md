
# GridGuard — Load Shedding & Power Outage Management System

GridGuard is a backend API for managing scheduled load shedding, power outages, technician assignments, customer service requests, notifications, and payments.

## Features
- Authentication, JWT, and role-based access control
- Zone, substation, feeder, and area management
- Load shedding schedules and outage tracking
- Technician assignments and outage reports
- Service requests and bKash payments
- Redis caching, audit logs, and analytics
- Pagination, searching, sorting, and validation

## Tech Stack
- Node.js, Express.js, TypeScript
- PostgreSQL, Prisma ORM
- Redis
- Zod
- bKash Payment Gateway

## Getting Started

```bash
git clone https://github.com/rafsanrad/gridguard-backend.git

cd GridGuard
npm install
```

Configure your `.env` file with the required database, Redis, JWT, and payment credentials.

Run the development server:

```bash
npm run dev
```

## API Documentation

The Postman collection is available in the project repository:

`GridGuard API.postman_collection.json`

**API Base URL:** `http://localhost:8000/api/v1`

## User Roles
- `CUSTOMER`
- `OPERATOR`
- `ADMIN`

Created By: Rafsan Rad
Mail: rafsanjahink@gmail.com