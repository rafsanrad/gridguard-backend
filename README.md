# GridGuard — Load Shedding & Power Outage Management System

GridGuard is a backend API designed to manage scheduled load shedding, unexpected power outages, technician assignments, customer service requests, notifications, and payments. It provides role-based access control, outage tracking, and analytics to support power distribution management.

## Features

- **Authentication & Authorization:** JWT authentication and role-based access control.
- **Power Distribution Management:** Manage zones, substations, feeders, and areas.
- **Load Shedding & Outages:** Create load shedding schedules and track power outages.
- **Technician Management:** Manage technicians, assignments, and outage reports.
- **Service Requests:** Handle customer service requests.
- **Payment Integration:** Support payments through the bKash payment gateway.
- **Notifications:** Notify users about relevant system events.
- **Redis Caching:** Improve performance through caching.
- **Audit Logs & Analytics:** Track system activities and provide analytical insights.
- **API Features:** Pagination, searching, sorting, and request validation.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Caching:** Redis
- **Validation:** Zod
- **Payment Gateway:** bKash
- **Authentication:** JSON Web Tokens (JWT)

## Getting Started

### Prerequisites

Make sure you have the following installed:

- Node.js
- npm
- PostgreSQL
- Redis

### Installation

Clone the repository:

```bash
git clone https://github.com/rafsanrad/gridguard-backend.git
```

Navigate to the project directory:

```bash
cd gridguard-backend
```

Install dependencies:

```bash
npm install
```

### Environment Configuration

Create a `.env` file in the project root and configure the environment variables required by the application.

These include database connection settings, Redis credentials, JWT secrets, payment gateway credentials, and any other variables required by the project.

**Important:** Never commit your `.env` file or expose passwords, API keys, or other secrets in the repository.

### Run the Development Server

```bash
npm run dev
```

The local backend server runs on the port configured in your environment variables. The default port is `8000`.

## API Documentation

The Postman collection is included in the repository:

`GridGuard API.postman_collection.json`

To explore and test the API:

1. Open Postman.
2. Import the JSON collection from the project repository.
3. Configure the required environment variables and authentication tokens.
4. Send requests to the available endpoints.

## API Base URLs

**Local API**

```text
http://localhost:8000/api/v1
```

**Production API**

[https://grid-guard-backend.vercel.app/api/v1](https://grid-guard-backend.vercel.app/api/v1)

## User Roles

GridGuard supports the following roles:

- `CUSTOMER`
- `OPERATOR`
- `ADMIN`

Each role has permissions appropriate to its responsibilities within the system.

## Project Repository

[GitHub — GridGuard Backend](https://github.com/rafsanrad/gridguard-backend)

## Author

**Rafsan Rad**

Email: [rafsanjahink@gmail.com](mailto:rafsanjahink@gmail.com)