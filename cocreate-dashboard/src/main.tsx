import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <div>
    <StrictMode>
      <App />
    </StrictMode>
    {/* <img src={`data:image/png;base64,${base64Image}`}/> */}
  </div>
)

