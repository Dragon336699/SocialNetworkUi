import ProfileEdit from '@/app/components/Profile/ProfileEdit'
import ProfileView from '@/app/components/Profile/ProfileView'
import { userService } from '@/app/services/user.service'
import { UserDto } from '@/app/types/User/user.dto'
import { message, Spin } from 'antd'
import { useEffect, useState } from 'react'

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
  const [userInfo, setUserInfo] = useState<UserDto>(initialUserInfo)

  const [isEditing, setIsEditing] = useState(false)
  const [countLoading, setCountLoading] = useState<number>(0)

  const getUserInfo = async () => {
    try {
      setCountLoading((pre) => pre + 1)
      const res = await userService.getUserInfoByToken()
      if (res.status === 200) {
        setUserInfo(res.data as UserDto)
        setCountLoading((pre) => pre - 1)
      }
    } catch {
      message.error('Error while getting user infomation!')
    }
  }

  useEffect(() => {
    getUserInfo()
  }, [])

  // const handleSave = (updatedProfile: typeof profile) => {
  //   setProfile(updatedProfile)
  //   setIsEditing(false)
  // }

  return (
    <Spin spinning={countLoading !== 0}>
      <main className='min-h-screen bg-background'>
        {countLoading === 0 &&
          (isEditing ? <ProfileEdit /> : <ProfileView userInfo={userInfo} onEdit={() => setIsEditing(true)} />)}
      </main>
    </Spin>
  )
}

export default ProfileUser
