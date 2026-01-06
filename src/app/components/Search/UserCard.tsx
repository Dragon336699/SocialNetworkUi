import { Button, Typography, Avatar, message } from 'antd'
import { UserOutlined, UserAddOutlined, CheckOutlined, ClockCircleOutlined, CloseOutlined } from '@ant-design/icons'
import { UserDto } from '@/app/types/User/user.dto'
import { relationService } from '@/app/services/relation.service'
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const { Title, Text } = Typography

interface UserCardProps {
  user: UserDto
  currentUserId?: string
  isFriend?: boolean
  isPending?: boolean
  onStatusChange?: () => void
}

const UserCard = ({ user, currentUserId = '', isFriend = false, isPending = false }: UserCardProps) => {
  const [loading, setLoading] = useState(false)
  const [friendStatus, setFriendStatus] = useState(isFriend)
  const [pendingStatus, setPendingStatus] = useState(isPending)
  const [showPendingDropdown, setShowPendingDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  // Sync props with state when props change
  useEffect(() => {
    setFriendStatus(isFriend)
  }, [isFriend])

  useEffect(() => {
    setPendingStatus(isPending)
  }, [isPending])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowPendingDropdown(false)
      }
    }

    if (showPendingDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showPendingDropdown])

  const handleAddFriend = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    try {
      setLoading(true)
      await relationService.addFriend(user.id)
      message.success('Friend request sent!')
      setPendingStatus(true)
      setFriendStatus(false)
      // Don't call onStatusChange here - state is already updated locally
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to send friend request'
      message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelFriendRequest = async () => {
    try {
      setLoading(true)
      await relationService.cancelFriendRequest(user.id)
      message.success('Friend request cancelled!')
      setPendingStatus(false)
      setShowPendingDropdown(false)
      // Don't call onStatusChange here - state is already updated locally
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to cancel friend request'
      message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handlePendingClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowPendingDropdown(!showPendingDropdown)
  }

  const handleViewProfile = () => {
    navigate(`/profile/${user.userName}`)
  }

  const renderActionButton = () => {
    if (user.id === currentUserId) {
      return null
    }

    if (friendStatus) {
      return (
        <Button
          type='default'
          icon={<CheckOutlined />}
          disabled
          className='bg-gray-100 text-gray-600 border-gray-300'
          block
          size='small'
        >
          Friends
        </Button>
      )
    }

    if (pendingStatus) {
      return (
        <div ref={dropdownRef} className='w-full relative'>
          <Button
            icon={<ClockCircleOutlined />}
            onClick={handlePendingClick}
            type='default'
            loading={loading}
            block
            size='small'
            className='bg-blue-50 text-blue-600 border-blue-300'
          >
            Pending
          </Button>

          {/* Custom Dropdown Menu */}
          {showPendingDropdown && (
            <div className='absolute left-0 top-full mt-1 w-full bg-white rounded shadow-md border border-gray-300 z-50'>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleCancelFriendRequest()
                }}
                className='w-full flex items-center justify-center gap-1 px-2 py-1.5 hover:bg-red-50 text-left border-0 bg-transparent transition-colors'
              >
                <CloseOutlined className='text-xs text-red-500' />
                <span className='text-xs font-medium text-red-500'>Cancel</span>
              </button>
            </div>
          )}
        </div>
      )
    }

    return (
      <Button type='primary' icon={<UserAddOutlined />} loading={loading} onClick={handleAddFriend} block size='small'>
        Add Friend
      </Button>
    )
  }

  return (
    <div
      className='bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer'
      onClick={handleViewProfile}
      style={{ height: '220px' }}
    >
      <div className='flex flex-col h-full'>
        {/* Avatar Section - Top */}
        <div className='h-20 flex-shrink-0 bg-gray-200 overflow-hidden rounded-t-lg'>
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.userName} className='w-full h-full object-cover' />
          ) : (
            <div className='w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600'>
              <Avatar
                size={40}
                style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
                className='text-white text-lg font-bold'
                icon={<UserOutlined />}
              >
                {user.userName[0]?.toUpperCase() || user.firstName?.[0]?.toUpperCase() || 'U'}
              </Avatar>
            </div>
          )}
        </div>

        {/* Content Section - Bottom */}
        <div className='flex-1 p-2.5 flex flex-col overflow-visible' onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className='mb-1.5'>
            <Title
              level={5}
              className='mb-0.5 line-clamp-1 overflow-hidden'
              style={{
                fontSize: '13px',
                fontWeight: 600
              }}
            >
              {user.userName}
            </Title>
            <div className='border-b border-gray-200'></div>
          </div>

          {/* Info & Actions */}
          <div className='flex-1 flex flex-col justify-between'>
            {/* User Info */}
            <div className='flex flex-col gap-1 mb-1.5'>
              <div className='flex items-center gap-1.5'>
                <UserOutlined className='text-gray-600 text-xs flex-shrink-0' />
                <Text className='text-xs text-gray-700 font-medium line-clamp-1'>
                  {`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'No name'}
                </Text>
              </div>
            </div>

            {/* Action Button */}
            <div>{renderActionButton()}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserCard
