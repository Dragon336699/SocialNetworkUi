import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Typography, Button, Input, Avatar, message, Spin, Empty } from 'antd'
import { PlusOutlined, SearchOutlined, UsergroupAddOutlined, ProfileOutlined, CompassOutlined } from '@ant-design/icons'
import { groupService } from '@/app/services/group.service'
import { GroupDto, GroupRole } from '@/app/types/Group/group.dto'
import { userService } from '@/app/services/user.service'
import { UserDto } from '@/app/types/User/user.dto'
import CreateGroupModal from '@/app/common/Modals/Group/CreateGroupModal'
import MyGroupsPage from './MyGroupsPage'
import GroupsFeed from './GroupsFeed'
import GroupsDiscover from './GroupsDiscover'
import useDevice from '@/app/hook/useDeivce'

const { Title, Text } = Typography

const Groups = () => {
  const navigate = useNavigate()
  const { isMobile, isTablet } = useDevice()
  const location = useLocation()
  const [myGroups, setMyGroups] = useState<GroupDto[]>([])
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeView, setActiveView] = useState<'feed' | 'discover' | 'my-groups' | null>('feed')
  const [currentUser, setCurrentUser] = useState<UserDto | null>(null)
  const [showAllGroups, setShowAllGroups] = useState(false)

  useEffect(() => {
    fetchCurrentUser()
  }, [])

  useEffect(() => {
    if (currentUser?.id) {
      fetchMyGroups()
    }
  }, [currentUser])

  // Phát hiện chế độ xem hiện tại từ URL
  useEffect(() => {
    if (location.pathname === '/groups') {
      setActiveView('feed')
    } else if (location.pathname === '/groups/discover') {
      setActiveView('discover')
    } else if (location.pathname === '/groups/my-groups') {
      setActiveView('my-groups')
    } else if (location.pathname.startsWith('/groups/')) {
      // Khi vào trang chi tiết nhóm, bỏ highlight tất cả menu items
      setActiveView(null)
    }
  }, [location.pathname])

  // Debounce search term
  useEffect(() => {
    if (!currentUser?.id) return

    const timer = setTimeout(() => {
      if (searchTerm.trim()) {
        handleSearch(searchTerm.trim())
      } else {
        fetchMyGroups()
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm, currentUser])

  // Lấy thông tin người dùng hiện tại
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

  // Lấy danh sách nhóm của người dùng
  const fetchMyGroups = async () => {
    try {
      setLoading(true)
      const response = await groupService.getMyGroups(0, 50)

      const approvedGroups = (response.groups || []).filter((group) => {
        const userStatus = group.groupUsers?.find((gu) => gu.userId === currentUser?.id)
        return userStatus && userStatus.roleName !== GroupRole.Pending
      })

      setMyGroups(approvedGroups)
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to fetch your groups'
      message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Tìm kiếm nhóm
  const handleSearch = async (term: string) => {
    try {
      setSearchLoading(true)
      const response = await groupService.searchMyGroups(term, 0, 50)

      const approvedGroups = (response.groups || []).filter((group) => {
        const userStatus = group.groupUsers?.find((gu) => gu.userId === currentUser?.id)
        return userStatus && userStatus.roleName !== GroupRole.Pending
      })

      setMyGroups(approvedGroups)
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to search groups'
      message.error(errorMessage)
      setMyGroups([])
    } finally {
      setSearchLoading(false)
    }
  }

  // Xử lý khi tạo nhóm thành công
  const handleCreateGroupSuccess = () => {
    setIsCreateModalOpen(false)
    setSearchTerm('')
    setShowAllGroups(false)
    fetchMyGroups()
  }

  // Lấy danh sách hiển thị (5 nhóm đầu hoặc tất cả)
  const displayedGroups = showAllGroups || searchTerm.trim() ? myGroups : myGroups.slice(0, 5)
  const hasMoreGroups = myGroups.length > 5

  const isGroupDetailPage = location.pathname.startsWith('/groups/') && location.pathname.split('/').length === 3
  const currentGroupId = isGroupDetailPage ? location.pathname.split('/groups/')[1] : null

  // Xử lý click menu
  const handleMenuClick = (view: 'feed' | 'discover' | 'my-groups') => {
    setActiveView(view)
    if (view === 'feed') {
      navigate('/groups')
    } else if (view === 'discover') {
      navigate('/groups/discover')
    } else if (view === 'my-groups') {
      navigate('/groups/my-groups')
    }
  }

  // Render nội dung chính
  const renderMainContent = () => {
    if (isGroupDetailPage) {
      return <Outlet />
    }

    switch (activeView) {
      case 'feed':
        return <GroupsFeed />
      case 'discover':
        return <GroupsDiscover />
      case 'my-groups':
        return <MyGroupsPage onGroupsUpdate={fetchMyGroups} />
      default:
        return <GroupsFeed />
    }
  }

  return (
    <>
      <style>
        {`
        /* Webkit scrollbar cho main content */
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
        
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}
      </style>

      <CreateGroupModal
        isModalOpen={isCreateModalOpen}
        handleCancel={() => setIsCreateModalOpen(false)}
        onCreateGroupSuccess={handleCreateGroupSuccess}
      />

      <div className={`flex min-h-screen bg-gray-50 ${isMobile ? 'flex-col' : 'flex-row'}`}>
        {isMobile && (
          <div className='bg-white border-b border-gray-200 sticky top-0 z-[10] p-3 shadow-sm'>
            <div className='flex items-center justify-between mb-3'>
              <Title level={4} className='!mb-0'>
                Groups
              </Title>
              <Button
                type='primary'
                shape='circle'
                icon={<PlusOutlined />}
                onClick={() => setIsCreateModalOpen(true)}
              />
            </div>

            <div className='flex gap-2 overflow-x-auto no-scrollbar pb-1'>
              {[
                { id: 'feed', label: 'Feed', icon: <ProfileOutlined /> },
                { id: 'discover', label: 'Discover', icon: <CompassOutlined /> },
                { id: 'my-groups', label: 'Your Groups', icon: <UsergroupAddOutlined /> }
              ].map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleMenuClick(item.id as 'feed' | 'discover' | 'my-groups')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full whitespace-nowrap border transition-all ${
                    activeView === item.id
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'bg-white border-gray-300 text-gray-700'
                  }`}
                >
                  {item.icon}
                  <span className='text-xs font-bold'>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div
          className={`flex-1 min-w-0 overflow-y-auto main-content-scroll ${isMobile ? '' : 'h-screen'}`}
          style={{
            maxHeight: isMobile ? 'none' : '100vh',
            scrollbarWidth: 'thin',
            scrollbarColor: '#d1d5db #f9fafb'
          }}
        >
          <div className={isMobile ? 'p-2' : 'p-0'}>{renderMainContent()}</div>
        </div>

        {!isMobile && !isTablet && (
          <div
            className={`${
              isTablet ? 'w-64' : 'w-72'
            } bg-white border-l border-gray-200 sticky top-0 h-screen overflow-y-auto sidebar-scroll z-[5] transition-all duration-300 flex-shrink-0`}
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#d1d5db transparent'
            }}
          >
            <div className='p-3'>
              <div className='mb-3 flex justify-end'>
                <Title level={4} className='mb-0'>
                  Groups
                </Title>
              </div>

              <Input
                placeholder='Search groups'
                prefix={<SearchOutlined className='text-gray-400' />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='mb-3 bg-gray-50 border-2 border-gray-300'
                allowClear
              />

              <div className='border-t-2 border-gray-200 mb-3'></div>

              <div className='space-y-1 mb-3'>
                {[
                  { id: 'feed', label: 'Your Feed', icon: <ProfileOutlined /> },
                  { id: 'discover', label: 'Discover', icon: <CompassOutlined /> },
                  { id: 'my-groups', label: 'Your Groups', icon: <UsergroupAddOutlined /> }
                ].map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleMenuClick(item.id as 'feed' | 'discover' | 'my-groups')}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                      activeView === item.id ? 'bg-blue-50' : 'hover:bg-gray-100'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        activeView === item.id ? 'bg-blue-500' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`text-lg flex items-center ${activeView === item.id ? 'text-white' : 'text-gray-700'}`}
                      >
                        {item.icon}
                      </span>
                    </div>
                    <Text strong className='text-sm'>
                      {item.label}
                    </Text>
                  </div>
                ))}
              </div>

              <Button
                type='primary'
                icon={<PlusOutlined />}
                onClick={() => setIsCreateModalOpen(true)}
                block
                size='large'
                className='mb-4'
              >
                Create New Group
              </Button>

              <div className='border-t-2 border-gray-200 mb-3'></div>

              <div className='pt-3'>
                <div className='flex items-center justify-between mb-2'>
                  <Text strong className='text-gray-700 text-sm'>
                    Groups You've Joined
                  </Text>
                  {!isTablet && (
                    <button
                      onClick={() => handleMenuClick('my-groups')}
                      className='text-blue-600 hover:text-blue-700 text-xs font-medium transition-colors'
                    >
                      See all
                    </button>
                  )}
                </div>

                {loading || searchLoading ? (
                  <div className='text-center py-6'>
                    <Spin size='small' />
                  </div>
                ) : myGroups.length > 0 ? (
                  <>
                    <div className='space-y-1'>
                      {displayedGroups.map((group) => (
                        <div
                          key={group.id}
                          onClick={() => navigate(`/groups/${group.id}`)}
                          className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                            currentGroupId === group.id ? 'bg-gray-200' : 'hover:bg-gray-100'
                          }`}
                        >
                          <div className='rounded-full border border-gray-200 flex-shrink-0'>
                            <Avatar
                              size={isTablet ? 28 : 32}
                              src={group.imageUrl}
                              style={{ backgroundColor: '#E2E5E9' }}
                            >
                              {group.name[0].toUpperCase()}
                            </Avatar>
                          </div>
                          <div className='flex-1 min-w-0'>
                            <Text strong className='block truncate text-sm'>
                              {group.name}
                            </Text>
                            {!isTablet && (
                              <Text type='secondary' className='text-xs block truncate'>
                                {group.memberCount} members
                              </Text>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {!searchTerm && hasMoreGroups && (
                      <button
                        onClick={() => setShowAllGroups(!showAllGroups)}
                        className='w-full mt-2 py-2 flex items-center justify-center gap-1 hover:bg-gray-100 rounded-lg transition-colors'
                      >
                        <Text className='text-sm text-gray-800 font-medium'>
                          {showAllGroups ? 'Show Less' : `More`}
                        </Text>
                      </button>
                    )}
                  </>
                ) : (
                  <div className='text-center py-6 text-xs text-gray-400'>No groups found</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default Groups
