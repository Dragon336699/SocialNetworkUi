import { Route, BrowserRouter, Routes } from 'react-router-dom'
import Login from './app/pages/Login/Login'
import Register from './app/pages/Register/Register'
import EmailConfirm from './app/pages/EmailConfirm/EmailConfirm'
import ForgotPassword from './app/pages/ForgotPassword/ForgotPassword'
import Chat from './app/pages/Inbox/Inbox'
import Layout from './app/common/Layout/Layout'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/forgot-password' element={<ForgotPassword />}></Route>
        <Route path='/login' element={<Login />}></Route>
        <Route path='/emailConfirm/:status' element={<EmailConfirm />}></Route>
        <Route path='/register' element={<Register />}></Route>
        <Route path='/' element={<Layout />}>
          <Route path='inbox/:conversationId' element={<Chat />}></Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
