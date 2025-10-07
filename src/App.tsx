import { Route, BrowserRouter, Routes } from 'react-router-dom'
import Login from './app/pages/Login/Login'
import ForgotPassword from './app/pages/ForgotPassword/ForgotPassword'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/Login' element={<Login />}></Route>
        <Route path='/forgot-password' element={<ForgotPassword />}></Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
