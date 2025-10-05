import { Route, BrowserRouter, Routes } from 'react-router-dom'
import Login from './app/pages/Login/Login'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/Login' element={<Login />}></Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
