import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.jsx'
import RegisterPage from './pages/registerPage.jsx'
import LoginPage from './pages/loginPage.jsx'


const router = createBrowserRouter([
  {
    path: "/",
    element: <App/>,
  },
  {
    path: "/register",
    element:<RegisterPage/> ,
  },
  {
    path: "/login",
    element: <LoginPage/>,
  }
])
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router}/>
    <Toaster/>
  </StrictMode>,
)
