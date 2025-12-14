import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import SOQPage from './pages/SOQ.tsx'
import BotPage from './pages/Bot.tsx'
import SignupPage from './pages/Signup.tsx'
import AdminPage from './pages/Admin.tsx'
import ShowingsPage from './pages/Showings.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/soq" element={<SOQPage />} />
        <Route path="/bot" element={<BotPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/showings" element={<ShowingsPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
