import { Route, BrowserRouter, Routes } from 'react-router-dom'
import Login from './app/pages/Login/Login'
import Register from './app/pages/Register/Register'
import EmailConfirm from './app/pages/EmailConfirm/EmailConfirm'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/register' element={<Register />}></Route>
        <Route path='/EmailConfirm/:status' element={<EmailConfirm />}></Route>
        <Route path='/login' element={<Login />}></Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
