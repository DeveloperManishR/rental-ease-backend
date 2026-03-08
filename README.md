# Rental Listings & Move-in Platform (Backend)

The Rental Listings & Move-in Platform is a full-stack web application backend designed to simplify the process of discovering rental properties, scheduling visits, generating support tickets, and managing move-in workflows through a structured, role-based system. 

It connects three primary user roles (`admin`, `owner`, and `tenant`), each with differing permissions and responsibilities.

## Features & Roles

*   **Tenant Workflow:** 
    *   Browse published property listings based on location, budget, and availability. 
    *   Request visits for desired rental places.
    *   Submit issues or queries via support Tickets.
    *   Manage Move-In process (accepting agreement, document upload, finalizing checklist).
*   **Property Owner Workflow:**
    *   Create listing drafts and submit them for review.
    *   Approve, schedule, and mark visits.
    *   Oversee properties.
*   **Admin Moderation Workflow:**
    *   Oversee statistics via an admin dashboard (properties, users, tickets).
    *   Review and publish new property drafts.
    *   Manage support response tickets.

## Tech Stack
*   **Node.js & Express.js** (Server & Routing)
*   **MongoDB & Mongoose** (Database modeling & pagination via `mongoose-paginate-v2`)
*   **JSON Web Tokens (JWT)** (Authentication & Refresh tokens stored in HTTP-Only secure cookies)
*   **Bcrypt** (Password hashing)
*   **Zod** (Input validation)
*   **Multer** (File upload handling)

## Project Structure

```bash
📦backend
 ┣ 📂config             # MongoDB connection setup
 ┣ 📂controllers        # API Logic corresponding to each route (Admin, Auth, Property, Public, Ticket, Visit Request)
 ┣ 📂middlewares        # JWT Authentication, Input validation, and file upload interceptors
 ┣ 📂models             # Database schemas (User, Property, MoveIn, Ticket, VisitRequest)
 ┣ 📂routes             # API endpoints grouping
 ┣ 📂utils              # Standardized API responses
 ┣ 📂validations        # Zod Request Body schemas used in middleware
 ┣ 📜.env               # Environment configuration file
 ┣ 📜index.js           # Server Entry point 
 ┗ 📜package.json       # App scripts and Dependencies
```

## API Endpoints Overview

All routes except `/api/public` require valid JWT authentication.

### Public & Authentication (`/api/public`, `/api/auth`)
*   `POST /api/public/register`: Register with `tenant`, `owner`, or `admin` role.
*   `POST /api/public/login`: Generates accessToken & refreshToken cookies.
*   `POST /api/public/logout`: Clears user context.
*   `POST /api/public/refresh-token`: Exchange refresh token.
*   `GET /api/auth/profile`: Get current user info.
*   `PUT /api/auth/profile`: Update name / contact info.
*   `PUT /api/auth/reset-password`: Manually reset password while logged in.

### Property Management (`/api/properties`) - Owner & Tenant Access
*   `POST /`: Owner creates draft listing.
*   `GET /my`: Owner retrieves their properties.
*   `GET /`: Tenant/Public retrieves **paginated published** listings based on optional query filters (`city`, `minRent`, `maxRent`, `availableFrom`).
*   `GET /:id`: Retrieves single property details.
*   `PUT /:id/submit`: Owner submits draft to Admin for review.

### Moderation Dashboard (`/api/admin`) - Restricted to `admin`
*   `GET /dashboard`: Aggregated platform statistics.
*   `GET /users`: Paginated User directory.
*   `GET /properties`: Review properties queue.
*   `PUT /properties/:id/review`: Approve/Reject action moving status to `published` or `draft`.

### Visit Requests (`/api/visits`)
*   `POST /`: Tenant initiates visit.
*   `PUT /:id/status`: Owner adjusts workflow progression. (`requested` → `scheduled` → `visited` → `decision`).

### Move-In Finalization (`/api/move-in`)
*   `POST /`: Initiates move-in record for a tenant.
*   `PUT /:id/documents`: Upload KYC / documents asynchronously (Multer).
*   `PUT /:id/agreement`: Tenant signs off on the legal agreement status.
*   `PUT /:id/inventory`: Finalize move-in inventory items array.

### Tickets (`/api/tickets`)
*   `POST /`: Start an open support issue (Tenant).
*   `POST /:id/message`: Reply threading mechanism.

---

## Installation & Setup

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <repository_url>
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory (using the `.env.example` as a reference if available). Ensure the following details are configured accurately:
   ```env
   MONGO_URI=mongodb+srv://<USER>:<PASS>@<cluster>.mongodb.net/<DatabaseName>
   PORT=4000

   ACCESS_TOKEN_SECRET=your_jwt_access_secret
   REFRESH_TOKEN_SECRET=your_jwt_refresh_secret
   ACCESS_TOKEN_EXPIRY=1d
   REFRESH_TOKEN_EXPIRY=7d
   ```

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```

The backend server should now reflect successfully connected to the MongoDB database resulting in console output:
```bash
Server running on port 4000
MongoDB connected successfully
```

## Tooling & Debugging

A complete `Rental_Platform_API.postman_collection.json` has been bundled in the root folder containing payloads and headers for all functionality. You can import this into your local **Postman** instance for direct API validation and test cases.
