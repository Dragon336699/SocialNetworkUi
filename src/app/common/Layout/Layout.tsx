import { Outlet } from 'react-router-dom'
import Navbar from '../Navbar/Navbar'
import NotificationSide from '../Navbar/NotificationSide'
import { useState } from 'react'
import Header from '../Header/Header'
import Chatbot from '../../components/Chatbot/Chatbot'

const Layout: React.FC = () => {
  const [showNoti, setShowNoti] = useState(false)

  return (
    <div className='flex flex-col h-screen overflow-hidden bg-[#f8fafc]'>
      <Header />

      <div className='flex flex-1 overflow-hidden relative'>
        <div className='h-full bg-white border-r border-slate-100'>
          <Navbar setShowNoti={setShowNoti} />
        </div>

        <NotificationSide show={showNoti} />
        <div className='flex-1 h-[100%] overflow-y-auto'>
          <Outlet />
        </div>
      </div>
      <Chatbot />
    </div>
  )
}

export default Layout
