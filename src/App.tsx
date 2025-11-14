import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import Login from './app/pages/Login/Login'
import Register from './app/pages/Register/Register'
import EmailConfirm from './app/pages/EmailConfirm/EmailConfirm'
import ForgotPassword from './app/pages/ForgotPassword/ForgotPassword'
import Layout from './app/common/Layout/Layout'
import Home from './app/pages/Home/Home'
import ProfileUser from './app/pages/Profile/ProfileUser'
import Inbox from './app/pages/Inbox/Inbox'
import { chatService } from './app/services/chat.service'
import { useUserStore } from './app/stores/auth'

const PrivateRoute = () => {
  const { isLoggedIn } = useUserStore()
  return isLoggedIn ? <Outlet /> : <Navigate to='/login' replace />
}

const PublicRoute = () => {
  const { isLoggedIn } = useUserStore()
  return !isLoggedIn ? <Outlet /> : <Navigate to='/home' replace />
}

function App() {
  const { isLoggedIn, fetchUser } = useUserStore()

  useEffect(() => {
    fetchUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (isLoggedIn) chatService.start()
  }, [isLoggedIn])

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path='/login' element={<Login />} />
          <Route path='/register' element={<Register />} />
          <Route path='/forgot-password' element={<ForgotPassword />} />
          <Route path='/emailConfirm/:status' element={<EmailConfirm />} />
        </Route>

        <Route element={<PrivateRoute />}>
          <Route element={<Layout />}>
            <Route path='/' element={<Navigate to='/home' replace />} />
            <Route path='/home' element={<Home />} />
            <Route path='/profile' element={<ProfileUser />} />
            <Route path='/profile/:userId' element={<ProfileUser />} />
            <Route path='/inbox' element={<Inbox />} />
            <Route path='/inbox/:conversationId?' element={<Inbox />} />
          </Route>
        </Route>

        <Route path='*' element={<Navigate to={isLoggedIn ? '/home' : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
