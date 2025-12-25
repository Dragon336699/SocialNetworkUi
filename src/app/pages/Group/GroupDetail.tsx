import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Typography,
  Button,
  Spin,
  Space,
  Tag,
  message,
  Modal,
  Avatar,
  Card,
  Tabs,
  Empty,
  Dropdown,
  List,
  Badge
} from 'antd'
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
  CrownOutlined,
  StarOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  BellOutlined,
  LeftOutlined,
  RightOutlined
} from '@ant-design/icons'
import { groupService } from '@/app/services/group.service'
import { GroupDto, GroupRole } from '@/app/types/Group/group.dto'
import { PostData } from '@/app/types/Post/Post'
import Post from '../Post/Post'
import CreatePostModal from '@/app/common/Modals/CreatePostModal'
import EditGroupModal from '@/app/common/Modals/Group/EditGroupModal'
import ManageMembersModal from '@/app/common/Modals/Group/ManageMembersModal'
import PendingJoinRequestsModal from '@/app/common/Modals/Group/PendingJoinRequestsModal'
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
  const [isJoined, setIsJoined] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false)
  const [isEditGroupOpen, setIsEditGroupOpen] = useState(false)
  const [isManageMembersOpen, setIsManageMembersOpen] = useState(false)
  const [isPendingRequestsOpen, setIsPendingRequestsOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<UserDto>(defaultUser)
  const [pendingRequestCount, setPendingRequestCount] = useState(0)
  const [activeTab, setActiveTab] = useState('posts')
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false)
  const [viewerImages, setViewerImages] = useState<string[]>([])
  const [currentViewerIndex, setCurrentViewerIndex] = useState(0)
  // Kiểm tra role của người dùng hiện tại
  const currentUserRole = group?.groupUsers?.find((gu) => gu.userId === currentUser?.id)?.roleName || ''
  const isSuperAdmin = currentUserRole === 'SuperAdministrator'
  const isAdmin = currentUserRole === GroupRole.Administrator || isSuperAdmin

  const openImageViewer = (images: string[], startIndex: number = 0) => {
    setViewerImages(images)
    setCurrentViewerIndex(startIndex)
    setIsImageViewerOpen(true)
  }

  const handleViewerPrevious = () => {
    setCurrentViewerIndex((prev) => Math.max(0, prev - 1))
  }

  const handleViewerNext = () => {
    setCurrentViewerIndex((prev) => Math.min(viewerImages.length - 1, prev + 1))
  }
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
  useEffect(() => {
    const fetchGroupDetail = async () => {
      if (!groupId) return

      try {
        setLoading(true)
        const response = await groupService.getGroupById(groupId)

        if (response.group) {
          setGroup(response.group)
          const userStatus = response.group.groupUsers?.find((gu) => gu.userId === currentUser.id)

          if (userStatus) {
            if (userStatus.roleName === GroupRole.Pending) {
              setIsPending(true)
              setIsJoined(false)
            } else {
              setIsJoined(true)
              setIsPending(false)
            }
          } else {
            setIsJoined(false)
            setIsPending(false)
          }

          if (response.group.posts) {
            setPosts(response.group.posts as unknown as PostData[])
          }

          // Đếm số pending requests (chỉ cho admin)
          if (
            userStatus &&
            (userStatus.roleName === GroupRole.Administrator || userStatus.roleName === GroupRole.SuperAdministrator)
          ) {
            const pendingCount =
              response.group.groupUsers?.filter((gu) => gu.roleName === GroupRole.Pending).length || 0
            setPendingRequestCount(pendingCount)
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

  // Refresh group data
  const refreshGroupData = async () => {
    if (!groupId) return
    try {
      const response = await groupService.getGroupById(groupId)
      if (response.group) {
        setGroup(response.group)
        const userStatus = response.group.groupUsers?.find((gu) => gu.userId === currentUser.id)
        if (userStatus) {
          if (userStatus.roleName === GroupRole.Pending) {
            setIsPending(true)
            setIsJoined(false)
          } else {
            setIsJoined(true)
            setIsPending(false)
          }
        } else {
          setIsJoined(false)
          setIsPending(false)
        }

        if (response.group.posts) {
          setPosts(response.group.posts as unknown as PostData[])
        }

        // Update pending count
        if (
          userStatus &&
          (userStatus.roleName === GroupRole.Administrator || userStatus.roleName === GroupRole.SuperAdministrator)
        ) {
          const pendingCount = response.group.groupUsers?.filter((gu) => gu.roleName === GroupRole.Pending).length || 0
          setPendingRequestCount(pendingCount)
        }
      }
    } catch (error) {
      console.error('Error refreshing group data:', error)
    }
  }

  // Xử lý tham gia nhóm
  const handleJoinGroup = async () => {
    if (!groupId) return

    try {
      await groupService.joinGroup(groupId)
      message.success('Join request sent! Waiting for approval.')
      await refreshGroupData()
      setIsPending(true)
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Unable to send join request'
      message.error(errorMessage)
    }
  }

  // Xử lý hủy yêu cầu tham gia
  const handleCancelJoinRequest = async () => {
    if (!groupId) return

    try {
      await groupService.cancelJoinRequest(groupId)
      message.success('Join request cancelled')
      setIsPending(false)
      await refreshGroupData()
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Unable to cancel request'
      message.error(errorMessage)
    }
  }

  // Xử lý rời khỏi nhóm
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

  const handlePostCreated = async () => {
    setIsCreatePostOpen(false)
    await refreshGroupData()
  }

  const handleEditGroupSuccess = (updatedGroup: GroupDto) => {
    setGroup(updatedGroup)
    setIsEditGroupOpen(false)
    message.success('Group has been updated!')
  }

  const handleMembersUpdated = async () => {
    await refreshGroupData()
  }

  // Menu cho pending request
  const pendingMenuItems: MenuProps['items'] = [
    {
      key: 'cancel',
      label: 'Cancel Request',
      icon: <CloseOutlined />,
      danger: true,
      onClick: handleCancelJoinRequest
    }
  ]

  // Menu cho người dùng đã tham gia (User và Admin có thể leave)
  const joinedMenuItems: MenuProps['items'] = [
    {
      key: 'leave',
      label: 'Leave Group',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: handleLeaveGroup
    }
  ]

  // Menu cho admin (Admin và SuperAdmin)
  const adminMenuItems: MenuProps['items'] = [
    {
      key: 'pending-requests',
      label: (
        <Space>
          <span>Join Requests</span>
          {pendingRequestCount > 0 && <Badge count={pendingRequestCount} style={{ backgroundColor: '#52c41a' }} />}
        </Space>
      ),
      icon: <BellOutlined />,
      onClick: () => setIsPendingRequestsOpen(true)
    },
    {
      key: 'manage',
      label: 'Manage Members',
      icon: <TeamOutlined />,
      onClick: () => setIsManageMembersOpen(true)
    },
    {
      key: 'edit',
      label: 'Edit Group',
      icon: <EditOutlined />,
      onClick: () => setIsEditGroupOpen(true)
    },

    ...(isSuperAdmin
      ? []
      : [
          {
            key: 'leave',
            label: 'Leave Group',
            icon: <DeleteOutlined />,
            danger: true,
            onClick: handleLeaveGroup
          }
        ]),
    ...(isSuperAdmin
      ? [
          {
            key: 'delete',
            label: 'Delete Group',
            icon: <DeleteOutlined />,
            danger: true,
            onClick: handleDeleteGroup
          }
        ]
      : [])
  ]

  // Render role tag
  const renderRoleTag = (roleName: string) => {
    if (roleName === GroupRole.SuperAdministrator) {
      return (
        <Tag color='gold' icon={<StarOutlined />}>
          Owner
        </Tag>
      )
    }
    if (roleName === GroupRole.Administrator) {
      return (
        <Tag color='blue' icon={<CrownOutlined />}>
          Admin
        </Tag>
      )
    }
    return null
  }

  const getAllImages = () => {
    const allImages: string[] = []
    posts.forEach(post => {
      if (post.postImages && post.postImages.length > 0) {
        post.postImages.forEach(img => {
          if (img.imageUrl) {
            allImages.push(img.imageUrl)
          }
        })
      }
    })
    return allImages
  }

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
        currentUser={currentUser}
      />

      {group && (
        <>
          <EditGroupModal
            isModalOpen={isEditGroupOpen}
            handleCancel={() => setIsEditGroupOpen(false)}
            onEditGroupSuccess={handleEditGroupSuccess}
            group={group}
          />
          <ManageMembersModal
            isModalOpen={isManageMembersOpen}
            handleCancel={() => setIsManageMembersOpen(false)}
            group={group}
            currentUserId={currentUser.id}
            onMembersUpdated={handleMembersUpdated}
          />
          <PendingJoinRequestsModal
            isModalOpen={isPendingRequestsOpen}
            handleCancel={() => setIsPendingRequestsOpen(false)}
            groupId={groupId || ''}
            onRequestsUpdated={handleMembersUpdated}
          />
          <Modal
            open={isImageViewerOpen}
            onCancel={() => setIsImageViewerOpen(false)}
            footer={null}
            width='90vw'
            style={{ top: 20, maxWidth: '1200px' }}
            closeIcon={<CloseOutlined style={{ color: 'white', fontSize: '24px' }} />}
            styles={{
              body: { padding: 0, background: 'black' },
              content: { padding: 0, background: 'black', borderRadius: 0, border: '2px solid white' }
            }}
          >
            <div className='relative bg-black' style={{ minHeight: '70vh' }}>
              <div className='flex items-center justify-center' style={{ minHeight: '70vh' }}>
                <img
                  src={viewerImages[currentViewerIndex]}
                  alt={`Image ${currentViewerIndex + 1}`}
                  className='max-w-full max-h-[70vh] object-contain'
                />
              </div>

              {viewerImages.length > 1 && (
                <>
                  {currentViewerIndex > 0 && (
                    <button
                      onClick={handleViewerPrevious}
                      className='absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full p-3 transition-all'
                    >
                      <LeftOutlined style={{ fontSize: '24px' }} />
                    </button>
                  )}

                  {currentViewerIndex < viewerImages.length - 1 && (
                    <button
                      onClick={handleViewerNext}
                      className='absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full p-3 transition-all'
                    >
                      <RightOutlined style={{ fontSize: '24px' }} />
                    </button>
                  )}

                  <div className='absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-full'>
                    {currentViewerIndex + 1} / {viewerImages.length}
                  </div>
                </>
              )}
            </div>
          </Modal>
        </>
      )}

      {/* Group Header with Image */}
      <Card className='mb-6 overflow-hidden border-2 border-black font-semibold'>
        <div className='relative -mt-6 -mx-6 mb-4'>
          {group.imageUrl && (
            <div
              className='w-full h-64 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity'
              onClick={() => openImageViewer([group.imageUrl!], 0)}
            >
              <img
                src={group.imageUrl}
                alt={group.name}
                className='w-full h-full object-cover block max-w-full'
              />
            </div>
          )}
        </div>

        <Space direction='vertical' size='small' className='w-full'>
          {/* Dòng 1: Tên group và button */}
          <div className='flex justify-between items-center'>
            <Title level={2} className='mb-0'>
              {group.name}
            </Title>
            <Space>
              {!isJoined && !isPending ? (
                <Button type='primary' size='large' icon={<UserOutlined />} onClick={handleJoinGroup}>
                  Join Group
                </Button>
              ) : isPending ? (
                <Dropdown menu={{ items: pendingMenuItems }} trigger={['click']}>
                  <Button icon={<ClockCircleOutlined />} type='default'>
                    Request Pending
                  </Button>
                </Dropdown>
              ) : (
                <>
                  {isAdmin ? (
                    <Dropdown menu={{ items: adminMenuItems }} trigger={['click']} placement='bottomRight'>
                      <Button icon={<MoreOutlined />}>
                        {pendingRequestCount > 0 && <Badge count={pendingRequestCount} offset={[10, 0]} />}
                      </Button>
                    </Dropdown>
                  ) : (
                    <Dropdown menu={{ items: joinedMenuItems }} trigger={['click']}>
                      <Button icon={<CheckOutlined />} type='default'>
                        Joined
                      </Button>
                    </Dropdown>
                  )}
                </>
              )}
            </Space>
          </div>

          {/* Dòng 2: Privacy tag, avatars và số thành viên */}
          <div className='flex items-center gap-4'>
            <Tag
              icon={group.isPublic ? <GlobalOutlined /> : <LockOutlined />}
              color={group.isPublic ? 'blue' : 'orange'}
            >
              {group.isPublic ? 'Public Group' : 'Private Group'}
            </Tag>
            <div className='flex items-center gap-2'>
              <div className='flex -space-x-2'>
                {group.groupUsers
                  ?.filter(gu => gu.roleName !== GroupRole.Pending)
                  .slice(0, 10)
                  .map((member, index) => (
                    <Avatar
                      key={member.userId}
                      size={28}
                      src={member.user?.avatarUrl}
                      className='border-2 border-white'
                      style={{ zIndex: 10 - index }}
                    >
                      {member.user?.firstName?.[0]?.toUpperCase() || 'U'}
                    </Avatar>
                  ))}
              </div>
              <Text type='secondary' className='text-sm'>
                {group.memberCount} members
              </Text>
            </div>
          </div>

          {/* Dòng 3: Icon thành viên và bài viết */}
          <div className='flex gap-6 mt-1'>
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

        {/* Tabs - bắt đầu từ bên trái */}
        {(isJoined && !isPending) && (
          <div className='-mx-6 -mb-6 mt-3 px-6'>
            <Tabs activeKey={activeTab} onChange={setActiveTab} size='large' className='font-semibold'>
              <TabPane tab='Discussion' key='posts' />
              <TabPane tab='Members' key='members' />
              <TabPane tab='Photos' key='photos' />
            </Tabs>
          </div>
        )}
      </Card>

      {/* Content */}
      {isJoined && !isPending ? (
        <div>
          {/* Discussion Tab */}
          {activeTab === 'posts' && (
            <div className='flex gap-6'>
              {/* Left Column - Posts Feed */}
              <div className='flex-1 max-w-[600px]'>
                {/* Create Post */}
                <div className='bg-white rounded-lg p-4 mb-4 shadow-sm border-2 border-black'>
                  <div
                    onClick={() => setIsCreatePostOpen(true)}
                    className='flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors'
                  >
                    <Avatar size={40} src={currentUser?.avatarUrl} className='border-2 border-black' />
                    <div className='flex-1 bg-gray-100 rounded-full px-4 py-3 text-gray-600 hover:bg-gray-200 transition-colors border border-gray-300'>
                      What's on your mind...
                    </div>
                  </div>
                </div>

                {/* Posts List */}
                {posts.length > 0 ? (
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
                  <div className='bg-white rounded-lg p-8 shadow-sm border-2 border-black'>
                    <Empty description='No posts yet' image={Empty.PRESENTED_IMAGE_SIMPLE}>
                      <Button type='primary' onClick={() => setIsCreatePostOpen(true)}>
                        Create the first post
                      </Button>
                    </Empty>
                  </div>
                )}
              </div>

              {/* Right Column - Sticky Sidebar */}
              <div className='w-80 flex-shrink-0'>
                <div className='sticky top-6 space-y-4'>
                  {/* About Section */}
                  <div className='bg-white rounded-lg p-4 shadow-sm border-2 border-black'>
                    <Title level={5} className='mb-3'>About</Title>
                    <div className='space-y-3'>
                      <div>
                        <Text className='text-gray-700 text-sm'>{group.description}</Text>
                      </div>
                      
                      <div className='border-t-2 border-black pt-3 space-y-2'>
                        <div className='flex items-center gap-2'>
                          {group.isPublic ? <GlobalOutlined className='text-black' /> : <LockOutlined className='text-black' />}
                          <Text className='text-sm font-medium'>
                            {group.isPublic ? 'Public group' : 'Private group'}
                          </Text>
                        </div>
                        
                        <div className='flex items-center gap-2'>
                          <UserOutlined className='text-black' />
                          <Text className='text-sm'>
                            <span className='font-semibold'>{group.memberCount}</span> members
                          </Text>
                        </div>
                        
                        <div className='flex items-center gap-2'>
                          <FileTextOutlined className='text-black' />
                          <Text className='text-sm'>
                            <span className='font-semibold'>{group.postCount}</span> posts
                          </Text>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Photos Section */}
                  <div className='bg-white rounded-lg shadow-sm border-2 border-black p-4'>
                    <div className='flex items-center justify-between mb-3'>
                      <Title level={5} className='mb-0'>Recent Photos</Title>
                    </div>
                    <div className='border-t-2 border-black mb-3'></div>
                    {(() => {
                      const allImages = getAllImages()
                      if (allImages.length === 0) {
                        return (
                          <div className='text-center py-4'>
                            <Text type='secondary' className='text-sm'>No photos yet</Text>
                          </div>
                        )
                      }
                      
                      const displayCount = Math.min(allImages.length, 6)
                      const imagesToShow = allImages.slice(0, displayCount)
                      
                      // Layout theo yêu cầu
                      const renderImageLayout = () => {
                        if (displayCount === 1) {
                          return (
                            <div className='grid grid-cols-1 gap-3 mb-3'>
                              <div
                                className='rounded-lg overflow-hidden border-2 border-black cursor-pointer hover:opacity-80 transition-opacity h-[200px]'
                                onClick={() => openImageViewer(allImages, 0)}
                              >
                                <img src={imagesToShow[0]} alt='Media 1' className='w-full h-full object-cover' />
                              </div>
                            </div>
                          )
                        } else if (displayCount === 2) {
                          return (
                            <div className='grid grid-cols-1 gap-3 mb-3'>
                              {imagesToShow.map((imageUrl, index) => (
                                <div 
                                  key={index} 
                                  className='rounded-lg overflow-hidden border-2 border-black cursor-pointer hover:opacity-80 transition-opacity h-[140px]'
                                  onClick={() => openImageViewer(allImages, index)}
                                >
                                  <img src={imageUrl} alt={`Media ${index + 1}`} className='w-full h-full object-cover' />
                                </div>
                              ))}
                            </div>
                          )
                        } else if (displayCount === 3) {
                          return (
                            <div className='grid grid-cols-1 gap-3 mb-3'>
                              {imagesToShow.map((imageUrl, index) => (
                                <div 
                                  key={index} 
                                  className='rounded-lg overflow-hidden border-2 border-black cursor-pointer hover:opacity-80 transition-opacity h-[140px]'
                                  onClick={() => openImageViewer(allImages, index)}
                                >
                                  <img src={imageUrl} alt={`Media ${index + 1}`} className='w-full h-full object-cover' />
                                </div>
                              ))}
                            </div>
                          )
                        } else if (displayCount === 4) {
                          return (
                            <div className='space-y-3 mb-3'>
                              <div className='grid grid-cols-2 gap-3'>
                                {imagesToShow.slice(0, 2).map((imageUrl, index) => (
                                  <div 
                                    key={index} 
                                    className='rounded-lg overflow-hidden border-2 border-black cursor-pointer hover:opacity-80 transition-opacity aspect-[4/3]'
                                    onClick={() => openImageViewer(allImages, index)}
                                  >
                                    <img src={imageUrl} alt={`Media ${index + 1}`} className='w-full h-full object-cover' />
                                  </div>
                                ))}
                              </div>
                              <div className='grid grid-cols-1 gap-3'>
                                {imagesToShow.slice(2, 4).map((imageUrl, index) => (
                                  <div 
                                    key={index + 2} 
                                    className='rounded-lg overflow-hidden border-2 border-black cursor-pointer hover:opacity-80 transition-opacity h-[140px]'
                                    onClick={() => openImageViewer(allImages, index + 2)}
                                  >
                                    <img src={imageUrl} alt={`Media ${index + 3}`} className='w-full h-full object-cover' />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        } else if (displayCount === 5) {
                          return (
                            <div className='space-y-3 mb-3'>
                              <div className='grid grid-cols-2 gap-3'>
                                {imagesToShow.slice(0, 2).map((imageUrl, index) => (
                                  <div 
                                    key={index} 
                                    className='rounded-lg overflow-hidden border-2 border-black cursor-pointer hover:opacity-80 transition-opacity aspect-[4/3]'
                                    onClick={() => openImageViewer(allImages, index)}
                                  >
                                    <img src={imageUrl} alt={`Media ${index + 1}`} className='w-full h-full object-cover' />
                                  </div>
                                ))}
                              </div>
                              <div className='grid grid-cols-2 gap-3'>
                                {imagesToShow.slice(2, 4).map((imageUrl, index) => (
                                  <div 
                                    key={index + 2} 
                                    className='rounded-lg overflow-hidden border-2 border-black cursor-pointer hover:opacity-80 transition-opacity aspect-[4/3]'
                                    onClick={() => openImageViewer(allImages, index + 2)}
                                  >
                                    <img src={imageUrl} alt={`Media ${index + 3}`} className='w-full h-full object-cover' />
                                  </div>
                                ))}
                              </div>
                              <div className='grid grid-cols-1 gap-3'>
                                <div 
                                  className='rounded-lg overflow-hidden border-2 border-black cursor-pointer hover:opacity-80 transition-opacity h-[140px]'
                                  onClick={() => openImageViewer(allImages, 4)}
                                >
                                  <img src={imagesToShow[4]} alt='Media 5' className='w-full h-full object-cover' />
                                </div>
                              </div>
                            </div>
                          )
                        } else {
                          return (
                            <div className='grid grid-cols-2 gap-3 mb-5'>
                              {imagesToShow.map((imageUrl, index) => (
                                <div 
                                  key={index} 
                                  className='rounded-lg overflow-hidden border-2 border-black cursor-pointer hover:opacity-80 transition-opacity aspect-[4/3]'
                                  onClick={() => openImageViewer(allImages, index)}
                                >
                                  <img src={imageUrl} alt={`Media ${index + 1}`} className='w-full h-full object-cover' />
                                </div>
                              ))}
                            </div>
                          )
                        }
                      }
                      
                      return (
                        <>
                          {renderImageLayout()}
                          {allImages.length > 6 && (
                            <Button 
                              size='middle'
                              block
                              className='font-medium rounded-lg hover:bg-gray-100 text-gray-500 border-gray-300'
                              onClick={() => setActiveTab('photos')}
                            >
                              See all photos
                            </Button>
                          )}
                        </>
                      )
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Members Tab */}
          {activeTab === 'members' && (
            <Card className='border-2 border-black rounded-lg'>
              <Title level={4} className='mb-4'>
                Members ({group.groupUsers?.filter(gu => gu.roleName !== GroupRole.Pending).length || 0})
              </Title>
              <div className='border-t-2 border-black mb-3'></div>
              <List
                dataSource={group.groupUsers?.filter(gu => gu.roleName !== GroupRole.Pending) || []}
                renderItem={(member) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <div className='border-2 border-black rounded-full'>
                          <Avatar size={48} src={member.user?.avatarUrl}>
                            {member.user?.firstName?.[0]?.toUpperCase() || 'U'}
                          </Avatar>
                        </div>
                      }
                      title={
                        <Space>
                          <span className='font-semibold'>
                            {member.user
                              ? `${member.user.firstName || ''} ${member.user.lastName || ''}`.trim() || 'Unknown User'
                              : 'Unknown User'}
                          </span>
                          {renderRoleTag(member.roleName)}
                        </Space>
                      }
                      description={
                        <Text type='secondary' className='text-sm'>
                          Joined {new Date(member.joinedAt).toLocaleDateString('en-US', { 
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </Text>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          )}

          {/* Photos Tab */}
          {activeTab === 'photos' && (
            <Card className='border-2 border-black rounded-lg'>
              <Title level={4} className='mb-4'>
                All Photos
              </Title>
              <div className='border-t-2 border-black mb-3'></div>
              {(() => {
                const allImages: Array<{ url: string; postId: string; postContent: string }> = []
                posts.forEach(post => {
                  if (post.postImages && post.postImages.length > 0) {
                    post.postImages.forEach(img => {
                      if (img.imageUrl) {
                        allImages.push({
                          url: img.imageUrl,
                          postId: post.id,
                          postContent: post.content
                        })
                      }
                    })
                  }
                })
                
                return allImages.length > 0 ? (
                  <div className='grid grid-cols-3 gap-3'>
                    {allImages.map((image, index) => (
                      <div 
                        key={index}
                        className='aspect-square rounded-lg overflow-hidden border-2 border-black cursor-pointer hover:opacity-80 transition-opacity hover:shadow-lg'
                        title={image.postContent.substring(0, 50)}
                        onClick={() => openImageViewer(allImages.map(img => img.url), index)}
                      >
                        <img 
                          src={image.url} 
                          alt={`Photo ${index + 1}`}
                          className='w-full h-full object-cover'
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <Empty 
                    description='No photos yet' 
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    className='py-8'
                  />
                )
              })()}
            </Card>
          )}
        </div>
      ) : isPending ? (
        <Card>
          <Empty
            description={
              <Space direction='vertical'>
                <Text>Your join request is pending approval</Text>
                <Text type='secondary'>Please wait for an administrator to approve your request</Text>
              </Space>
            }
            image={<ClockCircleOutlined style={{ fontSize: 48, color: '#faad14' }} />}
          />
        </Card>
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
