import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Login, Homepage, NotFoundPage, AddSign } from './importer.jsx'


const router = createBrowserRouter([
  {
    path: '/SignseSense-Collection/',
    element: <Login />,
    errorElement: <NotFoundPage />
  },

  {
    path: '/SignseSense-Collection/home',
    element: <Homepage />
  },

  {
    path: '/SignseSense-Collection/addsign',
    element: <AddSign />
  }
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)
