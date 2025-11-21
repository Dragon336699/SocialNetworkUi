import { Card, Button, Typography, Space, Tag, message, Popconfirm, Avatar, Dropdown } from 'antd'
import type { MenuProps } from 'antd'
import {
  UserOutlined,
  FileTextOutlined,
  GlobalOutlined,
  LockOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  MoreOutlined
} from '@ant-design/icons'
import { GroupDto } from '@/app/types/Group/group.dto'
import { groupService } from '@/app/services/group.service'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import EditGroupModal from '../../common/Modals/Group/EditGroupModal'

const { Title, Text, Paragraph } = Typography

interface GroupCardProps {
  group: GroupDto
  onGroupDeleted?: (groupId: string) => void
  onGroupUpdated?: (group: GroupDto) => void
  showActions?: boolean
  isJoined?: boolean
  onJoinSuccess?: () => void
  currentUserId?: string
}

const GroupCard = ({
  group,
  onGroupDeleted,
  onGroupUpdated,
  showActions = true,
  isJoined = false,
  onJoinSuccess,
  currentUserId = ''
}: GroupCardProps) => {
  const [loading, setLoading] = useState(false)
  const [joined, setJoined] = useState(isJoined)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [currentGroup, setCurrentGroup] = useState(group)
  const navigate = useNavigate()

  // Kiểm tra xem người dùng hiện tại có phải là admin không
  const isAdmin =
    currentGroup.groupUsers?.some( gu => gu.userId === currentUserId && gu.roleName === 'Administrator') ?? false

  // Xử lý tham gia nhóm
  const handleJoinGroup = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    try {
      setLoading(true)
      await groupService.joinGroup(currentGroup.id)
      message.success('Successfully joined the group!')
      setJoined(true)
      if (onJoinSuccess) onJoinSuccess()
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Unable to join group'
      message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Xử lý rời khỏi nhóm
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

  // Xử lý xóa nhóm
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

  // Xử lý click nút chỉnh sửa
  const handleEditClick = () => {
    setIsEditModalOpen(true)
  }

  // Xử lý khi chỉnh sửa nhóm thành công
  const handleEditGroupSuccess = (updatedGroup: GroupDto) => {
    setCurrentGroup(updatedGroup)
    setIsEditModalOpen(false)
    if (onGroupUpdated) onGroupUpdated(updatedGroup)
  }

  // Xử lý xem nhóm
  const handleViewGroup = () => {
    navigate(`/group/${currentGroup.id}`)
  }

  // Menu cho thành viên thường (không phải admin)
  const memberMenuItems: MenuProps['items'] = [
    {
      key: 'leave',
      label: 'Leave Group',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: handleLeaveGroup
    }
  ]

  // Menu cho admin
  const adminMenuItems: MenuProps['items'] = [
    {
      key: 'edit',
      label: 'Edit Group',
      icon: <EditOutlined />,
      onClick: handleEditClick
    },
    {
      key: 'delete',
      label: 'Delete Group',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => {
        // Show confirmation
        handleDeleteGroup()
      }
    }
  ]

  return (
    <>
      <Card
        hoverable
        className='group-card'
        onClick={handleViewGroup}
        style={{ height: '100%' }}
        cover={
          <div className='relative w-full h-48 bg-gray-200 overflow-hidden'>
            {currentGroup.imageUrl && currentGroup.imageUrl !== 'default-group-image.jpg' ? (
              <img src={currentGroup.imageUrl} alt={currentGroup.name} className='w-full h-full object-cover' />
            ) : (
              <div className='w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600'>
                <Avatar
                  size={80}
                  style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
                  className='text-white text-4xl font-bold'
                >
                  {currentGroup.name[0]?.toUpperCase() || 'G'}
                </Avatar>
              </div>
            )}
          </div>
        }
      >
        <div onClick={(e) => e.stopPropagation()}>
          <Space direction='vertical' size='middle' style={{ width: '100%' }}>
            {/* Header */}
            <div className='flex justify-between items-start'>
              <div className='flex-1'>
                <Title level={4} className='mb-1'>
                  {currentGroup.name}
                </Title>
                {/* <Tag
                  icon={currentGroup.isPublic ? <GlobalOutlined /> : <LockOutlined />}
                  color={currentGroup.isPublic ? 'blue' : 'orange'}
                >
                  {currentGroup.isPublic ? 'Công khai' : 'Riêng tư'}
                </Tag> */}
              </div>
            </div>
            {/* Description */}
            {/* <Paragraph
              ellipsis={{ rows: 2 }}
              type='secondary'
              className='mb-0'
              style={{ minHeight: '44px' }}
            >
              {currentGroup.description}
            </Paragraph> */}

            {/* Stats */}
            <div className='flex gap-4'>
              <Space size='small'>
                <UserOutlined className='text-gray-500' />
                <Text type='secondary'>{currentGroup.memberCount} members</Text>
              </Space>
              <Space size='small'>
                <FileTextOutlined className='text-gray-500' />
                <Text type='secondary'>{currentGroup.postCount} posts</Text>
              </Space>
            </div>

            {/* Actions */}
            {showActions && (
              <div className='flex gap-2'>
                {!joined ? (
                  // Not joined - "Join Group" Button
                  <Button type='primary' onClick={handleJoinGroup} loading={loading} block>
                    Join Group
                  </Button>
                ) : isAdmin ? (
                  // Admin - "View Group" Button + Dropdown (Edit, Delete)
                  <>
                    <Button
                      icon={<EyeOutlined />}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleViewGroup()
                      }}
                      style={{ flex: 1 }}
                    >
                      View Group
                    </Button>
                    <Dropdown menu={{ items: adminMenuItems }} trigger={['click']} placement='bottomRight'>
                      <Button icon={<MoreOutlined />} onClick={(e) => e.stopPropagation()} />
                    </Dropdown>
                  </>
                ) : (
                  // Regular member - "View Group" Button + Dropdown (Leave)
                  <>
                    <Button
                      icon={<EyeOutlined />}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleViewGroup()
                      }}
                      style={{ flex: 1 }}
                    >
                      View Group
                    </Button>
                    <Dropdown menu={{ items: memberMenuItems }} trigger={['click']} placement='bottomRight'>
                      <Button icon={<MoreOutlined />} onClick={(e) => e.stopPropagation()} />
                    </Dropdown>
                  </>
                )}
              </div>
            )}
          </Space>
        </div>
      </Card>

      <EditGroupModal
        isModalOpen={isEditModalOpen}
        handleCancel={() => setIsEditModalOpen(false)}
        onEditGroupSuccess={handleEditGroupSuccess}
        group={currentGroup}
      />
    </>
  )
}

export default GroupCard