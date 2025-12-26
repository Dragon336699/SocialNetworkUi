import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input, Badge, Avatar, Dropdown, MenuProps, message, Button, Empty } from 'antd'
import {
  SearchOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  CheckCircleOutlined,
  LockOutlined
} from '@ant-design/icons'
import { useUserStore } from '@/app/stores/auth'
import { DEFAULT_AVATAR_URL } from '../Assests/CommonVariable'
import { userService } from '@/app/services/user.service'
import { notificationService } from '@/app/services/notification.service'
import { chatService } from '@/app/services/chat.service'
import { NotificationDto } from '@/app/types/Notification/notification.dto'
import { ResponseHasData } from '@/app/types/Base/Responses/ResponseHasData'
import { useUnread } from '../Contexts/UnreadContext'
import dayjs from 'dayjs'
import ChangePasswordPopup from '@/app/pages/ChangePassword/ChangePassword'

// interface HeaderProps {
//   showNoti: boolean
//   setShowNoti: React.Dispatch<React.SetStateAction<boolean>>
// }

const Header: React.FC = () => {
  const { user } = useUserStore()
  const navigate = useNavigate()
  const { unreadNotis, setUnreadNotis } = useUnread()
  const [notifications, setNotifications] = useState<NotificationDto[]>([])

  const [openChangePassword, setOpenChangePassword] = useState(false)

  const fetchNotifications = async () => {
    try {
      const response = await notificationService.getNotis(0, 15)
      if (response.status === 200) {
        const resData = response.data as ResponseHasData<NotificationDto[]>
        setNotifications(resData.data as NotificationDto[])
      }
    } catch (err) {
      console.error(err)
    }
  }

  const formatNotiTime = (time: Date) => {
    const now = dayjs()
    const updated = dayjs(time)
    const diffMinutes = now.diff(updated, 'minute')
    const diffHours = now.diff(updated, 'hour')
    if (diffMinutes < 60) return `${diffMinutes}m`
    if (diffHours < 24) return `${diffHours}h`
    return updated.format('DD/MM')
  }

  const highlightText = (content: string, highlights: { offset: number; length: number }[]) => {
    const parts = []
    let currentIndex = 0
    const sortedHighlights = [...(highlights ?? [])].sort((a, b) => a.offset - b.offset)
    for (const h of sortedHighlights) {
      if (currentIndex < h.offset) parts.push({ text: content.slice(currentIndex, h.offset), highlight: false })
      parts.push({ text: content.slice(h.offset, h.offset + h.length), highlight: true })
      currentIndex = h.offset + h.length
    }
    if (currentIndex < content.length) parts.push({ text: content.slice(currentIndex), highlight: false })
    return parts
  }

  const markNotiAsRead = async (notificationId: string) => {
    try {
      const response = await notificationService.markNotiAsRead(notificationId)
      if (response.status === 200) {
        setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, unread: false } : n)))
        setUnreadNotis((prev: number) => Math.max(0, prev - 1))
      }
    } catch (err) {
      console.error(err)
    }
  }

  const markAllNotisAsRead = async () => {
    try {
      const response = await notificationService.markAllNotisAsRead()
      if (response.status === 200) {
        setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
        setUnreadNotis(0)
        message.success('Marked all as read')
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchNotifications()
    chatService.updateNotification((newNoti: NotificationDto) => {
      setNotifications((prev) => {
        const exists = prev.some((noti) => noti.id === newNoti.id)
        setUnreadNotis((p: number) => p + 1)
        return exists ? prev.map((n) => (n.id === newNoti.id ? newNoti : n)) : [newNoti, ...prev]
      })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLogout = async () => {
    try {
      const response = await userService.logout()
      if (response.status === 200) {
        message.success('Logout successful!')
        setTimeout(() => {
          window.location.href = '/login'
        }, 500)
      }
    } catch {
      message.error('Logout failed!')
    }
  }

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      label: <span className='font-semibold'>Trang cá nhân</span>,
      icon: <UserOutlined />,
      onClick: () => navigate(`/profile/${user?.userName}`)
    },
    {
      key: 'settings',
      label: <span className='font-semibold'>Đổi mật khẩu</span>,
      icon: <LockOutlined />,
      onClick: () => setOpenChangePassword(true)
    },
    { type: 'divider' },
    {
      key: 'logout',
      label: <span className='font-semibold'>Đăng xuất</span>,
      icon: <LogoutOutlined />,
      danger: true,
      onClick: handleLogout
    }
  ]

  const notificationDropdown = (
    <div className='bg-white shadow-2xl rounded-2xl border border-slate-100 w-[380px] overflow-hidden'>
      <div className='flex items-center justify-between p-4 border-b border-slate-50'>
        Notifications
        <Button
          type='text'
          size='small'
          icon={<CheckCircleOutlined />}
          className='text-indigo-600 font-medium'
          onClick={markAllNotisAsRead}
        >
          Mark all as read
        </Button>
      </div>

      <div className='max-h-[450px] overflow-y-auto custom-scrollbar'>
        {notifications.length > 0 ? (
          notifications.map((noti) => (
            <div
              key={noti.id}
              className={`flex items-start gap-3 p-4 cursor-pointer transition-colors hover:bg-slate-50 ${noti.unread ? 'bg-indigo-50/30' : ''}`}
              onClick={() => {
                if (noti.unread) markNotiAsRead(noti.id)
                if (noti.navigateUrl) navigate(noti.navigateUrl)
              }}
            >
              <div className='relative flex-shrink-0'>
                {noti.imageUrls.length >= 2 ? (
                  <Avatar.Group size='small' maxCount={2}>
                    <Avatar src={noti.imageUrls[0]} />
                    <Avatar src={noti.imageUrls[1]} />
                  </Avatar.Group>
                ) : (
                  <Avatar size={45} src={noti.imageUrls[0] || DEFAULT_AVATAR_URL} />
                )}
                {noti.unread && (
                  <div className='absolute -top-0.5 -right-0.5 w-3 h-3 bg-indigo-500 rounded-full border-2 border-white' />
                )}
              </div>
              <div className='flex flex-col'>
                <span className='text-[13px] text-slate-800 leading-snug'>
                  {highlightText(noti.content, noti.highlights ?? []).map((p, i) =>
                    p.highlight ? (
                      <strong key={i} className='text-slate-900'>
                        {p.text}
                      </strong>
                    ) : (
                      <span key={i}>{p.text}</span>
                    )
                  )}
                </span>
                <span className='text-[11px] text-slate-400 font-medium mt-1'>{formatNotiTime(noti.updatedAt)}</span>
              </div>
            </div>
          ))
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='Không có thông báo nào' className='py-10' />
        )}
      </div>
      {/* <div className='p-2 text-center border-t border-slate-50'>
        <Button type='link' size='small' className='text-slate-500 font-bold'>
          View all notifications
        </Button>
      </div> */}
    </div>
  )

  return (
    <header className='h-16 w-full bg-white border-b border-slate-100 flex items-center justify-between px-4 md:px-8 sticky top-0 z-[100] shadow-sm'>
      <div className='flex items-center gap-3 w-[200px]'>
        <div className='w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100'>
          <span className='text-white font-black text-xl'>FC</span>
        </div>
        <span className='text-xl font-black tracking-tighter text-slate-800 hidden lg:block uppercase'>Fricon</span>
      </div>

      <div className='flex-1 max-w-xl mx-4'>
        <Input
          prefix={<SearchOutlined className='text-slate-400 mr-2' />}
          placeholder='Tìm kiếm...'
          className='rounded-2xl py-2 px-4 border-gray-200 bg-slate-50 hover:bg-slate-100 focus:bg-white transition-all'
          allowClear
        />
      </div>

      <div className='flex items-center gap-4 w-[240px]'>
        <Dropdown
          dropdownRender={() => (
            <div className='border border-gray-200 rounded-xl shadow-sm bg-white'>{notificationDropdown}</div>
          )}
          trigger={['click']}
          placement='bottom'
          arrow
        >
          <div className='w-10 h-10 flex items-center justify-center rounded-2xl cursor-pointer bg-slate-50 text-slate-600 hover:bg-slate-100 transition-all'>
            <Badge count={unreadNotis} size='small' offset={[2, -2]} color='#4f46e5'>
              <BellOutlined className='text-lg' />
            </Badge>
          </div>
        </Dropdown>

        <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement='bottomRight' arrow>
          <div className='flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 pl-1 pr-3 rounded-2xl transition-all border border-transparent hover:border-slate-100'>
            <Avatar src={user?.avatarUrl || DEFAULT_AVATAR_URL} className='shadow-sm' size={36} />
            <div className='hidden md:block text-left max-w-[160px]'>
              <div className='text-[13px] font-bold text-slate-800 leading-none truncate'>
                {user?.lastName} {user?.firstName}
              </div>
            </div>
          </div>
        </Dropdown>
      </div>
      <ChangePasswordPopup visible={openChangePassword} onClose={() => setOpenChangePassword(false)} />
    </header>
  )
}

export default Header
