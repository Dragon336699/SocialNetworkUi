import ProfileEdit from '@/app/components/Profile/ProfileEdit'
import ProfileView from '@/app/components/Profile/ProfileView'
import { postService } from '@/app/services/post.service'
import { userService } from '@/app/services/user.service'
import { PostData } from '@/app/types/Post/Post'
import { UserDto } from '@/app/types/User/user.dto'
import { message, Spin } from 'antd'
import { AxiosError } from 'axios'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const initialUserInfo = {
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
  const { userName } = useParams()
  const navigate = useNavigate()
  const [userInfo, setUserInfo] = useState<UserDto>(initialUserInfo)
  const [posts, setPosts] = useState<PostData[]>([])

  const [isEditing, setIsEditing] = useState(false)
  const [countLoading, setCountLoading] = useState<number>(0)

  const getUserInfo = async () => {
    try {
      setCountLoading((pre) => pre + 1)
      let res
      if (userName) res = await userService.getUserInfoByUserName(userName)
      else res = await userService.getUserInfoByToken()
      if (res.status === 200) {
        setUserInfo(res.data as UserDto)
        setCountLoading((pre) => pre - 1)
      }
    } catch (err) {
      const error = err as AxiosError
      setCountLoading((pre) => pre - 1)
      const status = error?.response?.status

      if (status === 400) {
        message.error('User not found!')
        navigate('/home')
        return
      }

      message.error('Error while getting user information!')
    }
  }

  const getPost = async () => {
    try {
      if (!userInfo.id && userName) return
      setCountLoading((pre) => pre + 1)
      const res = await postService.getPostsByUser(userInfo.id)
      if (res.status === 200) {
        setPosts(res.data.posts)
        setCountLoading((pre) => pre - 1)
      }
    } catch (err) {
      setCountLoading((pre) => pre - 1)
      console.log('Error to load posts!: ', err)
    }
  }

  useEffect(() => {
    getUserInfo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userName])

  useEffect(() => {
    if (userInfo.id) {
      getPost()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInfo.id])

  return (
    <Spin spinning={countLoading !== 0}>
      <main className='min-h-screen bg-background'>
        {countLoading === 0 &&
          (isEditing ? (
            <ProfileEdit onBack={() => setIsEditing(false)} userInfo={userInfo} refreshData={getUserInfo} />
          ) : (
            <ProfileView posts={posts} userInfo={userInfo} onEdit={() => setIsEditing(true)} />
          ))}
      </main>
    </Spin>
  )
}

export default ProfileUser
