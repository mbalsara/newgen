import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Appointments } from './pages/Appointments'
import { Claims } from './pages/Claims'

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Appointments />} />
          <Route path="/claims" element={<Claims />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
