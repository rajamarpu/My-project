# AI Celebrity Learning Platform

An AI-powered online learning platform where students learn from AI-generated virtual instructors inspired by celebrities like Shah Rukh Khan, Deepika Padukone, Ranveer Singh, and more.

## 🚀 Features

### Core Features
- **AI Celebrity Instructors** - Learn from AI-generated virtual personalities inspired by your favorite celebrities
- **Personality Switching** - Switch between different instructors anytime without losing progress
- **Personalized Learning** - AI adapts voice, teaching style, and presentation based on your preferences
- **Course Categories** - Programming, Data Science, AI/ML, Web Development, Business, and more
- **Progress Tracking** - Monitor your learning journey with detailed analytics

### Technical Features
- **React + Vite** - Fast development with HMR
- **Tailwind CSS** - Modern utility-first styling
- **Framer Motion** - Smooth animations and transitions
- **Redux Toolkit** - State management
- **Node.js + Express** - RESTful API backend
- **MongoDB** - Database with Mongoose ODM

## 📁 Project Structure

```
├── src/
│   ├── components/
│   │   ├── courses/
│   │   ├── personality/
│   │   ├── ui/
│   │   └── navigation/
│   ├── pages/
│   │   ├── landing/
│   │   ├── course/
│   │   ├── dashboard/
│   │   ├── personality/
│   │   └── player/
│   ├── redux/
│   │   └── slices/
│   └── data/
└── backend/
    ├── src/
    │   ├── models/
    │   ├── controllers/
    │   ├── routes/
    │   └── middleware/
    └── package.json
```

## 🛠️ Installation

### Frontend
```bash
npm install
npm run dev
```

### Backend
```bash
cd backend
npm install
npm run backend:express
```

## 🔧 Environment Variables

Create `.env` files in both root and backend directories:

**Root .env:**
```
VITE_API_URL=http://localhost:5000
```

**Backend .env:**
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/celebrity-academy
JWT_SECRET=your-secret-key
CLIENT_ORIGIN=http://localhost:5174
```

## 📚 AI Personalities Available

1. **Shah Rukh Khan** - Motivational, storytelling approach
2. **Ranveer Singh** - Energetic, fun learning style
3. **Alia Bhatt** - Friendly, practical explanations
4. **Deepika Padukone** - Professional, structured teaching
5. **Akshay Kumar** - Disciplined, action-oriented
6. **Emma Watson** - Intellectual, analytical approach
7. **Tom Hanks** - Narrative-driven instruction
8. **Scarlett Johansson** - Sophisticated, confident delivery
9. **Dwayne Johnson** - Motivational coaching

## 🎯 Key Pages

- `/` - Landing page with hero section, personality showcase
- `/courses` - Browse all courses
- `/personalities` - View all AI instructors
- `/course/:id` - Course detail page with personality switching
- `/player/:id` - Video learning player
- `/dashboard` - Student dashboard with progress tracking
- `/login` / `/register` - Authentication

## 🎨 Design Features

- Glassmorphism effects
- Animated particle backgrounds
- Responsive layouts for all devices
- Dark/light mode support
- Modern neon gradients
- Interactive course cards

## 🚢 Deployment

Build for production:
```bash
npm run build
```

## 📝 License

MIT License - Created by Shivam Sir's Internship Team