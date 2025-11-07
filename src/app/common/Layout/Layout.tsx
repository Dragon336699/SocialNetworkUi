import { Outlet } from 'react-router-dom'
import Navbar from '../Navbar/Navbar'
import { UnreadProvider } from '../Contexts/UnreadContext'

const Layout: React.FC = () => {
  return (
    <UnreadProvider>
      <div className='flex h-screen'>
        <Navbar />
        <div className='flex-1 h-screen'>
          <Outlet />
        </div>
      </div>
    </UnreadProvider>
  )
}

export default Layout
