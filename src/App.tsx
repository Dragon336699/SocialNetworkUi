import { Route, BrowserRouter, Routes, Navigate } from 'react-router-dom'
import Login from './app/pages/Login/Login'
import Register from './app/pages/Register/Register'
import EmailConfirm from './app/pages/EmailConfirm/EmailConfirm'
import ForgotPassword from './app/pages/ForgotPassword/ForgotPassword'
import Layout from './app/common/Layout/Layout'
import Home from './app/pages/Home/Home'
import ProfileUser from './app/pages/Profile/ProfileUser'
import Inbox from './app/pages/Inbox/Inbox'
import { useEffect } from 'react'
import { chatService } from './app/services/chat.service'
import PostDetail from './app/pages/Post/PostDetail'
function App() {
  useEffect(() => {
    chatService.start()
  }, [])
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/forgot-password' element={<ForgotPassword />}></Route>
        <Route path='/login' element={<Login />}></Route>
        <Route path='/emailConfirm/:status' element={<EmailConfirm />}></Route>
        <Route path='/register' element={<Register />}></Route>
        <Route path='/post/:postId' element={<PostDetail />}></Route>
        <Route element={<Layout />}>
          <Route path='/' element={<Navigate to='/home' replace />}></Route>
          <Route path='/home' element={<Home />}></Route>
          <Route path='/profile' element={<ProfileUser />}></Route>
          <Route path='/profile/:userId' element={<ProfileUser />}></Route>
          <Route path='inbox' element={<Inbox />}></Route>
          <Route path='inbox/:conversationId?' element={<Inbox />}></Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
