import { userService } from '@/app/services/user.service'
import { BaseResponse } from '@/app/types/Base/Responses/baseResponse'
import { UserDto } from '@/app/types/User/user.dto'
import { faBell, faComment, faHouse } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Avatar, Badge, ConfigProvider, Menu, MenuProps, message } from 'antd'
import Sider from 'antd/es/layout/Sider'
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useUnread } from '../Contexts/UnreadContext'

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
  const { unreadMessages } = useUnread()

  const [items, setItems] = useState<MenuItem[]>([])
  const baseItems = useMemo<MenuItem[]>(
    () => [
      getItem(
        'Home',
        'Home',
        <div className='flex items-center gap-6'>
          <FontAwesomeIcon className='text-lg text-white' icon={faHouse} />
        </div>
      ),
      getItem(
        'Inbox',
        'Inbox',
        <div className='flex items-center gap-6'>
          <Badge count={unreadMessages} size='small'>
            <FontAwesomeIcon className='text-lg text-white' icon={faComment} />
          </Badge>
        </div>
      ),
      getItem(
        'Notification',
        'Notification',
        <div className='flex items-center gap-6'>
          <Badge size='small'>
            <FontAwesomeIcon className='text-lg text-white' icon={faBell} />
          </Badge>
        </div>
      )
    ],
    [unreadMessages]
  )
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  const path = location.pathname.split('/')[1] || 'Home'

  const handleNavigate = (e: any) => {
    if (e.key === 'Inbox') window.location.href = '/Inbox'
    else navigate(`/${e.key}`)
  }

  const fetchUserInfo = async () => {
    try {
      const response = await userService.getUserInfoByToken()
      if (response.status === 400) {
        const base = response.data as BaseResponse
        message.error(base.message)
      } else if (response.status === 200) {
        const resData = response.data as UserDto
        setItems((prev) => {
          if (prev.some((i) => i?.key === 'Profile')) return prev
          return [...prev, getItem('Profile', 'Profile', <Avatar src={resData.avatarUrl} size='small' />)]
        })
      }
    } catch (err) {
      message.error('Error while getting user infomation!')
    }
  }

  useEffect(() => {
    setItems((prev) => {
      const profileItem = prev.find((i) => i?.key === 'Profile')
      return profileItem ? [...baseItems, profileItem] : baseItems
    })
    fetchUserInfo()
  }, [baseItems])
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
          <Menu theme='dark' selectedKeys={[path]} mode='inline' items={items} onClick={handleNavigate} />
        </ConfigProvider>
      </Sider>
    </ConfigProvider>
  )
}

export default Navbar
