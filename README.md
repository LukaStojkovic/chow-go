# Chow & Go – Food Delivery App (Full-Stack MERN + Zustand + Shadcn/UI)

_Modern, fast and beautiful food delivery platform built with the latest tech stack (2025 standards)_

## Live Demo

[**chowgo.vercel.app**](https://chowgo.vercel.app) _(coming soon)_

## Features

### For Customers

- Browse nearby restaurants with real-time "Open/Closed" status
- Beautiful restaurant & menu pages with high-quality images
- Add to favorites, save delivery addresses
- Real-time order tracking
- Order history & re-order functionality
- Dark/Light/System theme support
- Fully responsive (mobile-first)

### For Restaurant Owners (Sellers)

- Complete restaurant dashboard
- Register your restaurant in minutes
- Manage menu items (add/edit/delete)
- Real-time order management
- View earnings & analytics
- Update restaurant info, hours, photos
- Automatic open/close based on working hours

### Tech Highlights

- **Frontend**: React 18, Javascript, Zustand, React Query, Tailwind CSS, Shadcn/UI, Lucide Icons
- **Backend**: Node.js, Express, MongoDB (Mongoose), JWT + HttpOnly cookies
- **File Uploads**: Cloudinary
- **Authentication**: Role-based (customer/seller), protected routes, JWT
- **State Management**: Zustand (lightweight & fast)
- **Routing**: React Router v6 with role-based guards
- **Styling**: Tailwind + Shadcn/UI + glassmorphism effects
- **Deployment-ready**: Optimized for Vercel (frontend) & Render/Cyclic (backend)

## Tech Stack

| Layer         | Technology                                   |
| ------------- | -------------------------------------------- |
| Frontend      | React, Javascript, Vite, Tailwind, Shadcn/UI |
| State         | Zustand + React Query                        |
| Backend       | Node.js, Express                             |
| Database      | MongoDB + Mongoose                           |
| Auth          | JWT (httpOnly cookies)                       |
| File Storage  | Cloudinary                                   |
| Icons         | Lucide React                                 |
| UI Components | Shadcn/UI + Radix UI                         |
| Deployment    | Vercel (FE), Render/Cyclic (BE)              |

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Cloudinary account

### Installation

```bash
# Clone the repo
git clone https://github.com/LukaStojkovic/chow-go.git
cd chow-go

# Backend
cd backend
cp .env.example .env
npm install
npm run dev

# Frontend
cd ../frontend
cp .env.example .env
npm install
npm run dev
```

### Required Environment Variables (`backend/.env`)

| Variable                    | Description                          | Example / Note                                                |
| --------------------------- | ------------------------------------ | ------------------------------------------------------------- |
| `MONGODB_URL`               | MongoDB connection string            | `mongodb+srv://user:pass@cluster.mongodb.net/chow&go`         |
| `PORT`                      | Server port                          | `5000`                                                        |
| `JWT_SECRET`                | Secret for signing JWT tokens        | `super_strong_secret_2025` (min 32 chars)                     |
| `CLOUDINARY_CLOUD_NAME`     | Cloudinary cloud name                | `dyb2g8zfa`                                                   |
| `CLOUDINARY_API_KEY`        | Cloudinary API key                   | `123456789012345`                                             |
| `CLOUDINARY_API_SECRET`     | Cloudinary API secret                | `your_secret_here`                                            |
| `NODE_MAILER_EMAIL`         | Gmail/App email for sending OTPs     | `your_gmail@gmail.com`                                        |
| `NODE_MAILER_PASSWORD`      | App password (not regular password!) | `abcd efgh ijkl mnop`                                         |
| `REVERSE_GEOCODING_API_KEY` | For address → coordinates            | From [BigDataCloud](https://www.bigdatacloud.com/) or similar |
| `LOCATION_IQ_ACCESS_KEY`    | For maps/autocomplete                | From [LocationIQ](https://locationiq.com)                     |

**Never commit your `.env` file!** It is already ignored via `.gitignore`.

## Author

Luka Stojkovic
Full-Stack Developer

⭐ If you like this project, give it a star! It means a lot!
