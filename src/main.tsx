import { createRoot } from 'react-dom/client'
import './styles/base.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthProvider'

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <App />
  </AuthProvider>,
)
