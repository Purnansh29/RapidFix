# RapidFix

**"Skilled Help. Right When You Need It."**

RapidFix is a full-stack, location-based, on-demand service platform that connects customers with nearby skilled service professionals (plumbers, electricians, carpenters, etc.).

## Project Structure

This repository is organized into a mono-repo structure containing both the mobile frontend and the backend server.

- `/frontend` - React Native mobile application built with Expo (SDK 54) and TypeScript.
- `/backend` - Node.js Express backend using MongoDB, Socket.io, and JWT authentication.

## Technologies Used

**Frontend:**
- React Native
- Expo (SDK 54) & Expo Router
- TypeScript
- React Native Maps
- Socket.io Client
- SecureStore

**Backend:**
- Node.js & Express
- MongoDB & Mongoose
- Socket.io for Real-time communication
- JWT & bcrypt
- Cloudinary (for future image hosting)

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- MongoDB running locally or a MongoDB Atlas URI

### 1. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` directory and add your variables (see the backend README for details, once added).
```bash
npm run dev
```

### 2. Mobile App Setup
```bash
cd frontend
npm install
```
Start the Expo development server:
```bash
npm start
```
Use the Expo Go app on your physical device, or run it on an iOS Simulator or Android Emulator.

## Architecture & Features

This platform supports three roles: Customer, Worker, and Admin.

- **Real-time Map & Tracking:** Live tracking of available workers and active jobs.
- **Secure Authentication:** Role-based access with JWT.
- **In-App Chat:** Real-time private messaging between Customer and Worker.
- **Payment & Commission:** UPI QR integration for platform commissions.
- **Review System:** Customer ratings for completed jobs.
