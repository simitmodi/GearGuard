# 🛡️ GearGuard - Modern Maintenance Management System

GearGuard is a powerful, reliable, and user-friendly Computerized Maintenance Management System (CMMS) designed to streamline equipment tracking, maintenance requests, and preventive scheduling. Built with modern web technologies, it offers a seamless experience for managers and technicians alike.

![GearGuard Dashboard](https://placehold.co/1200x600/101010/FFFFFF/png?text=GearGuard+Dashboard)

## 🚀 Features

### 📊 Interactive Dashboard

- **Real-time Stats**: Instant overview of Total Equipment, Open Requests, and In-Progress work orders.
- **Quick Actions**: Rapid access to critical maintenance functions.

### 🏭 Equipment Management

- **Centralized Asset Registry**: Track all machinery with detailed profiles (Serial Numbers, Locations, Models).
- **History Tracking**: Complete log of maintenance activities for each asset.
- **Search & Filter**: Instantly locate equipment across your facility.

### 🔧 Maintenance Requests & Workflow

- **Digital Ticketing**: Easily submit maintenance requests with urgency levels and descriptions.
- **Kanban Board**: Drag-and-drop workflow management (`New` → `In Progress` → `Repaired` → `Scrap`).
- **Role-Based Access**: Specialized views for Technicians and Managers.

### 📅 Preventive Maintenance Calendar 2.0

- **Weekly Schedule View**: Professional 7-day layout with hourly slots (06:00 - 23:00).
- **Live Timeline**: Google Calendar-style red line indicator showing the exact current time.
- **Smart Scheduling**: Visual planning for preventive maintenance tasks to minimize downtime.

### 🎨 Modern UI/UX

- **Responsive Design**: Fully optimized for Desktop, Tablets, and Mobile devices.
- **Dark/Light Theme**: Built with a sleek, accessible interface using **shadcn/ui**.
- **Collapsible Sidebar**: Smart navigation with expanded visibility and optimized icon-only modes.

## 🛠️ Technology Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Components**: [shadcn/ui](https://ui.shadcn.com/) & [Lucide Icons](https://lucide.dev/)
- **Backend & Auth**: [Firebase](https://firebase.google.com/) (Firestore & Authentication)
- **Drag & Drop**: [@hello-pangea/dnd](https://github.com/hello-pangea/dnd)
- **Date Management**: [date-fns](https://date-fns.org/)

## ⚡ Getting Started

### Prerequisites

- Node.js 18+ installed
- A Firebase Project set up with Authentication and Firestore enabled.

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/gearguard.git
   cd gearguard
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Configure Environment**
   Create a `.env.local` file in the root directory and add your Firebase credentials:

   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. **Run the Development Server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📱 License

This project is licensed under the MIT License.

---

Built with ❤️ for efficient maintenance operations.
