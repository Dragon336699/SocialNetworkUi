import { Outlet } from 'react-router-dom'
import Navbar from '../Navbar/Navbar'

const Layout: React.FC = () => {
  return (
    <div className='flex h-[100%]'>
      <Navbar />
      <div className='flex-1 h-[100%]'>
        <Outlet />
      </div>
    </div>
  )
}

export default Layout
