import { Route, BrowserRouter, Routes } from 'react-router-dom'
import Login from './app/pages/Login/Login'
import Register from './app/pages/Register/Register'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/login' element={<Login />}></Route>
        <Route path='/register' element={<Register />}></Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
