import ProfileEdit from '@/app/components/Profile/ProfileEdit'
import ProfileView from '@/app/components/Profile/ProfileView'
import { useState } from 'react'

const ProfileUser = () => {
  const [isEditing, setIsEditing] = useState(false)
  const [profile] = useState({
    name: 'Nguyễn Văn A',
    bio: '???',
    avatar: '/diverse-user-avatars.png',
    gender: 'Male',
    followers: 1250,
    following: 342,
    posts: 89,
    location: 'Ho Chi Minh City, Vietnam',
    website: 'https://github.com',
    friends: 19,
    email: 'user@example.com'
  })

  // const handleSave = (updatedProfile: typeof profile) => {
  //   setProfile(updatedProfile)
  //   setIsEditing(false)
  // }

  return (
    <main className='min-h-screen bg-background'>
      {isEditing ? <ProfileEdit /> : <ProfileView profile={profile} onEdit={() => setIsEditing(true)} />}
    </main>
  )
}

export default ProfileUser
