import { Route, BrowserRouter, Routes } from 'react-router-dom'
import Login from './app/pages/Login/Login'
import EmailConfirm from './app/pages/EmailConfirm/EmailConfirm'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/Login' element={<Login />}></Route>
        <Route path='/EmailConfirm/:status' element={<EmailConfirm />}></Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
