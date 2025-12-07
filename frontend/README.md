# ChowGo – Food Delivery App (Full-Stack MERN + Zustand + Shadcn/UI)

![ChowGo Banner](https://via.placeholder.com/1200x600.png?text=ChowGo+-+Food+Delivery+App)  
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

# backend/.env

MONGODB_URL=your_connection_url
PORT=your_port
JWT_SECRET=your_secret
CLOUDINARY_CLOUD_NAME=your_name
CLOUDINARY_API_KEY=your_access_key
CLOUDINARY_API_SECRET=your_secret
NODE_MAILER_EMAIL=your_email
NODE_MAILER_PASSWORD=your_password
REVERSE_GEOCODING_API_KEY=your_access_key
LOCATION_IQ_ACCESS_KEY=your_access_key

## Author

Luka Stojkovic
Full-Stack Developer

⭐ If you like this project, give it a star! It means a lot!
