import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import SchedulePage from './pages/SchedulePage'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/schedule" replace />} />
        <Route path="/schedule" element={<SchedulePage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
