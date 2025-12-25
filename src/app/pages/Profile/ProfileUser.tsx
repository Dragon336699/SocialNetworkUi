import ProfileEdit from '@/app/components/Profile/ProfileEdit'
import ProfileView from '@/app/components/Profile/ProfileView'
import { postService } from '@/app/services/post.service'
import { relationService } from '@/app/services/relation.service'
import { userService } from '@/app/services/user.service'
import { useUserStore } from '@/app/stores/auth'
import { ResponseHasData } from '@/app/types/Base/Responses/ResponseHasData'
import { PostData } from '@/app/types/Post/Post'
import { UserDto } from '@/app/types/User/user.dto'
import { SentFriendRequestData } from '@/app/types/UserRelation/userRelation'
import { message, Spin } from 'antd'
import { AxiosError } from 'axios'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const initialUserInfo: UserDto = {
  id: '',
  status: '',
  email: '',
  userName: '',
  firstName: '',
  lastName: '',
  avatarUrl: '',
  gender: '',
  phoneNumer: '',
  description: ''
}

const ProfileUser = () => {
  const { userName } = useParams<{ userName: string }>()
  const { user } = useUserStore()
  const navigate = useNavigate()

  const [userInfo, setUserInfo] = useState<UserDto>(initialUserInfo)
  const [posts, setPosts] = useState<PostData[]>([])
  const [followerList, setFolloweList] = useState<UserDto[]>([])
  const [followingList, setFollowingList] = useState<UserDto[]>([])
  const [friendList, setFriendList] = useState<UserDto[]>([])
  const [sentList, setSentList] = useState<SentFriendRequestData[]>([])
  const [receivedList, setReceivedList] = useState<SentFriendRequestData[]>([])

  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const getSentFriendReq = async () => {
    try {
      const res = await relationService.getFriendRequestsSent()
      if (res.status === 200) {
        const resData = res.data as ResponseHasData<SentFriendRequestData[]>

        const list = Array.isArray(resData.data) ? (resData.data as SentFriendRequestData[]) : []
        setSentList(list)
      }
    } catch (e) {
      console.log('False to get sent request!', e)
    }
  }

  const getFriendRequestsReceived = async () => {
    try {
      const res = await relationService.getFriendRequestsReceived()
      if (res.status === 200) {
        const resData = res.data as ResponseHasData<SentFriendRequestData[]>
        setReceivedList(resData.data as SentFriendRequestData[])
      } else {
        message.error('Get request failed!')
      }
    } catch {
      message.error('Get request failed!')
    }
  }

  const fetchData = useCallback(async () => {
    if (!userName) return

    try {
      setIsLoading(true)

      const userRes = await userService.getUserInfoByUserName(userName)
      if (userRes.status !== 200) throw new Error('User not found')

      const userData = userRes.data as UserDto
      setUserInfo(userData)

      const results = await Promise.allSettled([
        postService.getPostsByUser(userData.id),
        relationService.getFollowersList(userData.id),
        relationService.getFollowingList(userData.id),
        relationService.getFriendsList(userData.id)
      ])

      if (results[0].status === 'fulfilled') {
        const res = results[0].value
        const responseData = res.data as any
        const postsData = responseData.posts || responseData.post
        setPosts(Array.isArray(postsData) ? postsData : [])
      }

      if (results[1].status === 'fulfilled') {
        const resData = results[1].value.data as ResponseHasData<UserDto[]>
        setFolloweList(resData.data as UserDto[])
      }

      if (results[2].status === 'fulfilled') {
        const resData = results[2].value.data as ResponseHasData<UserDto[]>
        setFollowingList(resData.data as UserDto[])
      }

      if (results[3].status === 'fulfilled') {
        const resData = results[3].value.data as ResponseHasData<UserDto[]>
        setFriendList(resData.data as UserDto[])
      }
    } catch (err) {
      const error = err as AxiosError
      if (error?.response?.status === 400) {
        message.error('User not found!')
        navigate('/home')
      } else {
        message.error('Error while loading profile data!')
      }
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [userName, navigate])

  const handlePostCreated = useCallback(async () => {
    try {
      const res = await postService.getPostsByUser(userInfo.id)
      const responseData = res.data as any
      const postsData = responseData.posts || responseData.post
      setPosts(Array.isArray(postsData) ? postsData : [])
    } catch (error) {
      console.error('Failed to refresh posts:', error)
      fetchData()
    }
  }, [userInfo.id, fetchData])

  const handlePostUpdated = useCallback((updatedPost: PostData) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === updatedPost.id ? updatedPost : post
      )
    )
  }, [])

  const handlePostDeleted = useCallback((postId: string) => {
    setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId))
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (userName === user?.userName) return
    getSentFriendReq()
    getFriendRequestsReceived()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userName])

  return (
    <Spin spinning={isLoading}>
      <main className='min-h-screen bg-background'>
        {!isLoading &&
          userInfo.id &&
          (isEditing ? (
            <ProfileEdit onBack={() => setIsEditing(false)} userInfo={userInfo} refreshData={fetchData} />
          ) : (
            <ProfileView
              posts={posts}
              followerList={followerList}
              friendList={friendList}
              followingList={followingList}
              sentList={sentList}
              receivedList={receivedList}
              userInfo={userInfo}
              onEdit={() => setIsEditing(true)}
              refreshData={fetchData}
              onPostCreated={handlePostCreated}
              onPostUpdated={handlePostUpdated}
              onPostDeleted={handlePostDeleted}
            />
          ))}
      </main>
    </Spin>
  )
}

export default ProfileUser
