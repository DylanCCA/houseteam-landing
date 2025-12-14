import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import SOQPage from './pages/SOQ.tsx'
import BotPage from './pages/Bot.tsx'
import AdminDashboard from './pages/AdminDashboard.tsx'
import ClientSignup from './pages/ClientSignup.tsx'
import ShowingScheduler from './pages/ShowingScheduler.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/soq" element={<SOQPage />} />
        <Route path="/bot" element={<BotPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/signup" element={<ClientSignup />} />
        <Route path="/showings" element={<ShowingScheduler />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
