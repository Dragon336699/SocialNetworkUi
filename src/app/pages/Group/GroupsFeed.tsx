import { useState, useEffect } from 'react'
import { Typography, Spin, Empty, message } from 'antd'
import { groupService } from '@/app/services/group.service'
import { PostData } from '@/app/types/Post/Post'
import { UserDto } from '@/app/types/User/user.dto'
import { GroupRole } from '@/app/types/Group/group.dto'
import { userService } from '@/app/services/user.service'
import Post from '../Post/Post'

const { Text } = Typography

const GroupsFeed = () => {
  const defaultUser: UserDto = {
    id: '',
    avatarUrl: '',
    firstName: 'Guest',
    lastName: '',
    email: '',
    userName: '',
    status: ''
  }

  const [posts, setPosts] = useState<PostData[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<UserDto>(defaultUser)

  useEffect(() => {
    fetchCurrentUser()
  }, [])

  useEffect(() => {
    if (currentUser.id) {
      fetchMyGroupsAndPosts()
    }
  }, [currentUser.id])

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

  // Lấy tất cả nhóm và bài viết của người dùng
  const fetchMyGroupsAndPosts = async () => {
    try {
      setLoading(true)
      const groupsResponse = await groupService.getMyGroups(0, 50)

      const approvedGroups = groupsResponse.groups.filter(group => {
        const userStatus = group.groupUsers?.find(gu => gu.userId === currentUser.id)
        return userStatus && userStatus.roleName !== GroupRole.Pending
      })

      const allPosts: PostData[] = []
      approvedGroups.forEach(group => {
        if (group.posts && group.posts.length > 0) {
          allPosts.push(...(group.posts as unknown as PostData[]))
        }
      })
      // Sắp xếp bài viết theo ngày tạo mới nhất
      allPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      setPosts(allPosts)
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Unable to load posts'
      message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <Spin size='large' />
      </div>
    )
  }

  return (
    <div className='max-w-2xl mx-auto py-6 px-4'>
      {/* Header */}
      <div className='mb-6'>
        <Text type='secondary'>View the latest posts from groups you've joined</Text>
      </div>

      {/* Posts */}
      {posts.length > 0 ? (
        <div className='space-y-4'>
          {posts.map((post) => (
            <Post
              key={post.id}
              {...post}
              currentUserId={currentUser?.id || ''}
              currentUser={currentUser}
              onPostUpdated={() => fetchMyGroupsAndPosts()}
              onPostDeleted={() => fetchMyGroupsAndPosts()}
            />
          ))}
        </div>
      ) : (
        <Empty description='No posts yet from your groups' image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
    </div>
  )
}

export default GroupsFeed