import { Outlet } from 'react-router-dom'
import Navbar from '../Navbar/Navbar'
import NotificationSide from '../Navbar/NotificationSide'
import { useState } from 'react'
import Header from '../Header/Header'
import Chatbot from '../../components/Chatbot/Chatbot'
import { Drawer } from 'antd'

const Layout: React.FC = () => {
  const [showNoti, setShowNoti] = useState(false)
  const [openDrawer, setOpenDrawer] = useState(false)

  return (
    <div className='flex flex-col h-screen overflow-hidden bg-[#f8fafc]'>
      <Header onOpenMenu={() => setOpenDrawer(true)} />

      <div className='flex flex-1 overflow-hidden relative'>
        <div className='hidden lg:block h-full bg-white border-r border-slate-100'>
          <Navbar setShowNoti={setShowNoti} />
        </div>

        <Drawer
          placement='left'
          onClose={() => setOpenDrawer(false)}
          open={openDrawer}
          width={280}
          closable={false}
          styles={{ body: { padding: 0 } }}
        >
          <div className='h-full bg-[#F0F2F5]'>
            <Navbar setShowNoti={setShowNoti} isDrawer={true} onMenuClick={() => setOpenDrawer(false)} />
          </div>
        </Drawer>

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
