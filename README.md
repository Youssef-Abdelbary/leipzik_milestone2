# PopEyez: Pop-Up Café Event Management Platform

## Overview

PopEyez is a comprehensive full-stack web application designed to bridge the gap between Event Organizers and Venue Owners. The platform streamlines the process of planning temporary pop-up cafés, managing venue applications, and tracking event budgets and tasks.

This project implements the core user journeys for both organizers and venue owners, allowing users to discover spaces, manage bookings, and analyze performance data seamlessly.

### Core Modules

#### 1. Account Creation and Customization

Users can register as Event Organizers or Venue Owners, update account details, manage team/guest accounts, and securely handle stakeholder access.

#### 2. Venue Search and Booking

Event Organizers can browse, filter, and apply for pop-up spaces based on specific criteria (e.g., location, date, capacity). Venue Owners can review, approve, or decline these applications.

#### 3. Venue Listings Management

Venue Owners can create detailed listings for their spaces, including dimensions, amenities, pricing, floor plans, and a dynamic availability calendar.

#### 4. Event Planning & Setup

A dedicated dashboard for organizers to manage their daily workflows, track tasks leading up to the event, and calculate/record planned budgets versus actual expenses.

#### 5. Booking Overview & Reporting

Venue owners have access to historical booking data, booking rates, and revenue reports per listing, which can be exported for business planning.

---

## Project Structure

```text
PopEyez/
│
├── client/                 
│   ├── public/             
│   ├── src/
│   │   ├── assets/         
│   │   ├── components/     
│   │   ├── pages/          
│   │   ├── services/       
│   │   ├── App.jsx         
│   │   └── main.jsx        
│   ├── package.json
│   └── vite.config.js
│
├── server/                 
│   ├── controllers/        
│   ├── middleware/         
│   ├── models/             
│   ├── routes/             
│   ├── package.json
│   └── server.js           
│
├── shared/                 
├── .gitignore
└── README.md

```

### Main Components

* `client/src/pages/` contains the top-level React views (e.g., VenueSearch, Dashboard).
* `client/src/services/` handles API communication with the Node.js backend.
* `server/server.js` contains the main backend server logic and API entry point.
* `server/controllers/` implements the business logic for user journeys and bookings.
* `server/models/` defines the MongoDB Mongoose schemas for data structuring.
* `server/routes/` maps API endpoints to their respective controllers.
* `shared/` contains shared resources, constants, and utilities used by both frontend and backend.

---

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd <repository-name>

```

### 2. Install Node.js and MongoDB

Ensure you have Node.js (v18+) installed. You will also need a running instance of MongoDB (either locally or via MongoDB Atlas).

You can verify your Node installation with:

```bash
node --version
npm --version

```

### 3. Install project dependencies

You need to install dependencies for **both** the client and the server.

From the project root, run:

```bash
cd server
npm install

cd ../client
npm install

```


### 4. Database & Environment Configuration
To connect your backend to the shared database, you must create a configuration file. Never push this file to GitHub.
Inside the server/ directory, create a new file named .env.
Add the following line to the file, replacing the placeholder with the connection string provided by your team member:

```bash
MONGO_URI=mongodb+srv://everyone_read_write:whatsapp_for_password@cluster0.b2cm0xr.mongodb.net/?appName=Cluster0
```

---

## Usage

You must run both the backend server and the frontend client simultaneously.

### Required Environment Variables

Before running the application, create a `.env` file in **both** directories.

**In `server/.env`:**

| Variable | Example Value | Description |
| --- | --- | --- |
| `PORT` | `5000` | Port number for the Express server |
| `MONGO_URI` | `mongodb://...` | Connection string for your MongoDB database |
| `JWT_SECRET` | `your_secret_key` | Secret key for signing authentication tokens |

**In `client/.env`:**

| Variable | Example Value | Description |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `http://localhost:5000/api` | The base URL pointing to your Node.js backend |

### Starting the Application

#### Run the Backend

```bash
cd server
npm run dev

```

#### Run the Frontend

Open a new terminal window:

```bash
cd client
npm run dev

```

---

## Example Workflow

Once both servers are running, navigate to `http://localhost:5173` in your browser.

1. **Register** a new Venue Owner account.
2. **Create** a new venue listing (e.g., "Downtown Art Gallery").
3. **Register** a new Event Organizer account.
4. **Search** for venues in "Downtown" and **Submit** a booking request.
5. Log back in as the Venue Owner to **Approve** the booking.