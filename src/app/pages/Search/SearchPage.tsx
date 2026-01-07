import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Spin, Empty, message, Avatar, Row, Col, Typography } from 'antd'
import { UserOutlined, TeamOutlined, FileTextOutlined } from '@ant-design/icons'
import { searchService } from '@/app/services/search.service'
import { SearchType, SearchResultDto } from '@/app/types/Search/SearchType'
import { userService } from '@/app/services/user.service'
import { UserDto } from '@/app/types/User/user.dto'
import { groupService } from '@/app/services/group.service'
import { GroupRole } from '@/app/types/Group/group.dto'
import { relationService } from '@/app/services/relation.service'
import { PostData } from '@/app/types/Post/Post'
import Post from '@/app/pages/Post/Post'
import PostDropdownMenu from '@/app/pages/Post/PostDropdownMenu'
import EditPostModal from '@/app/pages/Post/EditPostModal'
import DeletePostModal from '@/app/pages/Post/DeletePostModal'
import { getTimeAgo } from '@/app/helper'
import UserCard from '@/app/components/Search/UserCard'
import GroupCard from '@/app/components/Group/GroupCard'

const { Text, Title } = Typography

const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryParam = searchParams.get('q') || ''

  const defaultUser: UserDto = {
    id: '',
    avatarUrl: '',
    firstName: 'Guest',
    lastName: '',
    email: '',
    userName: '',
    status: ''
  }

  const [searchValue, setSearchValue] = useState(queryParam)
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResultDto | null>(null)
  const [activeTab, setActiveTab] = useState<'users' | 'groups' | 'posts'>('users')
  const [currentUser, setCurrentUser] = useState<UserDto>(defaultUser)
  const [myGroupIds, setMyGroupIds] = useState<string[]>([])
  const [pendingGroupIds, setPendingGroupIds] = useState<string[]>([])
  const [friendIds, setFriendIds] = useState<string[]>([])
  const [sentRequestIds, setSentRequestIds] = useState<string[]>([])
  const [dropdownStates, setDropdownStates] = useState<{ [key: string]: boolean }>({})

  const [editingPost, setEditingPost] = useState<PostData | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

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
    const fetchMyGroups = async () => {
      try {
        const response = await groupService.getMyGroups(0, 100)
        const approvedGroupIds = (response.groups || [])
          .filter((group) => {
            const userStatus = group.groupUsers?.find((gu) => gu.userId === currentUser?.id)
            return userStatus && userStatus.roleName !== GroupRole.Pending
          })
          .map((group) => group.id)

        const pendingGroupIds = (response.groups || [])
          .filter((group) => {
            const userStatus = group.groupUsers?.find((gu) => gu.userId === currentUser?.id)
            return userStatus && userStatus.roleName === GroupRole.Pending
          })
          .map((group) => group.id)

        setMyGroupIds(approvedGroupIds)
        setPendingGroupIds(pendingGroupIds)
      } catch (error) {
        console.error('Error fetching my groups:', error)
      }
    }

    if (currentUser?.id) {
      fetchMyGroups()
    }
  }, [currentUser?.id])

  useEffect(() => {
    const fetchFriendsAndRequests = async () => {
      try {
        const [friendsRes, sentRequestsRes] = await Promise.all([
          relationService.getFriendsList(),
          relationService.getFriendRequestsSent()
        ])

        if (friendsRes.status === 200 && friendsRes.data && 'data' in friendsRes.data) {
          const friends = friendsRes.data.data as UserDto[]
          setFriendIds(friends.map((f: UserDto) => f.id))
        }

        if (sentRequestsRes.status === 200 && sentRequestsRes.data && 'data' in sentRequestsRes.data) {
          const requests = sentRequestsRes.data.data as any[]
          setSentRequestIds(requests.map((r: any) => r.receiverId))
        }
      } catch (error) {
        console.error('Error fetching friends and requests:', error)
      }
    }

    if (currentUser?.id) {
      fetchFriendsAndRequests()
    }
  }, [currentUser?.id])

  useEffect(() => {
    if (queryParam) {
      setSearchValue(queryParam)
      handleSearch(queryParam, true)
    }
  }, [queryParam])

  const handleSearch = async (keyword: string, saveHistory: boolean = false) => {
    if (!keyword.trim()) {
      setSearchResults(null)
      return
    }

    setIsSearching(true)
    try {
      const response = await searchService.search(keyword, SearchType.All, 0, 50, saveHistory)
      setSearchResults(response.results || null)
    } catch (error) {
      console.error('Error searching:', error)
      message.error('Search failed. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }

  const handlePostUserClick = (e: React.MouseEvent, userName: string) => {
    e.stopPropagation()
    navigate(`/profile/${userName}`)
  }

  const handlePostGroupClick = (e: React.MouseEvent, groupId: string | undefined) => {
    e.stopPropagation()
    if (!groupId) return

    const isJoined = myGroupIds.includes(groupId)
    if (isJoined) {
      navigate(`/groups/${groupId}`)
    } else {
      navigate(`/group/${groupId}`)
    }
  }

  const handlePostUpdated = (updatedPost: PostData) => {
    setSearchResults((prevResults) => {
      if (!prevResults || !prevResults.posts) return prevResults
      return {
        ...prevResults,
        posts: prevResults.posts.map((post) =>
          post.id === updatedPost.id ? { ...post, ...updatedPost, group: post.group } : post
        )
      }
    })
  }

  const handlePostDeleted = (postId: string) => {
    setSearchResults((prevResults) => {
      if (!prevResults || !prevResults.posts) return prevResults
      return {
        ...prevResults,
        posts: prevResults.posts.filter((post) => post.id !== postId)
      }
    })
  }

  const toggleDropdown = (postId: string) => {
    setDropdownStates((prev) => ({
      ...prev,
      [postId]: !prev[postId]
    }))
  }

  const closeDropdown = (postId: string) => {
    setDropdownStates((prev) => ({
      ...prev,
      [postId]: false
    }))
  }

  const handleEditPost = (post: PostData) => {
    setEditingPost(post)
    setIsEditModalOpen(true)
    closeDropdown(post.id)
  }

  const handleEditSuccess = (updatedPost: PostData) => {
    setIsEditModalOpen(false)
    setEditingPost(null)
    message.success('Post updated successfully!')
    handlePostUpdated(updatedPost)
  }

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
    setEditingPost(null)
  }

  const handleDeletePost = (postId: string) => {
    setDeletingPostId(postId)
    setIsDeleteModalOpen(true)
    closeDropdown(postId)
  }

  const handleDeleteSuccess = () => {
    if (deletingPostId) {
      handlePostDeleted(deletingPostId)
    }
    setIsDeleteModalOpen(false)
    setDeletingPostId(null)
    message.success('Post deleted successfully!')
  }

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setDeletingPostId(null)
  }

  const handleStatusChange = () => {
    if (searchValue.trim()) {
      handleSearch(searchValue.trim(), false)
    }
  }

  const renderPrivacyIcon = (isPublic?: boolean) => {
    if (isPublic === undefined) return null

    return isPublic ? (
      <svg className='w-3.5 h-3.5 text-gray-500' fill='currentColor' viewBox='0 0 20 20'>
        <path
          fillRule='evenodd'
          d='M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0710 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z'
          clipRule='evenodd'
        />
      </svg>
    ) : (
      <svg className='w-3.5 h-3.5 text-gray-500' fill='currentColor' viewBox='0 0 20 20'>
        <path d='M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707l-.707-.707V8a6 6 0 00-6-6z' />
      </svg>
    )
  }

  const getPageTitle = () => {
    switch (activeTab) {
      case 'users':
        return 'Users'
      case 'groups':
        return 'Groups'
      case 'posts':
        return 'Posts'
      default:
        return 'Users'
    }
  }

  const renderUsers = () => {
    const users = searchResults?.users || []

    if (users.length === 0) {
      return (
        <div className='flex items-center justify-center h-64'>
          <Empty description='User not found' image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </div>
      )
    }

    return (
      <Row gutter={[16, 16]}>
        {users.map((user) => (
          <Col xs={24} sm={12} md={8} key={user.id}>
            <UserCard
              user={user}
              currentUserId={currentUser.id}
              isFriend={friendIds.includes(user.id)}
              isPending={sentRequestIds.includes(user.id)}
              onStatusChange={handleStatusChange}
            />
          </Col>
        ))}
      </Row>
    )
  }

  const renderGroups = () => {
    const groups = searchResults?.groups || []

    if (groups.length === 0) {
      return (
        <div className='flex items-center justify-center h-64'>
          <Empty description='Group not found' image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </div>
      )
    }

    return (
      <Row gutter={[16, 16]}>
        {groups.map((group) => {
          const userStatus = group.groupUsers?.find((gu) => gu.userId === currentUser?.id)
          const isJoined = userStatus && userStatus.roleName !== GroupRole.Pending
          const isPending = userStatus?.roleName === GroupRole.Pending

          return (
            <Col xs={24} sm={12} lg={8} key={group.id}>
              <GroupCard
                group={group}
                showActions={true}
                isJoined={!!isJoined}
                isPending={!!isPending}
                currentUserId={currentUser?.id || ''}
                onJoinSuccess={handleStatusChange}
              />
            </Col>
          )
        })}
      </Row>
    )
  }

  const renderPosts = () => {
    const posts = searchResults?.posts || []

    if (posts.length === 0) {
      return (
        <div className='flex items-center justify-center h-64'>
          <Empty description='Post not found' image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </div>
      )
    }

    return (
      <div className='space-y-4'>
        {posts.map((post) => {
          const hasPublicGroup = post.group?.isPublic === true
          const user = post.user
          const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim()
          return (
            <div key={post.id}>
              {hasPublicGroup && post.group && (
                <div className='bg-white rounded-t-lg border-t-2 border-x-2 border-b-0 border-gray-200 p-4 pb-2'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-3 flex-1'>
                      <div onClick={(e) => handlePostGroupClick(e, post.group!.id)} className='cursor-pointer'>
                        <div className='rounded-full border-2 border-gray-200'>
                          <Avatar src={post.group.imageUrl} size={40} icon={<TeamOutlined />} />
                        </div>
                      </div>
                      <div className='flex-1'>
                        <div
                          className='font-semibold text-gray-900 hover:underline cursor-pointer text-[15px]'
                          onClick={(e) => handlePostGroupClick(e, post.group!.id)}
                        >
                          {post.group.name}
                        </div>
                        <div className='flex items-center gap-2 mt-1'>
                          <div onClick={(e) => handlePostUserClick(e, user?.userName || '')} className='cursor-pointer'>
                            <div className='rounded-full border-2 border-gray-200'>
                              <Avatar
                                src={user?.avatarUrl}
                                size={24}
                                className='w-6 h-6 rounded-full object-cover'
                                style={{ minWidth: 24, minHeight: 24 }}
                              >
                                {user?.firstName?.[0] || user?.lastName?.[0] || ''}
                              </Avatar>
                            </div>
                          </div>
                          <div className='flex items-center gap-1'>
                            <span
                              className='text-[13px] text-gray-600 hover:underline cursor-pointer font-medium'
                              onClick={(e) => handlePostUserClick(e, user?.userName || '')}
                            >
                              {fullName}
                            </span>
                            <span className='text-[13px] text-gray-400'>·</span>
                            <span className='text-[13px] text-gray-500'>{getTimeAgo(post.createdAt)}</span>
                            {post.group?.isPublic !== undefined && (
                              <>
                                <span className='text-[8px] text-gray-400'>•</span>
                                {renderPrivacyIcon(post.group.isPublic)}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className='relative'>
                      <button
                        onClick={() => toggleDropdown(post.id)}
                        className='text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100'
                      >
                        <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
                          <path d='M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z' />
                        </svg>
                      </button>
                      <PostDropdownMenu
                        isOpen={dropdownStates[post.id] || false}
                        onClose={() => closeDropdown(post.id)}
                        postId={post.id}
                        isOwner={currentUser?.id === post.user?.id}
                        onEdit={() => handleEditPost(post)}
                        onDeleteClick={() => handleDeletePost(post.id)}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className={hasPublicGroup ? '' : ''}>
                <Post
                  {...post}
                  currentUserId={currentUser?.id || ''}
                  currentUser={currentUser}
                  onPostUpdated={handlePostUpdated}
                  onPostDeleted={handlePostDeleted}
                  hideHeader={hasPublicGroup}
                />
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderMainContent = () => {
    if (!searchResults && !isSearching) {
      return (
        <div className='flex items-center justify-center h-64'>
          <Empty description='Start searching to see results' image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </div>
      )
    }

    switch (activeTab) {
      case 'users':
        return renderUsers()
      case 'groups':
        return renderGroups()
      case 'posts':
        return renderPosts()
      default:
        return renderUsers()
    }
  }

  return (
    <>
      <style>
        {`
          .main-content-scroll::-webkit-scrollbar {
            width: 8px;
          }
          .main-content-scroll::-webkit-scrollbar-track {
            background: #f9fafb;
          }
          .main-content-scroll::-webkit-scrollbar-thumb {
            background-color: #d1d5db;
            border-radius: 4px;
          }
          .main-content-scroll::-webkit-scrollbar-thumb:hover {
            background-color: #9ca3af;
          }

          .sidebar-scroll::-webkit-scrollbar {
            width: 6px;
          }
          .sidebar-scroll::-webkit-scrollbar-track {
            background: transparent;
          }
          .sidebar-scroll::-webkit-scrollbar-thumb {
            background-color: #d1d5db;
            border-radius: 4px;
          }
          .sidebar-scroll::-webkit-scrollbar-thumb:hover {
            background-color: #9ca3af;
          }
        `}
      </style>

      {/* Edit Post Modal */}
      {editingPost && (
        <EditPostModal
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          postId={editingPost.id}
          onSave={handleEditSuccess}
          currentUser={currentUser}
        />
      )}

      {/* Delete Post Modal */}
      {deletingPostId && (
        <DeletePostModal
          isOpen={isDeleteModalOpen}
          onClose={handleCloseDeleteModal}
          onDeleteSuccess={handleDeleteSuccess}
          postId={deletingPostId}
        />
      )}

      <div className='flex min-h-screen bg-gray-50'>
        {/* Main Content */}
        <div
          className='flex-1 min-w-0 overflow-y-auto main-content-scroll'
          style={{
            maxHeight: '100vh',
            scrollbarWidth: 'thin',
            scrollbarColor: '#d1d5db #f9fafb'
          }}
        >
          <div className='max-w-6xl mx-auto py-6 px-4'>
            {/* Page Title */}
            <div className='mb-6'>
              <Title level={2} className='mb-0' style={{ fontSize: '28px', fontWeight: 700 }}>
                {getPageTitle()}
              </Title>
            </div>

            {/* Results */}
            {isSearching ? (
              <div className='flex items-center justify-center h-64'>
                <Spin size='large' />
              </div>
            ) : (
              renderMainContent()
            )}
          </div>
        </div>

        {/* Right Sidebar - Menu */}
        <div
          className='w-80 bg-white border-l border-gray-200 sticky top-0 h-screen overflow-y-auto sidebar-scroll z-[5] transition-all duration-300 flex-shrink-0'
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#d1d5db transparent'
          }}
        >
          <div className='p-4'>
            {/* Title */}
            <div className='mb-4'>
              <Text strong className='text-xl'>
                Search
              </Text>
            </div>

            {/* Divider */}
            <div className='border-t-2 border-gray-200 mb-4'></div>

            {/* Menu Items */}
            <div className='space-y-1'>
              <div
                onClick={() => setActiveTab('users')}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  activeTab === 'users' ? 'bg-blue-50' : 'hover:bg-gray-100'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    activeTab === 'users' ? 'bg-blue-500' : 'bg-gray-200'
                  }`}
                >
                  <UserOutlined className={`text-lg ${activeTab === 'users' ? 'text-white' : 'text-gray-700'}`} />
                </div>
                <div className='flex-1'>
                  <Text strong className='block'>
                    Users
                  </Text>
                  <Text type='secondary' className='text-xs'>
                    {searchResults?.totalUsersCount || 0} results
                  </Text>
                </div>
              </div>

              <div
                onClick={() => setActiveTab('groups')}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  activeTab === 'groups' ? 'bg-blue-50' : 'hover:bg-gray-100'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    activeTab === 'groups' ? 'bg-blue-500' : 'bg-gray-200'
                  }`}
                >
                  <TeamOutlined className={`text-lg ${activeTab === 'groups' ? 'text-white' : 'text-gray-700'}`} />
                </div>
                <div className='flex-1'>
                  <Text strong className='block'>
                    Groups
                  </Text>
                  <Text type='secondary' className='text-xs'>
                    {searchResults?.totalGroupsCount || 0} results
                  </Text>
                </div>
              </div>

              <div
                onClick={() => setActiveTab('posts')}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  activeTab === 'posts' ? 'bg-blue-50' : 'hover:bg-gray-100'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    activeTab === 'posts' ? 'bg-blue-500' : 'bg-gray-200'
                  }`}
                >
                  <FileTextOutlined className={`text-lg ${activeTab === 'posts' ? 'text-white' : 'text-gray-700'}`} />
                </div>
                <div className='flex-1'>
                  <Text strong className='block'>
                    Posts
                  </Text>
                  <Text type='secondary' className='text-xs'>
                    {searchResults?.totalPostsCount || 0} results
                  </Text>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default SearchPage
