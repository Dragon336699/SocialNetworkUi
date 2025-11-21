import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Typography, Button, Spin, Space, Tag, message, Modal, Avatar, Card, Tabs, Empty, Dropdown, List } from 'antd'
import type { MenuProps } from 'antd'
import {
  GlobalOutlined,
  LockOutlined,
  UserOutlined,
  FileTextOutlined,
  CheckOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  CrownOutlined
} from '@ant-design/icons'
import { groupService } from '@/app/services/group.service'
import { postService } from '@/app/services/post.service'
import { GroupDto } from '@/app/types/Group/group.dto'
import { PostData } from '@/app/types/Post/Post'
import Post from '../Post/Post'
import CreatePostModal from '@/app/common/Modals/CreatePostModal'
import EditGroupModal from '../../common/Modals/Group/EditGroupModal'
import { userService } from '@/app/services/user.service'
import { UserDto } from '@/app/types/User/user.dto'

const { Title, Text, Paragraph } = Typography
const { TabPane } = Tabs

const GroupDetail = () => {
  const defaultUser: UserDto = {
    id: '',
    avatarUrl: '',
    firstName: 'Guest',
    lastName: '',
    email: '',
    userName: '',
    status: ''
  }
  const { groupId } = useParams<{ groupId: string }>()
  const navigate = useNavigate()

  const [group, setGroup] = useState<GroupDto | null>(null)
  const [posts, setPosts] = useState<PostData[]>([])
  const [loading, setLoading] = useState(true)
  const [postsLoading, setPostsLoading] = useState(false)
  const [isJoined, setIsJoined] = useState(false)
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false)
  const [isEditGroupOpen, setIsEditGroupOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<UserDto>(defaultUser)

  // Kiểm tra xem người dùng hiện tại có phải là admin không - sử dụng groupUsers từ response
  const isAdmin =
    group?.groupUsers?.some( gu => gu.userId === currentUser?.id && gu.roleName === 'Administrator') ?? false

  // Lấy thông tin người dùng hiện tại
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await userService.getUserInfoByToken()
        if (response.status === 200 && response.data && 'id' in response.data) {
          setCurrentUser(response.data as UserDto)
        }
      } catch (error) {
        console.error('Error fetching current user:', error)
      }
    }
    fetchCurrentUser()
  }, [])

  // Lấy chi tiết nhóm
  // Fetch group details
  useEffect(() => {
    const fetchGroupDetail = async () => {
      if (!groupId) return

      try {
        setLoading(true)
        const response = await groupService.getGroupById(groupId)

        if (response.group) {
          setGroup(response.group)

          // Check if user is joined using groupUsers from response
          const isUserJoined = response.group.groupUsers?.some(gu => gu.userId === currentUser.id) ?? false
          setIsJoined(isUserJoined)

          // Set posts directly from group response
          if (response.group.posts) {
            setPosts(response.group.posts as unknown as PostData[])
          }
        }
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message || 'Failed to fetch group details'
        message.error(errorMessage)
        navigate('/groups')
      } finally {
        setLoading(false)
      }
    }

    if (currentUser.id) {
      fetchGroupDetail()
    }
  }, [groupId, navigate, currentUser.id])

  // Xử lý tham gia nhóm
  // Handle joining group
  const handleJoinGroup = async () => {
    if (!groupId) return

    try {
      await groupService.joinGroup(groupId)
      message.success('Successfully joined the group!')
      
      // Refresh group data to get updated groupUsers
      const response = await groupService.getGroupById(groupId)
      if (response.group) {
        setGroup(response.group)
        setIsJoined(true)
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Unable to join group'
      message.error(errorMessage)
    }
  }

  // Xử lý rời khỏi nhóm
  // Handle leaving group
  const handleLeaveGroup = async () => {
    if (!groupId) return

    Modal.confirm({
      title: 'Leave Group',
      content: 'Are you sure you want to leave this group?',
      okText: 'Leave',
      cancelText: 'Cancel',
      okType: 'danger',
      onOk: async () => {
        try {
          await groupService.leaveGroup(groupId)
          message.success('Successfully left the group!')
          setIsJoined(false)
          navigate('/groups')
        } catch (error: any) {
          const errorMessage = error?.response?.data?.message || 'Unable to leave group'
          message.error(errorMessage)
        }
      }
    })
  }

  // Xử lý xóa nhóm
  // Handle deleting group
  const handleDeleteGroup = async () => {
    if (!groupId) return

    Modal.confirm({
      title: 'Delete Group',
      content: 'Are you sure you want to delete this group? This action cannot be undone.',
      okText: 'Delete',
      cancelText: 'Cancel',
      okType: 'danger',
      onOk: async () => {
        try {
          await groupService.deleteGroup(groupId)
          message.success('Successfully deleted the group!')
          navigate('/groups')
        } catch (error: any) {
          const errorMessage = error?.response?.data?.message || 'Unable to delete group'
          message.error(errorMessage)
        }
      }
    })
  }

  // Xử lý khi tạo bài viết thành công
  // Handle successful post creation
  const handlePostCreated = async () => {
    setIsCreatePostOpen(false)
    if (groupId) {
      // Refresh group data to get updated posts
      const response = await groupService.getGroupById(groupId)
      if (response.group?.posts) {
        setPosts(response.group.posts as unknown as PostData[])
      }
    }
  }

  // Xử lý khi chỉnh sửa nhóm thành công
  // Handle successful group edit
  const handleEditGroupSuccess = (updatedGroup: GroupDto) => {
    setGroup(updatedGroup)
    setIsEditGroupOpen(false)
    message.success('Group has been updated!')
  }

  // Menu cho người dùng đã tham gia (không phải admin)
  // Menu items for joined users (non-admin)
  const joinedMenuItems: MenuProps['items'] = [
    {
      key: 'leave',
      label: 'Leave Group',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: handleLeaveGroup
    }
  ]

  // Menu cho admin
  // Menu items for admin
  const adminMenuItems: MenuProps['items'] = [
    {
      key: 'edit',
      label: 'Edit Group',
      icon: <EditOutlined />,
      onClick: () => setIsEditGroupOpen(true)
    },
    {
      key: 'delete',
      label: 'Delete Group',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: handleDeleteGroup
    }
  ]

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <Spin size='large' />
      </div>
    )
  }

  if (!group) {
    return null
  }

  return (
    <div className='max-w-4xl mx-auto py-6 px-4'>
      <CreatePostModal
        isModalOpen={isCreatePostOpen}
        handleCancel={() => setIsCreatePostOpen(false)}
        onCreatePostSuccess={handlePostCreated}
        groupId={groupId}
      />

      {group && (
        <EditGroupModal
          isModalOpen={isEditGroupOpen}
          handleCancel={() => setIsEditGroupOpen(false)}
          onEditGroupSuccess={handleEditGroupSuccess}
          group={group}
        />
      )}

      {/* Group Header with Image */}
      <Card className='mb-6 overflow-hidden'>
        {/* Cover Image */}
        <div className='relative -mt-6 -mx-6 mb-4'>
          {group.imageUrl && (
            <div className='w-full h-64 overflow-hidden'>
              <img
                src={group.imageUrl}
                alt={group.name}
                className='w-full h-full object-cover'
                style={{ maxWidth: '100%', display: 'block' }}
              />
            </div>
          )}
        </div>

        <Space direction='vertical' size='large' style={{ width: '100%' }}>
          <div className='flex justify-between items-start'>
            <div className='flex-1'>
              <Title level={2} className='mb-2'>
                {group.name}
              </Title>
              <Space>
                <Tag
                  icon={group.isPublic ? <GlobalOutlined /> : <LockOutlined />}
                  color={group.isPublic ? 'blue' : 'orange'}
                >
                  {group.isPublic ? 'Public Group' : 'Private Group'}
                </Tag>
              </Space>
            </div>

            <Space>
              {!isJoined ? (
                <Button type='primary' size='large' onClick={handleJoinGroup}>
                  Join Group
                </Button>
              ) : (
                <>
                  {isAdmin ? (
                    // Admin: Show only Edit/Delete menu, no "Joined" button
                    <Dropdown menu={{ items: adminMenuItems }} trigger={['click']}>
                      <Button icon={<MoreOutlined />} />
                    </Dropdown>
                  ) : (
                    // Regular member: Show only "Joined" with leave menu
                    <Dropdown menu={{ items: joinedMenuItems }} trigger={['click']}>
                      <Button icon={<CheckOutlined />}>Joined</Button>
                    </Dropdown>
                  )}
                </>
              )}
            </Space>
          </div>

          <Paragraph className='text-base'>{group.description}</Paragraph>

          <div className='flex gap-6'>
            <Space size='small'>
              <UserOutlined className='text-gray-500' />
              <Text strong>{group.memberCount}</Text>
              <Text type='secondary'>members</Text>
            </Space>
            <Space size='small'>
              <FileTextOutlined className='text-gray-500' />
              <Text strong>{group.postCount}</Text>
              <Text type='secondary'>posts</Text>
            </Space>
          </div>
        </Space>
      </Card>

      {/* Content */}
      {isJoined ? (
        <Tabs defaultActiveKey='posts' size='large'>
          <TabPane tab='Discussion' key='posts'>
            {/* Create Post */}
            <div className='bg-white rounded-lg p-4 mb-6 shadow-sm border border-gray-200'>
              <div
                onClick={() => setIsCreatePostOpen(true)}
                className='flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors'
              >
                <Avatar size={48} src={currentUser?.avatarUrl} />
                <div className='flex-1 bg-neutral-100 rounded-full px-4 py-3 text-neutral-600 hover:bg-neutral-200 transition-colors'>
                  What's on your mind...
                </div>
              </div>
            </div>

            {/* Posts */}
            {postsLoading ? (
              <div className='text-center py-12'>
                <Spin size='large' />
              </div>
            ) : posts.length > 0 ? (
              <div className='space-y-4'>
                {posts.map((post) => (
                  <Post
                    key={post.id}
                    {...post}
                    currentUserId={currentUser?.id || ''}
                    currentUser={currentUser}
                    onPostUpdated={handlePostCreated}
                    onPostDeleted={handlePostCreated}
                  />
                ))}
              </div>
            ) : (
              <Empty description='No posts yet' image={Empty.PRESENTED_IMAGE_SIMPLE}>
                <Button type='primary' onClick={() => setIsCreatePostOpen(true)}>
                  Create the first post
                </Button>
              </Empty>
            )}
          </TabPane>

          <TabPane tab='Members' key='members'>
            <Card>
              <Title level={4} className='mb-4'>
                Members ({group.groupUsers?.length || 0})
              </Title>
              <List
                dataSource={group.groupUsers || []}
                renderItem={(member) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <Avatar size={48} src={member.user?.avatarUrl}>
                          {member.user?.firstName?.[0]?.toUpperCase() || 'U'}
                        </Avatar>
                      }
                      title={
                        <Space>
                          <span>
                            {member.user
                              ? `${member.user.firstName || ''} ${member.user.lastName || ''}`.trim() || 'Unknown User'
                              : 'Unknown User'}
                          </span>
                          {member.roleName === 'Administrator' && (
                            <Tag color='gold' icon={<CrownOutlined />}>
                              Admin
                            </Tag>
                          )}
                        </Space>
                      }
                      description={
                        <Text type='secondary'>Joined: {new Date(member.joinedAt).toLocaleDateString('en-US')}</Text>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </TabPane>

          <TabPane tab='About' key='about'>
            <Card>
              <Space direction='vertical' size='large' style={{ width: '100%' }}>
                <div>
                  <Title level={4}>About this group</Title>
                  <Paragraph>{group.description}</Paragraph>
                </div>
                <div>
                  <Title level={4}>Privacy</Title>
                  <Paragraph>
                    {group.isPublic
                      ? 'This is a public group. Anyone can see posts and members.'
                      : 'This is a private group. Only members can see posts.'}
                  </Paragraph>
                </div>
              </Space>
            </Card>
          </TabPane>
        </Tabs>
      ) : (
        <Card>
          <Empty
            description='Join this group to view posts and interact with members'
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type='primary' size='large' onClick={handleJoinGroup}>
              Join Group
            </Button>
          </Empty>
        </Card>
      )}
    </div>
  )
}

export default GroupDetail