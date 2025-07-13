import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Login, Homepage, NotFoundPage, AddSign, SignDetails, EditSign } from './importer.jsx'


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
  },

  {
    path: "/SignseSense-Collection/sign/:signId",
    element: <SignDetails />
  },

  {
    path: "/SignseSense-Collection/edit/:signId",
    element: <EditSign />
  },
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)
