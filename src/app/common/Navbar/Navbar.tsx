import { HomeOutlined, MessageOutlined, UserOutlined } from '@ant-design/icons'
import { ConfigProvider, Menu, MenuProps } from 'antd'
import Sider from 'antd/es/layout/Sider'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

type MenuItem = Required<MenuProps>['items'][number]

function getItem(label: React.ReactNode, key: React.Key, icon?: React.ReactNode, children?: MenuItem[]) {
  return {
    key,
    icon,
    children,
    label
  } as MenuItem
}
const Navbar: React.FC = () => {
  const navigate = useNavigate()
  const items: MenuItem[] = [
    getItem('Home', 'Home', <HomeOutlined />),
    getItem('Chat', 'Inbox', <MessageOutlined />),
    getItem('Profile', 'Profile', <UserOutlined />)
  ]
  const [collapsed, setCollapsed] = useState(false)

  const handleNavigate = (e: any) => {
    navigate(`/${e.key}`)
  }

  return (
    <ConfigProvider
      theme={{
        components: {
          Layout: {
            siderBg: '#212123',
            triggerBg: '#212123'
          }
        }
      }}
    >
      <Sider
        className='h-screen top-[0] bottom-[0] pt-[12px]'
        style={{ position: 'sticky' }}
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
      >
        <ConfigProvider
          theme={{
            components: {
              Menu: {
                darkItemBg: '#212123',
                darkItemSelectedBg: '#474747'
              }
            }
          }}
        >
          <Menu theme='dark' defaultSelectedKeys={['Home']} mode='inline' items={items} onClick={handleNavigate} />
        </ConfigProvider>
      </Sider>
    </ConfigProvider>
  )
}

export default Navbar
