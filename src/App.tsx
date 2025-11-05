import { Route, BrowserRouter, Routes, Navigate } from 'react-router-dom'
import Login from './app/pages/Login/Login'
import Register from './app/pages/Register/Register'
import EmailConfirm from './app/pages/EmailConfirm/EmailConfirm'
import ForgotPassword from './app/pages/ForgotPassword/ForgotPassword'
import Chat from './app/pages/Inbox/Inbox'
import Layout from './app/common/Layout/Layout'
import Home from './app/pages/Home/Home'
import ProfileUser from './app/pages/Profile/ProfileUser'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/forgot-password' element={<ForgotPassword />}></Route>
        <Route path='/login' element={<Login />}></Route>
        <Route path='/emailConfirm/:status' element={<EmailConfirm />}></Route>
        <Route path='/register' element={<Register />}></Route>
        <Route element={<Layout />}>
          <Route path='/' element={<Navigate to='/home' replace />}></Route>
          <Route path='/home' element={<Home />}></Route>
          <Route path='inbox' element={<Chat />}></Route>
          <Route path='inbox/:conversationId?' element={<Chat />}></Route>
          <Route path='/profile' element={<ProfileUser />}></Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
