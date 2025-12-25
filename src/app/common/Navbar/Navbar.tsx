import { userService } from '@/app/services/user.service'
import { BaseResponse } from '@/app/types/Base/Responses/baseResponse'
import { UserDto } from '@/app/types/User/user.dto'
import { faBell, faComment, faHouse, faUsers, faUserFriends, faSearch, faBars } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Avatar, Badge, ConfigProvider, Menu, MenuProps, message, Dropdown } from 'antd'
import { LogoutOutlined, LockOutlined } from '@ant-design/icons'
import Sider from 'antd/es/layout/Sider'
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useUnread } from '../Contexts/UnreadContext'
import { NavbarProps } from '../Interfaces/NavbarProps'
import SearchComponent from '@/app/components/Search/SearchComponent'
import { DEFAULT_AVATAR_URL } from '../Assests/CommonVariable'

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

const Navbar: React.FC<NavbarProps> = ({ setShowNoti }) => {
  const navigate = useNavigate()
  const { unreadMessages, unreadNotis } = useUnread()
  const [showSearch, setShowSearch] = useState(false)
  const [items, setItems] = useState<MenuItem[]>([])
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  const baseItems = useMemo<MenuItem[]>(
    () => [
      getItem('Home', 'Home', <IconCircle icon={faHouse} bgColor='#1877F2' />),
      getItem('Search', 'Search', <IconCircle icon={faSearch} bgColor='#E4E6EB' color='black' />),
      getItem('Friends', 'Friend', <IconCircle icon={faUserFriends} bgColor='#45BD62' />),
      getItem('Groups', 'Groups', <IconCircle icon={faUsers} bgColor='#EEA567' />),
      getItem('Inbox', 'Inbox', <IconCircle icon={faComment} bgColor='#1877F2' badgeCount={unreadMessages} />),
      getItem('Notification', 'Notification', <IconCircle icon={faBell} bgColor='#F02849' badgeCount={unreadNotis} />)
    ],
    [unreadMessages, unreadNotis]
  )

  const path = location.pathname.split('/')[1] || 'Home'

  const handleNavigate = (e: any) => {
    if (e.key === 'Inbox') window.location.href = '/Inbox'
    else if (e.key === 'Notification') {
      setShowNoti((prev) => !prev)
    } else if (e.key === 'Search') {
      setShowSearch((prev) => !prev)
    } else if (e.key === 'profile') {
      navigate('/profile')
    } else if (e.key === 'more') {
      return
    } else navigate(`/${e.key}`)
  }

  const handleCollapseNavbar = () => setCollapsed(true)

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      const response = await userService.logout()
      if (response.status === 200) {
        message.success('Logout successful!')
        setTimeout(() => {
          window.location.href = '/login'
        }, 500)
      }
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Logout failed!')
    } finally {
      setIsLoggingOut(false)
    }
  }

  const handleChangePass = () => {}

  const moreMenuItems: MenuProps['items'] = [
    { key: 'changePass', label: 'Change Password', icon: <LockOutlined />, onClick: handleChangePass },
    { type: 'divider' },
    {
      key: 'logout',
      label: isLoggingOut ? 'Logging out...' : 'Logout',
      icon: <LogoutOutlined />,
      onClick: handleLogout,
      disabled: isLoggingOut
    }
  ]

  const fetchUserInfo = async () => {
    try {
      const response = await userService.getUserInfoByToken()
      if (response.status === 400) {
        const base = response.data as BaseResponse
        message.error(base.message)
      } else if (response.status === 200) {
        const resData = response.data as UserDto
        setItems((prev) => {
          if (prev.some((i) => i?.key === 'profile')) return prev
          return [
            ...prev,
            getItem(
              'Profile',
              'profile',
              <IconCircle
                bgColor='#E4E6EB'
                customIcon={<Avatar src={resData.avatarUrl || DEFAULT_AVATAR_URL} size={32} />}
              />
            )
          ]
        })
      }
    } catch {
      message.error('Error while getting user information!')
    }
  }

  useEffect(() => {
    setItems((prev) => {
      const profileItem = prev.find((i) => i?.key === 'profile')
      return profileItem ? [...baseItems, profileItem] : baseItems
    })
    fetchUserInfo()
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
          <Dropdown menu={{ items: moreMenuItems }} trigger={['click']}>
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

      <SearchComponent show={showSearch} onClose={() => setShowSearch(false)} onCollapseNavbar={handleCollapseNavbar} />
    </ConfigProvider>
  )
}

export default Navbar
