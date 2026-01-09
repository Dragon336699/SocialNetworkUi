import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Typography, Button, Spin, Space, Tag, message, Modal, Avatar, Card, Tabs, Empty } from 'antd'
import {
  GlobalOutlined,
  LockOutlined,
  UserOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  CheckOutlined
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
import { PendingDropdownMenu } from './GroupDropdownMenu'
import GroupHeaderActions from '@/app/components/Group/GroupHeaderActions'
import InviteFriendsModal from '@/app/common/Modals/Group/InviteFriendsModal'
import PendingPostsModal from '@/app/common/Modals/Group/PendingPostsModal'
import MyPendingPostsModal from '@/app/common/Modals/Group/MyPendingPostsModal'
import BannedMembersModal from '@/app/common/Modals/Group/BannedMembersModal'
import { postService } from '@/app/services/post.service'
import GroupSidebar from '@/app/components/Group/GroupSidebar'
import { GroupMembersTab, GroupPhotosTab } from '@/app/components/Group/GroupTabs'
import ImageViewerModal from '@/app/common/Modals/Group/ImageViewerModal'
import useDevice from '@/app/hook/useDeivce'

const { Title, Text } = Typography
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
  const { isMobile } = useDevice()

  const [group, setGroup] = useState<GroupDto | null>(null)
  const [posts, setPosts] = useState<PostData[]>([])
  const [loading, setLoading] = useState(true)
  const [isJoined, setIsJoined] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false)
  const [isEditGroupOpen, setIsEditGroupOpen] = useState(false)
  const [isManageMembersOpen, setIsManageMembersOpen] = useState(false)
  const [isPendingRequestsOpen, setIsPendingRequestsOpen] = useState(false)
  const [isInvited, setIsInvited] = useState(false)
  const [currentUser, setCurrentUser] = useState<UserDto>(defaultUser)
  const [pendingRequestCount, setPendingRequestCount] = useState(0)
  const [activeTab, setActiveTab] = useState('posts')
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false)
  const [viewerImages, setViewerImages] = useState<string[]>([])
  const [currentViewerIndex, setCurrentViewerIndex] = useState(0)
  const [showAdminDropdown, setShowAdminDropdown] = useState(false)
  const [showPendingDropdown, setShowPendingDropdown] = useState(false)
  const [showJoinedDropdown, setShowJoinedDropdown] = useState(false)
  const [showMemberDropdown, setShowMemberDropdown] = useState(false)
  const [isInviteFriendsOpen, setIsInviteFriendsOpen] = useState(false)
  const [acceptingInvite, setAcceptingInvite] = useState(false)
  const [rejectingInvite, setRejectingInvite] = useState(false)
  const [isPendingPostsOpen, setIsPendingPostsOpen] = useState(false)
  const [isMyPendingPostsOpen, setIsMyPendingPostsOpen] = useState(false)
  const [isBannedMembersOpen, setIsBannedMembersOpen] = useState(false)
  const [pendingPostCount, setPendingPostCount] = useState(0)
  const [myPendingPostCount, setMyPendingPostCount] = useState(0)

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
              setIsInvited(false)
            } else if (userStatus.roleName === GroupRole.Inviting) {
              setIsInvited(true)
              setIsPending(false)
              setIsJoined(false)
            } else {
              setIsJoined(true)
              setIsPending(false)
              setIsInvited(false)
            }
          } else {
            setIsJoined(false)
            setIsPending(false)
            setIsInvited(false)
          }

          if (response.group.posts) {
            const approvedPosts = (response.group.posts as unknown as PostData[]).filter(
              (post) => post.postPrivacy !== 'PendingApproval'
            )
            setPosts(approvedPosts)
          }

          if (
            userStatus &&
            (userStatus.roleName === GroupRole.Administrator || userStatus.roleName === GroupRole.SuperAdministrator)
          ) {
            const pendingCount =
              response.group.groupUsers?.filter((gu) => gu.roleName === GroupRole.Pending).length || 0
            setPendingRequestCount(pendingCount)

            try {
              const pendingPostsResponse = await postService.getPendingPosts(groupId, 0, 100)
              setPendingPostCount(pendingPostsResponse.posts?.length || 0)
            } catch {
              setPendingPostCount(0)
            }
          }
          if (userStatus && userStatus.roleName !== GroupRole.Pending && userStatus.roleName !== GroupRole.Inviting) {
            try {
              const myPendingPostsResponse = await postService.getMyPendingPosts(groupId, 0, 100)
              setMyPendingPostCount(myPendingPostsResponse.posts?.length || 0)
            } catch {
              setMyPendingPostCount(0)
            }
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
            setIsInvited(false)
          } else if (userStatus.roleName === GroupRole.Inviting) {
            setIsInvited(true)
            setIsPending(false)
            setIsJoined(false)
          } else {
            setIsJoined(true)
            setIsPending(false)
            setIsInvited(false)
          }
        } else {
          setIsJoined(false)
          setIsPending(false)
          setIsInvited(false)
        }

        if (response.group.posts) {
          const approvedPosts = (response.group.posts as unknown as PostData[]).filter(
            (post) => post.postPrivacy !== 'PendingApproval'
          )
          setPosts(approvedPosts)
        }

        if (
          userStatus &&
          (userStatus.roleName === GroupRole.Administrator || userStatus.roleName === GroupRole.SuperAdministrator)
        ) {
          const pendingCount = response.group.groupUsers?.filter((gu) => gu.roleName === GroupRole.Pending).length || 0
          setPendingRequestCount(pendingCount)

          try {
            const pendingPostsResponse = await postService.getPendingPosts(groupId, 0, 100)
            setPendingPostCount(pendingPostsResponse.posts?.length || 0)
          } catch {
            setPendingPostCount(0)
          }
        }

        if (userStatus && userStatus.roleName !== GroupRole.Pending && userStatus.roleName !== GroupRole.Inviting) {
          try {
            const myPendingPostsResponse = await postService.getMyPendingPosts(groupId, 0, 100)
            setMyPendingPostCount(myPendingPostsResponse.posts?.length || 0)
          } catch {
            setMyPendingPostCount(0)
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing group data:', error)
    }
  }

  const handleAcceptInvite = async () => {
    if (!groupId) return

    try {
      setAcceptingInvite(true)
      await groupService.acceptGroupInvite(groupId)
      message.success('Successfully joined the group!')
      await refreshGroupData()
      setIsInvited(false)
      setIsJoined(true)
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Unable to accept invitation'
      message.error(errorMessage)
    } finally {
      setAcceptingInvite(false)
    }
  }

  const handleRejectInvite = async () => {
    if (!groupId) return

    try {
      setRejectingInvite(true)
      await groupService.rejectGroupInvite(groupId)
      message.success('Invitation rejected')
      await refreshGroupData()
      setIsInvited(false)
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Unable to reject invitation'
      message.error(errorMessage)
    } finally {
      setRejectingInvite(false)
    }
  }

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
    <div className='max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-4'>
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
          <InviteFriendsModal
            isModalOpen={isInviteFriendsOpen}
            handleCancel={() => setIsInviteFriendsOpen(false)}
            group={group}
            onInviteSuccess={refreshGroupData}
          />
          <PendingPostsModal
            isModalOpen={isPendingPostsOpen}
            handleCancel={() => setIsPendingPostsOpen(false)}
            groupId={groupId || ''}
            onPostsUpdated={refreshGroupData}
          />
          <MyPendingPostsModal
            isModalOpen={isMyPendingPostsOpen}
            handleCancel={() => setIsMyPendingPostsOpen(false)}
            groupId={groupId}
            onPostsUpdated={refreshGroupData}
          />
          <BannedMembersModal
            isModalOpen={isBannedMembersOpen}
            handleCancel={() => setIsBannedMembersOpen(false)}
            groupId={groupId || ''}
            onMembersUpdated={handleMembersUpdated}
          />
          <ImageViewerModal
            isOpen={isImageViewerOpen}
            onClose={() => setIsImageViewerOpen(false)}
            images={viewerImages}
            currentIndex={currentViewerIndex}
            onPrevious={handleViewerPrevious}
            onNext={handleViewerNext}
          />
        </>
      )}

      {/* Group Header with Image */}
      <Card className='mb-6 border-2 border-gray-200 font-semibold' styles={{ body: { overflow: 'visible' } }}>
        <div className='relative -mt-6 -mx-6 mb-4 overflow-hidden rounded-t-lg'>
          {group.imageUrl && group.imageUrl !== 'default-group-image.jpg' ? (
            <div
              className='w-full h-48 sm:h-56 lg:h-64 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity'
              onClick={() => openImageViewer([group.imageUrl!], 0)}
            >
              <img src={group.imageUrl} alt={group.name} className='w-full h-full object-cover block max-w-full' />
            </div>
          ) : (
            <div className='w-full h-32 bg-gray-100' />
          )}
        </div>

        <Space direction='vertical' size='small' className='w-full'>
          <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4'>
            <Title level={2} className='mb-0 text-xl sm:text-2xl'>
              {group.name}
            </Title>
            <div className='flex items-center gap-4 flex-shrink-0'>
              <Tag
                icon={group.isPublic ? <GlobalOutlined /> : <LockOutlined />}
                color={group.isPublic ? 'blue' : 'orange'}
              >
                {group.isPublic ? 'Public Group' : 'Private Group'}
              </Tag>

              <div className='flex flex-wrap items-center gap-x-6 gap-y-3'>
                <div className='flex items-center gap-2'>
                  <div className='flex -space-x-2'>
                    {group.groupUsers
                      ?.filter(
                        (gu) =>
                          gu.roleName !== GroupRole.Pending &&
                          gu.roleName !== GroupRole.Inviting &&
                          gu.roleName !== GroupRole.Banned
                      )
                      .slice(0, 10)
                      .map((member, index) => (
                        <Avatar
                          key={member.userId}
                          size={28}
                          src={member.user?.avatarUrl}
                          className='border-2 border-gray-200'
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
                <div className='flex items-center gap-4 border-l-0 sm:border-l sm:pl-4 border-gray-200'>
                  <Space size='small' className='whitespace-nowrap'>
                    <UserOutlined className='text-gray-400' />
                    <Text strong>{group.memberCount}</Text>
                    <Text type='secondary' className='hidden xs:inline'>
                      members
                    </Text>
                  </Space>

                  <Space size='small' className='whitespace-nowrap'>
                    <FileTextOutlined className='text-gray-400' />
                    <Text strong>{group.postCount}</Text>
                    <Text type='secondary' className='hidden xs:inline'>
                      posts
                    </Text>
                  </Space>
                </div>
              </div>
            </div>
          </div>
        </Space>

        {isJoined && !isPending && (
          <div className='-mx-6 -mb-6 mt-3'>
            <div className='flex flex-col lg:flex-row lg:justify-between lg:items-center px-6 lg:gap-4'>
              <Tabs activeKey={activeTab} onChange={setActiveTab} size='large' className='font-semibold flex-1'>
                <TabPane tab='Discussion' key='posts' />
                <TabPane tab='Members' key='members' />
                <TabPane tab='Photos' key='photos' />
              </Tabs>

              <GroupHeaderActions
                isAdmin={isAdmin}
                isSuperAdmin={isSuperAdmin}
                pendingRequestCount={pendingRequestCount}
                pendingPostCount={pendingPostCount}
                myPendingPostCount={myPendingPostCount}
                showAdminDropdown={showAdminDropdown}
                showJoinedDropdown={showJoinedDropdown}
                showMemberDropdown={showMemberDropdown}
                onToggleAdminDropdown={() => setShowAdminDropdown(!showAdminDropdown)}
                onToggleJoinedDropdown={() => setShowJoinedDropdown(!showJoinedDropdown)}
                onToggleMemberDropdown={() => setShowMemberDropdown(!showMemberDropdown)}
                onCloseAdminDropdown={() => setShowAdminDropdown(false)}
                onCloseJoinedDropdown={() => setShowJoinedDropdown(false)}
                onCloseMemberDropdown={() => setShowMemberDropdown(false)}
                onInviteFriends={() => setIsInviteFriendsOpen(true)}
                onPendingRequests={() => setIsPendingRequestsOpen(true)}
                onManageMembers={() => setIsManageMembersOpen(true)}
                onEditGroup={() => setIsEditGroupOpen(true)}
                onLeaveGroup={handleLeaveGroup}
                onDeleteGroup={handleDeleteGroup}
                onManagePosts={() => setIsPendingPostsOpen(true)}
                onMyPendingPosts={() => setIsMyPendingPostsOpen(true)}
                onBannedMembers={() => setIsBannedMembersOpen(true)}
              />
            </div>
          </div>
        )}

        {isInvited && (
          <div className='mt-4 flex justify-end gap-3'>
            <Button
              type='primary'
              size='large'
              icon={<CheckOutlined />}
              onClick={handleAcceptInvite}
              loading={acceptingInvite}
              disabled={rejectingInvite}
            >
              Accept Invitation
            </Button>
            <Button
              danger
              type='primary'
              size='large'
              icon={<CloseOutlined />}
              onClick={handleRejectInvite}
              loading={rejectingInvite}
              disabled={acceptingInvite}
            >
              Reject
            </Button>
          </div>
        )}

        {!isJoined && !isPending && !isInvited && (
          <div className='mt-4 flex justify-end'>
            <Button type='primary' size='large' icon={<UserOutlined />} onClick={handleJoinGroup}>
              Join Group
            </Button>
          </div>
        )}

        {isPending && (
          <div className='mt-4 flex justify-center sm:justify-end relative'>
            <button
              onClick={() => setShowPendingDropdown(!showPendingDropdown)}
              className='flex items-center gap-2 px-3.5 py-2 border border-gray-300 rounded hover:bg-gray-100 transition-colors'
            >
              <ClockCircleOutlined />
              <span>Request Pending</span>
            </button>
            <PendingDropdownMenu
              isOpen={showPendingDropdown}
              onClose={() => setShowPendingDropdown(false)}
              onCancelRequest={handleCancelJoinRequest}
            />
          </div>
        )}
      </Card>

      {/* Content  */}
      {isJoined && !isPending ? (
        <div>
          {activeTab === 'posts' && (
            <div className='flex gap-6'>
              <div className='flex-1 max-w-[600px]'>
                <div className='bg-white rounded-lg p-4 mb-4 shadow-sm border-2 border-gray-200'>
                  <div
                    onClick={() => setIsCreatePostOpen(true)}
                    className='flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors'
                  >
                    <Avatar size={40} src={currentUser?.avatarUrl} className='border-2 border-gray-200' />
                    <div className='flex-1 bg-gray-100 rounded-full px-4 py-3 text-gray-600 hover:bg-gray-200 transition-colors border border-gray-300'>
                      What's on your mind...
                    </div>
                  </div>
                </div>

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
                        isGroupAdmin={isAdmin || isSuperAdmin}
                      />
                    ))}
                  </div>
                ) : (
                  <div className='bg-white rounded-lg p-8 shadow-sm border-2 border-gray-200'>
                    <Empty description='No posts yet' image={Empty.PRESENTED_IMAGE_SIMPLE}>
                      <Button type='primary' onClick={() => setIsCreatePostOpen(true)}>
                        Create the first post
                      </Button>
                    </Empty>
                  </div>
                )}
              </div>

              {/* Right Column - Sticky Sidebar */}
              {!isMobile && (
                <GroupSidebar
                  group={group}
                  posts={posts}
                  onViewAllPhotos={() => setActiveTab('photos')}
                  onImageClick={openImageViewer}
                />
              )}
            </div>
          )}

          {/* Members Tab */}
          {activeTab === 'members' && (
            <GroupMembersTab group={group} currentUserId={currentUser.id} onMembersUpdated={handleMembersUpdated} />
          )}

          {/* Photos Tab */}
          {activeTab === 'photos' && <GroupPhotosTab posts={posts} onImageClick={openImageViewer} />}
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
