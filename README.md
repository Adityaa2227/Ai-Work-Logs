# WorkLog AI 🚀

A powerful, intelligent **Work Log Tracking & Analytics** application designed to help engineers and professionals track their daily progress, generate AI-powered summaries, and gain insights into their productivity.

Built with the **MERN Stack** (MongoDB, Express, React, Node.js) and enhanced with **PWA** capabilities for a native-like mobile experience.

![WorkLog AI Banner](https://via.placeholder.com/1200x400?text=WorkLog+AI+Dashboard)

## ✨ Key Features

- **📝 Daily & Weekly Logging**: Effortlessly log tasks, challenges, and learnings.
- **🤖 AI-Powered Summaries**: Automatically generate weekly and monthly summaries using **Google Gemini AI**.
- **📊 Advanced Analytics**: Visual charts (Recharts) for task distribution, productivity trends, and work-life balance.
- **📱 PWA & Mobile Support**: Install on **iOS** and **Android**. Fully responsive design.
- **🔔 Web Push Notifications**: Get scheduled reminders (1:30 PM, 5:30 PM, 11:30 PM) on your mobile device (iOS/Android) and desktop.
- **🏢 Company Management**: Switch contexts between different companies or projects.
- **🌗 Dark/Light Mode**: Beautiful, modern UI with glassmorphism effects (TailwindCSS).

## 🛠️ Tech Stack

- **Frontend**: React (Vite), TailwindCSS, Framer Motion, Lucide React, Recharts.
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB (Mongoose).
- **AI**: Google Generative AI (Gemini Flash 1.5).
- **Notifications**: Web Push API (VAPID), Node-Cron.
- **Authentication**: JWT (JSON Web Tokens).

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas URI)

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/worklog-ai.git
cd worklog-ai
```

### 2. Backend Setup
```bash
cd server
npm install
```
Create a `.env` file in the `server` directory:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_google_gemini_api_key
client_URL=http://localhost:5173

# Web Push Keys (Generate using: npx web-push generate-vapid-keys)
VAPID_PUBLIC_KEY=your_generated_public_key
VAPID_PRIVATE_KEY=your_generated_private_key
```
Start the server:
```bash
npm start
# or for development
npm run dev
```

### 3. Frontend Setup
```bash
cd client
npm install
```
Create a `.env.local` file in the `client` directory:
```env
VITE_API_URL=http://localhost:5000/api
VITE_VAPID_PUBLIC_KEY=your_generated_public_key_(same_as_server)
```
Start the client:
```bash
npm run dev
```

## 📱 Mobile Installation (PWA)

### iOS (iPhone/iPad)
1.  Open the app in **Safari**.
2.  Tap the **Share** button (Square with arrow up).
3.  Scroll down and tap **"Add to Home Screen"**.
4.  Open the app from your Home Screen.
5.  Tap the **Bell Icon** 🔔 in the top header to enable Push Notifications.

### Android
1.  Open in **Chrome**.
2.  Tap the prompt **"Add to Home Screen"** or select "Install App" from the menu.

## 🤝 Contributing
Contributions are welcome! Please fork the repository and submit a Pull Request.

## 📄 License
MIT License.
