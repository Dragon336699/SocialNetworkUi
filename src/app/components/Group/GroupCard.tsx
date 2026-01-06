import { Button, Typography, message, Avatar } from 'antd'
import { UserOutlined, FileTextOutlined, EyeOutlined, ClockCircleOutlined, CloseOutlined } from '@ant-design/icons'
import { GroupDto } from '@/app/types/Group/group.dto'
import { groupService } from '@/app/services/group.service'
import { useState, useRef, useEffect } from 'react'
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

const GroupCard = ({ group, showActions = true, isJoined = false, isPending = false }: GroupCardProps) => {
  const [loading, setLoading] = useState(false)
  const [joined, setJoined] = useState(isJoined)
  const [pending, setPending] = useState(isPending)
  const [currentGroup, setCurrentGroup] = useState(group)
  const [showPendingDropdown, setShowPendingDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

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

  const handleJoinGroup = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    try {
      setLoading(true)
      await groupService.joinGroup(currentGroup.id)
      message.success('Join request sent! Waiting for approval.')
      setPending(true)
      setJoined(false)
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
      setShowPendingDropdown(false)
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Unable to cancel request'
      message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handlePendingClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowPendingDropdown(!showPendingDropdown)
  }

  const handleViewGroup = () => {
    if (joined) {
      navigate(`/groups/${currentGroup.id}`)
    } else {
      navigate(`/group/${currentGroup.id}`)
    }
  }

  return (
    <div
      className='bg-white rounded-lg border-2 border-gray-200 shadow-sm hover:shadow-lg transition-all cursor-pointer h-48'
      onClick={handleViewGroup}
    >
      <div className='flex h-full'>
        {/* Image Section - Left */}
        <div className='w-36 sm:w-40 flex-shrink-0 bg-gray-200 overflow-hidden rounded-l-lg'>
          {currentGroup.imageUrl && currentGroup.imageUrl !== 'default-group-image.jpg' ? (
            <img src={currentGroup.imageUrl} alt={currentGroup.name} className='w-full h-full object-cover' />
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
        <div className='flex-1 p-4 flex flex-col overflow-visible' onClick={(e) => e.stopPropagation()}>
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
            <div className='border-b-2 border-gray-200 mt-auto'></div>
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
              <div className='flex gap-2 mt-3 relative'>
                {!joined && !pending ? (
                  <Button type='primary' onClick={handleJoinGroup} loading={loading} block size='small'>
                    Join
                  </Button>
                ) : pending ? (
                  <div ref={dropdownRef} className='w-full relative'>
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

                    {/* Custom Dropdown Menu */}
                    {showPendingDropdown && (
                      <div className='absolute left-0 top-full mt-1 w-full bg-white rounded shadow-md border border-gray-300 z-50'>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleCancelJoinRequest()
                          }}
                          className='w-full flex items-center justify-center gap-1 px-2 py-1.5 hover:bg-red-50 text-left border-0 bg-transparent transition-colors'
                        >
                          <CloseOutlined className='text-xs text-red-500' />
                          <span className='text-xs font-medium text-red-500'>Cancel</span>
                        </button>
                      </div>
                    )}
                  </div>
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
