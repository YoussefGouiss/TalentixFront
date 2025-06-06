import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { RouterProvider } from 'react-router-dom'
import route from './router.jsx'
import TestSidebar from './test.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={route} /> 
    {/* <TestSidebar/> */}
  </StrictMode>,
)
