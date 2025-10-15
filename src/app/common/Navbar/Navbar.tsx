import { HomeOutlined, MessageOutlined, UserOutlined } from '@ant-design/icons'
import { ConfigProvider, Menu, MenuProps } from 'antd'
import Sider from 'antd/es/layout/Sider'
import { useState } from 'react'

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
  const items: MenuItem[] = [
    getItem('Home', '1', <HomeOutlined />),
    getItem('Chat', '2', <MessageOutlined />),
    getItem('Profile', '3', <UserOutlined />)
  ]
  const [collapsed, setCollapsed] = useState(false)
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
          <Menu theme='dark' defaultSelectedKeys={['1']} mode='inline' items={items} />
        </ConfigProvider>
      </Sider>
    </ConfigProvider>
  )
}

export default Navbar
