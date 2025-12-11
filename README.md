# Damlee

Damlee is a comprehensive resource management and scheduling application designed to streamline organizational operations. It features a modern, responsive user interface and a robust backend to handle complex data relationships.

## ✨ Features

- **🔐 Authentication**: Secure user login and registration system using JWT.
- **📊 Dashboard**: Interactive analytics and overview of system status.
- **📅 Calendar & Events**: Full-featured calendar for scheduling and managing events.
- **✅ Task Management**: Organize, assign, and track tasks efficiently.
- **👥 Team Collaboration**: Manage teams and member roles.
- **🏢 Room & Resource Booking**: efficient system for booking rooms and managing shared resources.
- **📦 Inventory & Asset Management**: Track and manage organizational assets and inventory.
- **🔔 Real-time Alerts**: System for important notifications and alerts.

## 🛠️ Tech Stack

### Frontend (`webapp`)
- **Framework**: [React 19](https://react.dev/) with [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) & [Shadcn/UI](https://ui.shadcn.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) & [TanStack Query](https://tanstack.com/query/latest)
- **Routing**: [TanStack Router](https://tanstack.com/router/latest)
- **API Client**: [ORPC Client](https://orpc.unnoq.com/)

### Backend (`backend`)
- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express](https://expressjs.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/)
- **API Layer**: [ORPC Server](https://orpc.unnoq.com/) for type-safe RPC
- **Validation**: [Zod](https://zod.dev/)

## 🚀 Getting Started

Follow these instructions to get the project up and running on your local machine.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (running locally or a cloud instance)

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and provide your MongoDB connection string and JWT secret.
   ```env
   MONGODB_URI=mongodb://localhost:27017/damlee
   JWT_SECRET=your_jwt_secret
   PORT=3001
   ```

4. Start the backend server:
   ```bash
   npm run dev
   ```
   The server will start on `http://localhost:3001`.

### 2. Frontend Setup

1. Open a new terminal and navigate to the webapp directory:
   ```bash
   cd webapp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`.

## 📂 Project Structure

```
damlee/
├── backend/          # Express/Node.js backend
│   ├── src/
│   │   ├── db/       # Database connection
│   │   ├── models/   # Mongoose models
│   │   ├── router/   # ORPC routers/controllers
│   │   └── ...
│   └── ...
└── webapp/           # React frontend
    ├── src/
    │   ├── pages/    # Application views
    │   ├── components/# Reusable UI components
    │   ├── lib/      # Utilities and ORPC client
    │   └── ...
    └── ...
```

## 📄 License

[ISC](https://opensource.org/licenses/ISC)
