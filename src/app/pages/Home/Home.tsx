import CreatePostModal from '@/app/common/Modals/CreatePostModal'
import Post from '../Post/Post'
import { usePosts } from '@/app/hook/usePosts'
import { Avatar, Typography, Spin, Alert, Button, Empty, message, Badge, Divider } from 'antd'
import { useState, useEffect, useCallback } from 'react'
import { CheckOutlined, ReloadOutlined, UserAddOutlined } from '@ant-design/icons'
import { userService } from '@/app/services/user.service'
import { UserDto } from '@/app/types/User/user.dto'
import { SeenPost } from '@/app/types/Post/Post'
import { useSeenPost } from '@/app/hook/useSeenPost'
import { DEFAULT_AVATAR_URL } from '@/app/common/Assests/CommonVariable'
import { relationService } from '@/app/services/relation.service'
import { ResponseHasData } from '@/app/types/Base/Responses/ResponseHasData'
import { SuggestUsers } from '@/app/types/UserRelation/userRelation'

const { Title, Text } = Typography

const Home = () => {
  const defaultUser: UserDto = {
    id: '',
    avatarUrl: '',
    firstName: 'Guest',
    lastName: '',
    email: '',
    userName: '',
    status: ''
  }

  const [isOpenCreatePost, setIsOpenCreatePost] = useState<boolean>(false)
  const [userInfo, setUserInfo] = useState<UserDto>(defaultUser)
  const [friendsList, setFriendsList] = useState<UserDto[]>([])
  const [suggestUsers, setSuggestUsers] = useState<SuggestUsers[]>([])
  const [requestedSuggestIds, setRequestedSuggestIds] = useState<string[]>([])

  const getFriend = async () => {
    try {
      const res = await relationService.getFriendsList()
      if (res.status === 200) {
        const resData = res.data as ResponseHasData<UserDto[]>
        setFriendsList(resData.data as UserDto[])
      }
    } catch {
      message.error('Error fetching friends list')
    }
  }

  const getSuggestFriends = async () => {
    try {
      const res = await relationService.getSuggestFriends(0, 5)
      if (res.status === 200) setSuggestUsers((res.data as any).data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await userService.getUserInfoByToken()
        if (response.status === 200 && response.data) {
          if ('id' in response.data) {
            const userData = response.data as UserDto
            setUserInfo(userData)
          }
        }
      } catch {
        message.error('Error fetching current user')
      }
    }
    fetchCurrentUser()
    getFriend()
    getSuggestFriends()
  }, [])

  const {
    posts,
    loading,
    error,
    hasMore,
    refetch,
    loadMore,
    clearError,
    handlePostCreated,
    handlePostUpdated,
    handlePostDeleted,
    handleSeenPost
  } = usePosts()

  const handleCloseCreatePost = () => {
    setIsOpenCreatePost(false)
  }

  const handleCreatePostSuccess = async (newPost?: any) => {
    setIsOpenCreatePost(false)
    handlePostCreated(newPost)
  }

  const { addSeen, flushNow } = useSeenPost(async (postsInfo: SeenPost[]) => {
    handleSeenPost(postsInfo)
  })

  const handleAddFriend = async (userId: string) => {
    const res = await relationService.addFriend(userId)
    if (res.status === 200) {
      message.success('Friend request sent')
      setRequestedSuggestIds((prev) => [...prev, userId])
    }
  }

  useEffect(() => {
    return () => {
      flushNow()
    }
  }, [flushNow])

  const handleScroll = useCallback(() => {
    const scrollTop = document.documentElement.scrollTop
    const scrollHeight = document.documentElement.scrollHeight
    const clientHeight = window.innerHeight
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight

    if (scrollPercentage > 0.8 && !loading && hasMore) {
      loadMore()
    }
  }, [loading, hasMore, loadMore])

  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    const throttledScroll = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(handleScroll, 100)
    }
    window.addEventListener('scroll', throttledScroll)
    return () => {
      window.removeEventListener('scroll', throttledScroll)
      clearTimeout(timeoutId)
    }
  }, [handleScroll])

  if (error) {
    return (
      <div className='min-h-screen bg-[#F0F2F5] py-6'>
        <div className='max-w-2xl mx-auto px-4'>
          <Alert
            message='Failed to load data'
            description={error}
            type='error'
            action={
              <Button
                size='small'
                danger
                onClick={() => {
                  clearError()
                  refetch()
                }}
              >
                <ReloadOutlined /> Try again
              </Button>
            }
            closable
            onClose={clearError}
          />
        </div>
      </div>
    )
  }

  if (loading && posts.length === 0) {
    return (
      <div className='min-h-screen bg-[#F0F2F5] flex items-center justify-center'>
        <div className='text-center'>
          <Spin size='large' />
          <div className='mt-4'>
            <Text type='secondary'>Loading posts...</Text>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-[#F0F2F5]'>
      <CreatePostModal
        isModalOpen={isOpenCreatePost}
        handleCancel={handleCloseCreatePost}
        onCreatePostSuccess={handleCreatePostSuccess}
        currentUser={userInfo}
      />

      <div className='pt-6 px-4'>
        <div className='flex justify-between max-w-[1200px] mx-auto'>
          <div className='flex-1 flex justify-center'>
            <div className='w-full max-w-[680px]'>
              <div className='bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-200'>
                <div className='flex items-center gap-3 mb-3'>
                  <Avatar size={40} src={userInfo?.avatarUrl || DEFAULT_AVATAR_URL} />
                  <div
                    onClick={() => setIsOpenCreatePost(true)}
                    className='flex-1 bg-[#F0F2F5] hover:bg-[#E4E6EB] rounded-full px-4 py-2 text-[#65676B] text-[17px] cursor-pointer transition-colors'
                  >
                    What's on your mind, {userInfo?.firstName}?
                  </div>
                </div>
                <Divider className='my-3' />
              </div>

              <div className='space-y-4'>
                {posts.length > 0 ? (
                  <>
                    {posts.map((feed) => (
                      <Post
                        key={feed.feedId}
                        {...feed.post}
                        feedId={feed.feedId}
                        feedCreatedAt={feed.createdAt}
                        currentUserId={userInfo?.id || ''}
                        onPostUpdated={handlePostUpdated}
                        onPostDeleted={handlePostDeleted}
                        onSeen={addSeen}
                        currentUser={userInfo}
                      />
                    ))}

                    {loading && (
                      <div className='text-center py-6'>
                        <Spin />
                        <div className='mt-2'>
                          <Text type='secondary'>Loading more posts...</Text>
                        </div>
                      </div>
                    )}

                    {!loading && hasMore && (
                      <div className='text-center py-6'>
                        <Button onClick={loadMore} type='default' size='large'>
                          Load more posts
                        </Button>
                      </div>
                    )}

                    {!hasMore && (
                      <div className='text-center py-8'>
                        <Text type='secondary'>🎉 You’ve reached the end of all posts!</Text>
                      </div>
                    )}
                  </>
                ) : (
                  <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-8'>
                    <Empty
                      description={
                        <div>
                          <Title level={4} type='secondary'>
                            No posts yet
                          </Title>
                          <Text type='secondary'>Be the first to share something interesting!</Text>
                        </div>
                      }
                    >
                      <Button type='primary' onClick={() => setIsOpenCreatePost(true)} className='mt-4'>
                        Create post
                      </Button>
                    </Empty>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className='hidden lg:block w-[300px] sticky top-20'>
            <div className='px-2'>
              <div className='flex justify-between items-center mb-4 px-2'>
                <Text className='font-semibold text-[#65676B] text-[17px]'>Contacts</Text>
              </div>

              <div className='space-y-1'>
                {friendsList.map((friend) => (
                  <div
                    key={friend.id}
                    className='flex items-center gap-3 p-2 hover:bg-[#E4E6EB] rounded-lg cursor-pointer transition-colors'
                  >
                    <Badge dot status={friend.status === 'online' ? 'success' : 'default'} offset={[-4, 28]}>
                      <Avatar size={36} src={friend.avatarUrl || DEFAULT_AVATAR_URL} />
                    </Badge>

                    <span className='font-semibold text-[15px] text-[#050505]'>
                      {friend.lastName} {friend.firstName}
                    </span>
                  </div>
                ))}
              </div>

              <Divider className='my-4' />

              <div className='flex justify-between items-center mb-4 px-2'>
                <Text className='font-semibold text-[#65676B] text-[17px]'>Suggestions</Text>
              </div>

              <div className='space-y-1'>
                <div className='space-y-4'>
                  {suggestUsers.map((req) => {
                    const isRequested = requestedSuggestIds.includes(req.user.id)
                    return (
                      <div key={req.user.id} className='flex items-center justify-between group px-2'>
                        <div className='flex gap-3 items-center overflow-hidden'>
                          <Avatar size={40} src={req.user.avatarUrl || DEFAULT_AVATAR_URL} />
                          <div className='overflow-hidden'>
                            <h4 className='font-semibold text-[15px] truncate m-0'>
                              {req.user.lastName + ' ' + req.user.firstName}
                            </h4>
                            <Text type='secondary' className='text-[12px]'>
                              {req.mutualFriendCount} mutual friends
                            </Text>
                          </div>
                        </div>
                        <Button
                          type={isRequested ? 'default' : 'primary'}
                          shape='circle'
                          icon={isRequested ? <CheckOutlined /> : <UserAddOutlined />}
                          disabled={isRequested}
                          onClick={() => handleAddFriend(req.user.id)}
                          className={isRequested ? 'bg-green-50 text-green-600' : ''}
                        />
                      </div>
                    )
                  })}
                  {suggestUsers.length === 0 && (
                    <Empty description='No suggestions' image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
