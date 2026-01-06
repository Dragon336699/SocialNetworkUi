import { faComment, faHouse, faUsers, faUserFriends, faBars } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Badge, ConfigProvider, Menu, MenuProps, Dropdown } from 'antd'
import Sider from 'antd/es/layout/Sider'
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useUnread } from '../Contexts/UnreadContext'
import { NavbarProps } from '../Interfaces/NavbarProps'

type MenuItem = Required<MenuProps>['items'][number]

const IconCircle = ({
  icon,
  bgColor,
  color = 'white',
  badgeCount = 0,
  customIcon
}: {
  icon?: any
  bgColor: string
  color?: string
  badgeCount?: number
  customIcon?: React.ReactNode
}) => {
  const innerIcon = (
    <div
      className='flex items-center justify-center rounded-full mx-auto'
      style={{ backgroundColor: bgColor, width: 32, height: 32, minWidth: 32 }}
    >
      {customIcon ?? <FontAwesomeIcon icon={icon!} style={{ color, fontSize: 14 }} />}
    </div>
  )

  return (
    <div className='flex justify-center items-center h-full'>
      {badgeCount > 0 ? <Badge count={badgeCount}>{innerIcon}</Badge> : innerIcon}
    </div>
  )
}

function getItem(label: React.ReactNode, key: React.Key, icon?: React.ReactNode, children?: MenuItem[]) {
  return {
    key,
    icon,
    children,
    label: <span className='font-semibold text-[15px] ml-2'>{label}</span>
  } as MenuItem
}

const Navbar: React.FC<NavbarProps> = () => {
  const navigate = useNavigate()
  const { unreadMessages } = useUnread()
  const [items, setItems] = useState<MenuItem[]>([])
  // const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  const baseItems = useMemo<MenuItem[]>(
    () => [
      getItem('Home', 'Home', <IconCircle icon={faHouse} bgColor='#1877F2' />),
      // getItem('Search', 'Search', <IconCircle icon={faSearch} bgColor='#E4E6EB' color='black' />),
      getItem('Friends', 'Friend', <IconCircle icon={faUserFriends} bgColor='#45BD62' />),
      getItem('Groups', 'Groups', <IconCircle icon={faUsers} bgColor='#EEA567' />),
      getItem('Inbox', 'Inbox', <IconCircle icon={faComment} bgColor='#1877F2' badgeCount={unreadMessages} />)
      // getItem('Notification', 'Notification', <IconCircle icon={faBell} bgColor='#F02849' badgeCount={unreadNotis} />)
    ],
    [unreadMessages]
  )

  const path = location.pathname.split('/')[1] || 'Home'

  const handleNavigate = (e: any) => {
    if (e.key === 'Inbox') window.location.href = '/Inbox'
    else if (e.key === 'more') {
      return
    } else navigate(`/${e.key}`)
  }

  useEffect(() => {
    setItems((prev) => {
      const profileItem = prev.find((i) => i?.key === 'profile')
      return profileItem ? [...baseItems, profileItem] : baseItems
    })
  }, [baseItems])

  return (
    <ConfigProvider
      theme={{
        components: {
          Layout: {
            siderBg: '#F0F2F5',
            triggerBg: '#F0F2F5',
            triggerColor: '#65676B'
          },
          Menu: {
            itemBg: 'transparent',
            itemColor: '#050505',
            itemSelectedBg: '#E4E6EB',
            itemSelectedColor: '#050505',
            itemHoverBg: '#E4E6EB',
            itemHeight: 52
          }
        }
      }}
    >
      <Sider
        className='h-screen top-0 bottom-0 pt-3 !border-r-2'
        style={{ position: 'sticky' }}
        width={280}
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
      >
        <Menu
          theme='light'
          selectedKeys={[path]}
          mode='inline'
          items={items}
          onClick={handleNavigate}
          className='border-none'
        />

        <div className='absolute bottom-10 left-0 right-0 px-2'>
          <Dropdown menu={{ items: baseItems }} trigger={['click']}>
            <div
              className={`flex items-center py-2 px-3 cursor-pointer hover:bg-[#E4E6EB] rounded-lg transition-colors text-[#050505] ${
                collapsed ? 'justify-center' : ''
              }`}
            >
              <div className='w-8 h-8 rounded-full bg-[#E4E6EB] flex items-center justify-center min-w-[32px]'>
                <FontAwesomeIcon icon={faBars} style={{ fontSize: '14px' }} />
              </div>
              {!collapsed && <span className='ml-3 font-semibold text-[15px]'>See More</span>}
            </div>
          </Dropdown>
        </div>
      </Sider>
    </ConfigProvider>
  )
}

export default Navbar
