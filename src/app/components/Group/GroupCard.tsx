import { Button, Typography, Space, message, Avatar, Dropdown } from 'antd'
import type { MenuProps } from 'antd'
import { UserOutlined, FileTextOutlined, EyeOutlined, ClockCircleOutlined, CloseOutlined } from '@ant-design/icons'
import { GroupDto, GroupRole } from '@/app/types/Group/group.dto'
import { groupService } from '@/app/services/group.service'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const { Title, Text } = Typography

interface GroupCardProps {
  group: GroupDto
  onGroupDeleted?: (groupId: string) => void
  onGroupUpdated?: (group: GroupDto) => void
  showActions?: boolean
  isJoined?: boolean
  isPending?: boolean
  onJoinSuccess?: () => void
  currentUserId?: string
}

const GroupCard = ({
  group,
  onGroupDeleted,
  onGroupUpdated,
  showActions = true,
  isJoined = false,
  isPending = false,
  onJoinSuccess,
  currentUserId = ''
}: GroupCardProps) => {
  const [loading, setLoading] = useState(false)
  const [joined, setJoined] = useState(isJoined)
  const [pending, setPending] = useState(isPending)
  const [currentGroup, setCurrentGroup] = useState(group)
  const navigate = useNavigate()

  const handleJoinGroup = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    try {
      setLoading(true)
      await groupService.joinGroup(currentGroup.id)
      message.success('Join request sent! Waiting for approval.')
      setPending(true)
      setJoined(false)
      if (onJoinSuccess) onJoinSuccess()
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Unable to send join request'
      message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelJoinRequest = async () => {
    try {
      setLoading(true)
      await groupService.cancelJoinRequest(currentGroup.id)
      message.success('Join request cancelled!')
      setPending(false)
      setJoined(false)
      if (onJoinSuccess) onJoinSuccess()
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Unable to cancel request'
      message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleLeaveGroup = async () => {
    try {
      setLoading(true)
      await groupService.leaveGroup(currentGroup.id)
      message.success('Successfully left the group!')
      setJoined(false)
      if (onJoinSuccess) onJoinSuccess()
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Unable to leave group'
      message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteGroup = async () => {
    try {
      setLoading(true)
      await groupService.deleteGroup(currentGroup.id)
      message.success('Successfully deleted the group!')
      if (onGroupDeleted) onGroupDeleted(currentGroup.id)
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Unable to delete group'
      message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handlePendingClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  const handleViewGroup = () => {
    if (joined) {
      navigate(`/groups/${currentGroup.id}`)
    } else {
      navigate(`/group/${currentGroup.id}`)
    }
  }

  const pendingMenuItems: MenuProps['items'] = [
    {
      key: 'cancel',
      label: 'Cancel Request',
      icon: <CloseOutlined />,
      danger: true,
      onClick: (e) => {
        e?.domEvent?.stopPropagation()
        handleCancelJoinRequest()
      }
    }
  ]

  return (
    <div 
      className='bg-white rounded-lg border-2 border-black shadow-sm hover:shadow-lg transition-all cursor-pointer overflow-hidden h-48'
      onClick={handleViewGroup}
    >
      <div className='flex h-full'>
        {/* Image Section - Left */}
        <div className='w-36 sm:w-40 flex-shrink-0 bg-gray-200'>
          {currentGroup.imageUrl && currentGroup.imageUrl !== 'default-group-image.jpg' ? (
            <img 
              src={currentGroup.imageUrl} 
              alt={currentGroup.name} 
              className='w-full h-full object-cover' 
            />
          ) : (
            <div className='w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600'>
              <Avatar
                size={60}
                style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
                className='text-white text-2xl font-bold'
              >
                {currentGroup.name[0]?.toUpperCase() || 'G'}
              </Avatar>
            </div>
          )}
        </div>

        {/* Content Section - Right */}
        <div className='flex-1 p-4 flex flex-col' onClick={(e) => e.stopPropagation()}>
          {/* Header - Fixed height area */}
          <div className='flex flex-col' style={{ minHeight: '60px', maxHeight: '60px' }}>
            <Title 
              level={5} 
              className='mb-0 line-clamp-2 overflow-hidden' 
              style={{ 
                fontSize: '15px', 
                fontWeight: 600,
                lineHeight: '1.4'
              }}
            >
              {currentGroup.name}
            </Title>
            <div className='border-b-2 border-black mt-auto'></div>
          </div>
          
          {/* Stats & Actions - Remaining space */}
          <div className='flex-1 flex flex-col justify-between pt-3'>
            {/* Stats */}
            <div className='flex flex-col gap-2'>
              <div className='flex items-center gap-2'>
                <UserOutlined className='text-black text-sm' />
                <Text className='text-sm text-black font-medium'>
                  {currentGroup.memberCount} {currentGroup.memberCount === 1 ? 'user' : 'users'}
                </Text>
              </div>
              <div className='flex items-center gap-2'>
                <FileTextOutlined className='text-black text-sm' />
                <Text className='text-sm text-black font-medium'>
                  {currentGroup.postCount} {currentGroup.postCount === 1 ? 'post' : 'posts'}
                </Text>
              </div>
            </div>

            {/* Actions */}
            {showActions && (
              <div className='flex gap-2 mt-3'>
                {!joined && !pending ? (
                  <Button 
                    type='primary' 
                    onClick={handleJoinGroup} 
                    loading={loading} 
                    block
                    size='small'
                  >
                    Join
                  </Button>
                ) : pending ? (
                  <Dropdown menu={{ items: pendingMenuItems }} trigger={['click']} placement='bottomRight'>
                    <Button
                      icon={<ClockCircleOutlined />}
                      onClick={handlePendingClick}
                      type='default'
                      loading={loading}
                      block
                      size='small'
                    >
                      Pending
                    </Button>
                  </Dropdown>
                ) : (
                  <Button
                    icon={<EyeOutlined />}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleViewGroup()
                    }}
                    block
                    size='small'
                  >
                    View
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default GroupCard