import React, { useEffect, useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Input, Badge, Avatar, Dropdown, MenuProps, message, Button, Empty, Spin } from 'antd'
import {
  SearchOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  CheckCircleOutlined,
  LockOutlined,
  CloseOutlined
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
import { searchService } from '@/app/services/search.service'
import { SearchType, SearchResultDto, SearchHistoryDto } from '@/app/types/Search/SearchType'
import { groupService } from '@/app/services/group.service'
import { GroupRole } from '@/app/types/Group/group.dto'
import { interactionService } from '@/app/services/interaction.service'

const Header: React.FC = () => {
  const { user } = useUserStore()
  const navigate = useNavigate()
  const location = useLocation()
  const { unreadNotis, setUnreadNotis } = useUnread()
  const [notifications, setNotifications] = useState<NotificationDto[]>([])

  const [openChangePassword, setOpenChangePassword] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResultDto | null>(null)
  const [searchHistory, setSearchHistory] = useState<SearchHistoryDto[]>([])
  const [myGroupIds, setMyGroupIds] = useState<string[]>([])
  const [currentUserId, setCurrentUserId] = useState<string>('')

  const debounceRef = useRef<NodeJS.Timeout>()
  const searchInputRef = useRef<any>(null)
  const searchDropdownRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    const fetchCurrentUserId = async () => {
      try {
        const response = await userService.getUserInfoByToken()
        if (response.status === 200 && response.data && 'id' in response.data) {
          setCurrentUserId(response.data.id)
        }
      } catch (error) {
        console.error('Error fetching current user:', error)
      }
    }
    fetchCurrentUserId()
  }, [])

  useEffect(() => {
    const fetchMyGroups = async () => {
      try {
        const response = await groupService.getMyGroups(0, 100)
        const approvedGroupIds = (response.groups || [])
          .filter((group) => {
            const userStatus = group.groupUsers?.find((gu) => gu.userId === currentUserId)
            return userStatus && userStatus.roleName !== GroupRole.Pending
          })
          .map((group) => group.id)
        setMyGroupIds(approvedGroupIds)
      } catch (error) {
        console.error('Error fetching my groups:', error)
      }
    }

    if (currentUserId) {
      fetchMyGroups()
    }
  }, [currentUserId])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target as Node)) {
        setShowSearch(false)
      }
    }

    if (showSearch) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showSearch])

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (searchValue.trim()) {
      debounceRef.current = setTimeout(() => {
        handleSearchPreview(searchValue)
      }, 500)
    } else {
      setSearchResults(null)
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [searchValue])

  const loadSearchHistory = async () => {
    try {
      const response = await searchService.getRecentSearches(10)
      setSearchHistory(response.data || [])
    } catch (error) {
      console.error('Error loading search history:', error)
    }
  }

  const handleSearchPreview = async (keyword: string) => {
    if (!keyword.trim()) {
      setSearchResults(null)
      return
    }

    setIsSearching(true)
    try {
      const response = await searchService.search(keyword, SearchType.All, 0, 10, false)
      setSearchResults(response.results || null)
    } catch (error) {
      console.error('Error searching:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearchSubmit = async () => {
    if (searchValue.trim()) {
      try {
        await searchService.saveSearchHistory(searchValue.trim(), undefined, undefined)
        await loadSearchHistory()
      } catch (error) {
        console.error('Error saving search history:', error)
      }

      navigate(`/search?q=${encodeURIComponent(searchValue.trim())}`)
      setShowSearch(false)
      setSearchValue('')
      setSearchResults(null)
    }
  }

  const handleDeleteHistory = async (historyId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await searchService.deleteSearchHistory(historyId)
      setSearchHistory((prev) => prev.filter((item) => item.id !== historyId))
      message.success('History cleared.')
    } catch (error) {
      console.error('Error deleting history:', error)
      message.error('Unable to clear history.')
    }
  }

  const handleClearAllHistory = async () => {
    try {
      await searchService.clearAllSearchHistory()
      setSearchHistory([])
      message.success('All history has been cleared.')
    } catch (error) {
      console.error('Error clearing history:', error)
      message.error('Unable to clear history.')
    }
  }

  const handleHistoryClick = (history: SearchHistoryDto) => {
    if (history.navigateUrl) {
      navigate(history.navigateUrl)
    } else if (history.content) {
      navigate(`/search?q=${encodeURIComponent(history.content)}`)
    }
    setShowSearch(false)
    setSearchValue('')
    setSearchResults(null)
  }

  const handleResultClick = async (type: 'user' | 'group', item: any) => {
    try {
      if (type === 'user') {
        await searchService.saveSearchHistory(item.userName, item.avatarUrl || undefined, `/profile/${item.userName}`)
      } else if (type === 'group') {
        const isJoined = myGroupIds.includes(item.id)
        const navigateUrl = isJoined ? `/groups/${item.id}` : `/group/${item.id}`
        await searchService.saveSearchHistory(item.name, item.imageUrl || undefined, navigateUrl)
      }

      await loadSearchHistory()
    } catch (error) {
      console.error('Error saving search history:', error)
    }

    if (type === 'user') {
      interactionService.searchUser(item.id)
      navigate(`/profile/${item.userName}`)
    } else if (type === 'group') {
      const isJoined = myGroupIds.includes(item.id)
      if (isJoined) {
        navigate(`/groups/${item.id}`)
      } else {
        navigate(`/group/${item.id}`)
      }
    }
    setShowSearch(false)
    setSearchValue('')
  }

  const handleSearchFocus = () => {
    setShowSearch(true)
    loadSearchHistory()
  }

  const handleClearInput = () => {
    setSearchValue('')
    setSearchResults(null)
    setTimeout(() => {
      searchInputRef.current?.focus()
    }, 0)
  }

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
                    <Avatar src={noti.imageUrls[0]} className='border border-gray-200' />
                    <Avatar src={noti.imageUrls[1]} className='border border-gray-200' />
                  </Avatar.Group>
                ) : (
                  <Avatar
                    size={45}
                    src={noti.imageUrls[0] || DEFAULT_AVATAR_URL}
                    className='border-2 border-gray-200'
                  />
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
    </div>
  )

  const renderSearchDropdown = () => {
    if (searchValue.trim() && searchResults) {
      const { users, groups } = searchResults
      const hasResults = (users && users.length > 0) || (groups && groups.length > 0)

      if (!hasResults) {
        return (
          <div className='flex items-center justify-center py-8'>
            <Empty description='No search results found.' image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </div>
        )
      }

      return (
        <div className='max-h-[400px] overflow-y-auto'>
          {users &&
            users.map((user) => (
              <div
                key={user.id}
                className='flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors'
                onClick={() => handleResultClick('user', user)}
              >
                <Avatar src={user.avatarUrl} size={44} icon={<UserOutlined />} className='border-2 border-gray-200' />
                <div className='ml-3 flex-1 min-w-0'>
                  <div className='font-semibold text-gray-900 text-sm'>{user.userName}</div>
                  <div className='text-xs text-gray-500'>{user.firstName}</div>
                </div>
              </div>
            ))}

          {groups &&
            groups.map((group) => (
              <div
                key={group.id}
                className='flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors'
                onClick={() => handleResultClick('group', group)}
              >
                <Avatar src={group.imageUrl} size={44} icon={<UserOutlined />} className='border-2 border-gray-200' />
                <div className='ml-3 flex-1 min-w-0'>
                  <div className='font-semibold text-gray-900 text-sm'>{group.name}</div>
                  <div className='text-xs text-gray-500'>{group.isPublic ? 'Public' : 'Private'} Group</div>
                </div>
              </div>
            ))}
        </div>
      )
    }

    return (
      <div>
        <div className='flex items-center justify-between px-4 py-3 border-b border-gray-200'>
          <h3 className='text-sm font-bold text-gray-900'>Recent</h3>
          {searchHistory.length > 0 && (
            <button
              onClick={handleClearAllHistory}
              className='text-xs text-blue-600 hover:text-blue-700 font-semibold transition-colors'
            >
              Clear all
            </button>
          )}
        </div>

        {searchHistory.length === 0 ? (
          <div className='flex items-center justify-center py-8'>
            <Empty description='No recent searches.' image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </div>
        ) : (
          <div className='max-h-[400px] overflow-y-auto'>
            {searchHistory.map((history) => (
              <div
                key={history.id}
                className='flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors group'
                onClick={() => handleHistoryClick(history)}
              >
                <div className='flex items-center flex-1 min-w-0'>
                  {history.imageUrl ? (
                    <Avatar
                      src={history.imageUrl}
                      size={44}
                      icon={history.navigateUrl?.includes('/profile') ? <UserOutlined /> : <UserOutlined />}
                      className='border-2 border-gray-200'
                    />
                  ) : (
                    <div className='w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center'>
                      <SearchOutlined className='text-gray-500 text-lg' />
                    </div>
                  )}
                  <div className='ml-3 flex-1 min-w-0'>
                    <div className='text-sm font-semibold text-gray-900 truncate'>{history.content}</div>
                  </div>
                </div>
                <button
                  onClick={(e) => handleDeleteHistory(history.id, e)}
                  className='ml-2 p-2 rounded-full text-gray-400 hover:text-gray-600 transition-colors opacity-0 group-hover:opacity-100'
                >
                  <CloseOutlined className='text-sm' />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <header className='h-16 w-full bg-white border-b border-slate-100 flex items-center justify-between px-4 md:px-8 sticky top-0 z-[100] shadow-sm'>
        <div className='flex items-center gap-3 w-[200px]'>
          <div className='w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100'>
            <span className='text-white font-black text-xl'>FC</span>
          </div>
          <span className='text-xl font-black tracking-tighter text-slate-800 hidden lg:block uppercase'>Fricon</span>
        </div>

        <div className='flex-1 max-w-xl mx-4 relative' ref={searchDropdownRef}>
          <Input
            ref={searchInputRef}
            prefix={<SearchOutlined className='text-slate-400 mr-2' />}
            placeholder='Tìm kiếm...'
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onFocus={handleSearchFocus}
            onPressEnter={handleSearchSubmit}
            suffix={
              isSearching ? (
                <Spin size='small' />
              ) : searchValue ? (
                <CloseOutlined
                  className='text-gray-400 cursor-pointer hover:text-gray-600 transition-colors'
                  onClick={handleClearInput}
                />
              ) : null
            }
            className='rounded-2xl py-2 px-4 border-gray-200 bg-slate-50 hover:bg-slate-100 focus:bg-white transition-all'
          />

          {showSearch && (
            <div className='absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-2xl border border-gray-200 z-50'>
              {renderSearchDropdown()}
            </div>
          )}
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
            <div className='flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 pl-1 pr-3 rounded-2xl transition-all border border-transparent hover:border-slate-100 items-end'>
              <Avatar
                src={user?.avatarUrl || DEFAULT_AVATAR_URL}
                className='shadow-sm border-2 border-gray-200'
                size={36}
              />
              <div className='hidden md:block text-left max-w-[160px]'></div>
            </div>
          </Dropdown>
        </div>
        <ChangePasswordPopup visible={openChangePassword} onClose={() => setOpenChangePassword(false)} />
      </header>
    </>
  )
}

export default Header
