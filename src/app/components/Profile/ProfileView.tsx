import { Avatar, Button, Col, Row, Upload, Image, message } from 'antd'
import {
  HeartOutlined,
  EnvironmentOutlined,
  LinkOutlined,
  UserAddOutlined,
  SendOutlined,
  ManOutlined,
  WomanOutlined,
  FileTextOutlined,
  UserOutlined,
  CameraOutlined
} from '@ant-design/icons'
import CreatePostModal from '@/app/common/Modals/CreatePostModal'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { UploadChangeParam } from 'antd/es/upload'
import ImageCropModal from '@/app/common/Modals/ImageCropModal'
import { UserDto } from '@/app/types/User/user.dto'
import { userService } from '@/app/services/user.service'
import { base64ToFile } from '@/app/helper'
import { PostData } from '@/app/types/Post/Post'
import Post from '@/app/pages/Post/Post'
import { usePosts } from '@/app/hook/usePosts'
import { useUserStore } from '@/app/stores/auth'

const profile = {
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
}

type TabType = 'posts' | 'followers' | 'following' | 'friends'
const ProfileView = ({ posts, userInfo, onEdit }: { posts: PostData[]; userInfo: UserDto; onEdit: () => void }) => {
  const { user } = useUserStore()
  const { userName } = useParams()
  const { handlePostCreated, handlePostUpdated, handlePostDeleted } = usePosts()
  const [isOpenCreatePost, setIsOpenCreatePost] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<TabType>('posts')

  // const [form] = Form.useForm()
  const [previewImage, setPreviewImage] = useState(userInfo.avatarUrl || '')
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [imageToCrop, setImageToCrop] = useState<string | null>(null)

  const isMe = user?.userName === userName

  const handleCreatePostSuccess = async () => {
    setIsOpenCreatePost(false)
    handlePostCreated()
  }

  const getTabButtonClass = (tabName: TabType) => {
    const baseClass = 'px-6 py-2.5 font-medium text-sm transition-all duration-200 rounded-lg'
    return activeTab === tabName
      ? `${baseClass} bg-blue-600 text-white shadow-md hover:bg-blue-700`
      : `${baseClass} bg-gray-100 text-gray-700 hover:bg-gray-200`
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'posts':
        return (
          <div className='space-y-4'>
            {isMe && (
              <div className='bg-white rounded-lg p-4 shadow-sm border border-gray-200'>
                <div
                  onClick={() => setIsOpenCreatePost(true)}
                  className='flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors'
                >
                  <Avatar size={48} src='https://api.dicebear.com/7.x/miniavs/svg?seed=current-user' />
                  <div className='flex-1 bg-gray-100 rounded-full px-4 py-3 text-gray-600 hover:bg-gray-200 transition-colors'>
                    What's on your mind?
                  </div>
                </div>
              </div>
            )}
            {posts.length > 0 ? (
              <div className='space-y-4'>
                {posts.map((post, index) => (
                  <div key={`${post.id}-${index}`}>
                    <Post
                      {...post}
                      currentUserId={userInfo.id || ''}
                      onPostUpdated={handlePostUpdated}
                      onPostDeleted={handlePostDeleted}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className='text-center py-12'>
                <FileTextOutlined className='text-4xl text-gray-300 mb-3' />
                <p className='text-gray-500'>No posts yet</p>
              </div>
            )}
          </div>
        )

      case 'followers':
        return (
          <div className='space-y-3'>
            {profile.followers > 0 ? (
              [...Array(Math.min(profile.followers, 5))].map((_, i) => (
                <div
                  key={i}
                  className='flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow'
                >
                  <div className='flex items-center gap-3'>
                    <Avatar size={48} src={`https://api.dicebear.com/7.x/miniavs/svg?seed=follower-${i}`} />
                    <div>
                      <p className='font-semibold text-gray-900'>User {i + 1}</p>
                      <p className='text-sm text-gray-500'>@user{i + 1}</p>
                    </div>
                  </div>
                  <Button size='small' className='px-4'>
                    Follow
                  </Button>
                </div>
              ))
            ) : (
              <div className='text-center py-12'>
                <UserOutlined className='text-4xl text-gray-300 mb-3' />
                <p className='text-gray-500'>No followers yet</p>
              </div>
            )}
          </div>
        )

      case 'following':
        return (
          <div className='space-y-3'>
            {profile.following > 0 ? (
              [...Array(Math.min(profile.following, 5))].map((_, i) => (
                <div
                  key={i}
                  className='flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow'
                >
                  <div className='flex items-center gap-3'>
                    <Avatar size={48} src={`https://api.dicebear.com/7.x/miniavs/svg?seed=following-${i}`} />
                    <div>
                      <p className='font-semibold text-gray-900'>Following {i + 1}</p>
                      <p className='text-sm text-gray-500'>@following{i + 1}</p>
                    </div>
                  </div>
                  <Button size='small' type='primary' className='px-4'>
                    Following
                  </Button>
                </div>
              ))
            ) : (
              <div className='text-center py-12'>
                <UserOutlined className='text-4xl text-gray-300 mb-3' />
                <p className='text-gray-500'>Not following anyone yet</p>
              </div>
            )}
          </div>
        )

      case 'friends':
        return (
          <div className='space-y-3'>
            {profile.friends > 0 ? (
              [...Array(Math.min(profile.friends, 5))].map((_, i) => (
                <div
                  key={i}
                  className='flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow'
                >
                  <div className='flex items-center gap-3'>
                    <Avatar size={48} src={`https://api.dicebear.com/7.x/miniavs/svg?seed=friend-${i}`} />
                    <div>
                      <p className='font-semibold text-gray-900'>Friend {i + 1}</p>
                      <p className='text-sm text-gray-500'>@friend{i + 1}</p>
                    </div>
                  </div>
                  <Button size='small' danger>
                    Remove
                  </Button>
                </div>
              ))
            ) : (
              <div className='text-center py-12'>
                <UserOutlined className='text-4xl text-gray-300 mb-3' />
                <p className='text-gray-500'>No friends yet</p>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  const stats = [
    { label: 'Posts', value: posts.length, active: 'posts' },
    { label: 'Followers', value: profile.followers, active: 'followers' },
    { label: 'Following', value: profile.following, active: 'following' },
    { label: 'Friends', value: profile.friends, active: 'friends' }
  ]

  const handleAvatarChange = (info: UploadChangeParam) => {
    const file = info.file.originFileObj
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const url = e.target?.result as string

      setImageToCrop(url)
      setCropModalOpen(true)
    }

    reader.readAsDataURL(file)
  }

  const changeAvatar = async (croppedImg: string) => {
    try {
      setLoading(true)
      const newAvatar = base64ToFile(croppedImg, 'avatar.png')
      const formData = new FormData()
      formData.append('Avatar', newAvatar)

      const res = await userService.changeAvatar(formData)

      if (res.status === 200) {
        setLoading(false)
        message.success('Avatar changed successfully!')
        setPreviewImage(croppedImg)
        setCropModalOpen(false)
      }
    } catch (err) {
      setLoading(false)
      console.log('Failed to change avatar: ', err)
    }
  }

  return (
    <>
      <CreatePostModal
        isModalOpen={isOpenCreatePost}
        handleCancel={() => setIsOpenCreatePost(false)}
        onCreatePostSuccess={handleCreatePostSuccess}
      />
      <ImageCropModal
        open={cropModalOpen}
        image={imageToCrop}
        loading={loading}
        onClose={() => setCropModalOpen(false)}
        onCropDone={(croppedImg) => {
          changeAvatar(croppedImg)
        }}
      />

      <div className='max-w-5xl mx-auto p-4 md:p-6'>
        <div className='rounded-xl p-6 md:p-8 shadow-sm border border-blue-100 mb-8'>
          <Row gutter={[32, 24]} align='middle'>
            <Col>
              <Image
                src={previewImage}
                className='rounded-full object-cover border'
                alt='avatar'
                style={{ width: 140, height: 140 }}
                preview={{
                  mask: false,
                  toolbarRender: () => null,
                  movable: false
                }}
              />
              {/* <Avatar size={140} src={previewImage} className='border-4 border-white shadow-lg' /> */}
              {isMe && (
                <Upload
                  showUploadList={false}
                  onChange={handleAvatarChange}
                  customRequest={({ onSuccess }) => {
                    setTimeout(() => {
                      if (onSuccess) {
                        onSuccess('ok')
                      }
                    }, 0)
                  }}
                  accept='image/*'
                >
                  <div
                    className='absolute bottom-[2px] right-[37px] rounded-full cursor-pointer shadow-md transition
             flex items-center justify-center'
                    style={{
                      width: 35,
                      height: 35,
                      transform: 'translate(25%, 25%)',
                      backgroundColor: '#f8aeae',
                      color: 'white'
                    }}
                  >
                    <CameraOutlined className='text-lg text-pink-500' />
                  </div>
                </Upload>
              )}
            </Col>
            <Col flex='auto'>
              <Row justify='space-between' align='middle' className='mb-4'>
                <Col>
                  <h1 className='text-xl md:text-xl font-bold text-gray-900'>{`${userInfo.lastName} ${userInfo.firstName}`}</h1>
                </Col>
                {isMe && (
                  <Col>
                    <Button onClick={onEdit} type='primary' size='large' className='px-6 font-medium'>
                      Edit Profile
                    </Button>
                  </Col>
                )}
              </Row>

              <p className='text-lg text-gray-700 mb-6'>{userInfo.description}</p>

              <div className='flex flex-wrap items-center gap-20 text-gray-800 text-base'>
                {stats.map((item) => (
                  <span key={item.label}>
                    <span
                      className='font-bold hover:underline cursor-pointer'
                      onClick={() => setActiveTab(item.active as TabType)}
                    >
                      {item.value}
                    </span>{' '}
                    {item.label}
                  </span>
                ))}
              </div>

              <div className='gap-6 mt-6 text-sm text-gray-600 flex flex-wrap'>
                <div className='flex items-center gap-2'>
                  {userInfo.gender === 'Male' ? (
                    <ManOutlined className='text-lg text-blue-500' />
                  ) : userInfo.gender === 'Female' ? (
                    <WomanOutlined className='text-lg text-pink-500' />
                  ) : (
                    <UserOutlined className='text-md text-purple-500' />
                  )}
                  <span>{userInfo.gender}</span>
                </div>
                <div className='flex items-center gap-2'>
                  <EnvironmentOutlined className='text-lg text-amber-500' />
                  <span>{profile.location}</span>
                </div>
                <div className='flex items-center gap-2'>
                  <LinkOutlined className='text-lg text-sky-500' />
                  <a
                    href={profile.website}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-blue-600 hover:underline truncate'
                  >
                    {profile.website.replace('https://', '').replace('http://', '')}
                  </a>
                </div>
              </div>
            </Col>
          </Row>

          {userName && (
            <div className='mt-6 pt-6 border-t border-blue-200'>
              <Row gutter={[12, 12]}>
                {[
                  { icon: <UserAddOutlined className='text-blue-500 hover:text-blue-600' />, label: 'Add friend' },
                  { icon: <HeartOutlined className='text-red-500 hover:text-red-600' />, label: 'Follow' },
                  { icon: <SendOutlined className='text-green-500 hover:text-green-600' />, label: 'Send message' }
                ].map((btn) => (
                  <Col flex='auto' key={btn.label} xs={24} sm={8}>
                    <Button block icon={btn.icon} size='large' className='flex items-center justify-center gap-2'>
                      {btn.label}
                    </Button>
                  </Col>
                ))}
              </Row>
            </div>
          )}
        </div>

        <div className='mb-6'>
          <div className='flex gap-2 flex-wrap'>
            <button onClick={() => setActiveTab('posts')} className={getTabButtonClass('posts')}>
              <FileTextOutlined className='mr-2' />
              Posts
            </button>
            <button onClick={() => setActiveTab('followers')} className={getTabButtonClass('followers')}>
              <UserOutlined className='mr-2' />
              Followers
            </button>
            <button onClick={() => setActiveTab('following')} className={getTabButtonClass('following')}>
              <UserOutlined className='mr-2' />
              Following
            </button>
            <button onClick={() => setActiveTab('friends')} className={getTabButtonClass('friends')}>
              <UserOutlined className='mr-2' />
              Friends
            </button>
          </div>
        </div>

        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>{renderTabContent()}</div>
      </div>
    </>
  )
}

export default ProfileView
