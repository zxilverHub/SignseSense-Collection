import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Login, Homepage, NotFoundPage, AddSign } from './importer.jsx'


const router = createBrowserRouter([
  {
    path: '/',
    element: <Login />,
    errorElement: <NotFoundPage />
  },

  {
    path: '/home',
    element: <Homepage />
  },

  {
    path: '/addsign',
    element: <AddSign />
  }
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)
