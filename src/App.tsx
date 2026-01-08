import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import SchedulePage from './pages/SchedulePage.tsx'
import PreviewPage from './pages/PreviewPage.tsx'


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/schedule" replace />} />
        <Route path="/schedule" element={<SchedulePage />} />
        <Route path="/preview/:year" element={<PreviewPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
