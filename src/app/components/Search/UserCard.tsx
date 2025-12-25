import { Button, Typography, Avatar, message } from 'antd'
import { UserOutlined, UserAddOutlined, CheckOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { UserDto } from '@/app/types/User/user.dto'
import { relationService } from '@/app/services/relation.service'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const { Title, Text } = Typography

interface UserCardProps {
  user: UserDto
  currentUserId?: string
  isFriend?: boolean
  isPending?: boolean
  onStatusChange?: () => void
}

const UserCard = ({
  user,
  currentUserId = '',
  isFriend = false,
  isPending = false,
  onStatusChange
}: UserCardProps) => {
  const [loading, setLoading] = useState(false)
  const [friendStatus, setFriendStatus] = useState(isFriend)
  const [pendingStatus, setPendingStatus] = useState(isPending)
  const navigate = useNavigate()

  const handleAddFriend = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    try {
      setLoading(true)
      const response = await relationService.addFriend(user.id)
      if (response.status === 200) {
        message.success('Friend request sent!')
        setPendingStatus(true)
        setFriendStatus(false)
        if (onStatusChange) onStatusChange()
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to send friend request'
      message.error(errorMessage)
    } finally {
      setLoading(false)
    }
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
        >
          Friends
        </Button>
      )
    }

    if (pendingStatus) {
      return (
        <Button
          type='default'
          icon={<ClockCircleOutlined />}
          disabled
          className='bg-blue-50 text-blue-600 border-blue-300'
          block
        >
          Pending
        </Button>
      )
    }

    return (
      <Button
        type='primary'
        icon={<UserAddOutlined />}
        loading={loading}
        onClick={handleAddFriend}
        block
      >
        Add Friend
      </Button>
    )
  }

  return (
    <div 
      className='bg-white rounded-lg border-2 border-black shadow-sm hover:shadow-lg transition-all cursor-pointer overflow-hidden'
      onClick={handleViewProfile}
      style={{ height: '320px' }}
    >
      <div className='flex flex-col h-full'>
        {/* Avatar Section - Top */}
        <div className='h-40 flex-shrink-0 bg-gray-200'>
          {user.avatarUrl ? (
            <img 
              src={user.avatarUrl} 
              alt={user.userName} 
              className='w-full h-full object-cover' 
            />
          ) : (
            <div className='w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600'>
              <Avatar
                size={80}
                style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
                className='text-white text-3xl font-bold'
                icon={<UserOutlined />}
              >
                {user.userName[0]?.toUpperCase() || user.firstName?.[0]?.toUpperCase() || 'U'}
              </Avatar>
            </div>
          )}
        </div>

        {/* Content Section - Bottom */}
        <div className='flex-1 p-4 flex flex-col' onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className='mb-3'>
            <Title 
              level={5} 
              className='mb-1 line-clamp-1 overflow-hidden' 
              style={{ 
                fontSize: '16px', 
                fontWeight: 600
              }}
            >
              {user.userName}
            </Title>
            <div className='border-b-2 border-black'></div>
          </div>
          
          {/* Info & Actions */}
          <div className='flex-1 flex flex-col justify-between'>
            {/* User Info */}
            <div className='flex flex-col gap-2 mb-3'>
              <div className='flex items-center gap-2'>
                <UserOutlined className='text-black text-sm flex-shrink-0' />
                <Text className='text-sm text-black font-medium line-clamp-1'>
                  {`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'No name'}
                </Text>
              </div>
              {user.email && (
                <div className='flex items-center gap-2'>
                  <svg className='w-4 h-4 text-black flex-shrink-0' fill='currentColor' viewBox='0 0 20 20'>
                    <path d='M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z' />
                    <path d='M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z' />
                  </svg>
                  <Text className='text-sm text-black font-medium line-clamp-1'>
                    {user.email}
                  </Text>
                </div>
              )}
            </div>

            {/* Action Button */}
            <div>
              {renderActionButton()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserCard