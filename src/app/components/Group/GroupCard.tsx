import { Button, Typography, Space, message, Avatar } from 'antd'
import { UserOutlined, FileTextOutlined, EyeOutlined, ClockCircleOutlined, CloseOutlined } from '@ant-design/icons'
import { GroupDto, GroupRole } from '@/app/types/Group/group.dto'
import { groupService } from '@/app/services/group.service'
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useDevice from '@/app/hook/useDeivce'

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
  const [showPendingDropdown, setShowPendingDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

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
      setShowPendingDropdown(false)
      if (onJoinSuccess) onJoinSuccess()
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
      className='bg-white rounded-lg border-2 border-gray-200 shadow-sm hover:shadow-lg transition-all cursor-pointer flex flex-col lg:flex-row overflow-hidden h-full'
      onClick={handleViewGroup}
    >
      <div className='w-full h-32 lg:w-40 lg:h-auto flex-shrink-0 bg-gray-200 overflow-hidden'>
        {currentGroup.imageUrl && currentGroup.imageUrl !== 'default-group-image.jpg' ? (
          <img src={currentGroup.imageUrl} alt={currentGroup.name} className='w-full h-full object-cover' />
        ) : (
          <div className='w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600'>
            <Avatar
              size={40}
              style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
              className='text-white text-xl font-bold'
            >
              {currentGroup.name[0]?.toUpperCase() || 'G'}
            </Avatar>
          </div>
        )}
      </div>

      <div className='flex-1 p-3 lg:p-4 flex flex-col min-w-0' onClick={(e) => e.stopPropagation()}>
        <div className='flex flex-col border-b border-gray-100 pb-2 mb-2'>
          <Title
            level={5}
            className='mb-0 truncate'
            style={{
              fontSize: '15px',
              fontWeight: 600,
              lineHeight: '1.4'
            }}
            title={currentGroup.name}
          >
            {currentGroup.name}
          </Title>
        </div>

        <div className='flex-1 flex flex-col justify-between gap-3'>
          <div className='flex flex-row lg:flex-col flex-wrap gap-x-4 gap-y-1'>
            <div className='flex items-center gap-1.5'>
              <UserOutlined className='text-gray-500 text-[12px]' />
              <Text className='text-[12px] text-gray-700 font-medium whitespace-nowrap'>
                {currentGroup.memberCount} user
              </Text>
            </div>
            <div className='flex items-center gap-1.5'>
              <FileTextOutlined className='text-gray-500 text-[12px]' />
              <Text className='text-[12px] text-gray-700 font-medium whitespace-nowrap'>
                {currentGroup.postCount} post
              </Text>
            </div>
          </div>

          {showActions && (
            <div className='mt-auto relative'>
              {!joined && !pending ? (
                <Button
                  type='primary'
                  onClick={handleJoinGroup}
                  loading={loading}
                  block
                  size='small'
                  className='text-[12px] h-8'
                >
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
                    className='text-[12px] h-8'
                  >
                    Pending
                  </Button>
                  {showPendingDropdown && (
                    <div className='absolute left-0 bottom-full mb-1 w-full bg-white rounded shadow-xl border border-gray-200 z-50'>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCancelJoinRequest()
                        }}
                        className='w-full flex items-center justify-center gap-2 p-2 hover:bg-red-50 text-red-500 border-0 bg-transparent transition-colors'
                      >
                        <CloseOutlined className='text-xs' />
                        <span className='text-xs font-bold'>Cancel Request</span>
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
                  className='text-[12px] h-8'
                >
                  View
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default GroupCard