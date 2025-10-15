import { Outlet } from 'react-router-dom'
import Navbar from '../Navbar/Navbar'

const Layout: React.FC = () => {
  return (
    <div className='flex h-screen bg-[#212123]'>
      <Navbar />
      <div className='flex-1 h-screen'>
        <Outlet />
      </div>
    </div>
  )
}

export default Layout
