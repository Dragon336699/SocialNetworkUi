import { Avatar, Button, Card, Col, Divider, Row } from 'antd'
import {
  HeartOutlined,
  EnvironmentOutlined,
  LinkOutlined,
  UserAddOutlined,
  SendOutlined,
  ManOutlined,
  WomanOutlined
} from '@ant-design/icons'
import { usePosts } from '@/app/hook/usePosts'
import Post from '../Post/Post'
import CreatePostModal from '@/app/common/Modals/CreatePostModal'
import { useState } from 'react'
import { useParams } from 'react-router-dom'

interface ProfileViewProps {
  profile: {
    name: string
    bio: string
    gender: string
    avatar: string
    followers: number
    following: number
    posts: number
    location: string
    website: string
    friends: number
  }
  onEdit: () => void
}

export default function ProfileView({ profile, onEdit }: ProfileViewProps) {
  const { userId } = useParams()

  const { posts, createPost } = usePosts()
  const [isOpenCreatePost, setIsOpenCreatePost] = useState<boolean>(false)

  const handleCreatePost = async (formData: FormData) => {
    const success = await createPost(formData)
    if (success) {
      setIsOpenCreatePost(false)
    }
  }

  return (
    <>
      <CreatePostModal
        isModalOpen={isOpenCreatePost}
        handleCancel={() => setIsOpenCreatePost(false)}
        onCreatePost={handleCreatePost}
      />
      <div className='max-w-4xl mx-auto p-4'>
        <Card className='bg-white border border-gray-200 rounded-lg shadow'>
          <Row gutter={[24, 24]} align='middle'>
            <Col>
              <Avatar
                size={120}
                src='https://api.dicebear.com/7.x/miniavs/svg?seed=current-user'
                className='border-4 border-white shadow-lg'
              />
            </Col>
            <Col flex='auto'>
              <Row justify='space-between' align='middle'>
                <Col>
                  <h2 className='text-2xl md:text-3xl font-bold'>{profile.name}</h2>
                </Col>
                {/* Profile của mình */}
                {!userId && (
                  <Col>
                    <Button onClick={onEdit} className='px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100'>
                      Edit Profile
                    </Button>
                  </Col>
                )}
              </Row>

              <p className='mt-2 text-gray-700'>{profile.bio}</p>

              <Row gutter={[16, 16]} className='mt-4'>
                {[
                  { label: 'Posts', value: profile.posts },
                  { label: 'Followers', value: profile.followers.toLocaleString() },
                  { label: 'Following', value: profile.following },
                  { label: 'Friends', value: profile.friends }
                ].map((item) => (
                  <Col span={6} key={item.label}>
                    <Card className='text-center bg-gray-100 rounded-lg'>
                      <p className='text-xl font-bold text-primary'>{item.value}</p>
                      <p className='text-gray-500 text-sm mt-1'>{item.label}</p>
                    </Card>
                  </Col>
                ))}
              </Row>

              <div className='gap-6 mt-4 text-sm text-gray-500'>
                <div className='flex items-center gap-1'>
                  {profile.gender === 'Male' ? (
                    <ManOutlined className='text-blue-500' />
                  ) : (
                    <WomanOutlined className='text-pink-500' />
                  )}
                  {profile.gender}
                </div>
                <div className='flex items-center gap-1 mt-1'>
                  <EnvironmentOutlined className='text-amber-500' /> {profile.location}
                </div>
                <div className='flex items-center gap-1 mt-1'>
                  <LinkOutlined className='text-sky-500' />
                  <a href={profile.website} target='_blank' className='text-primary hover:underline truncate max-w-xs'>
                    {profile.website.replace('https://', '')}
                  </a>
                </div>
              </div>
            </Col>
          </Row>

          {/* Khi xem profile của người khác */}
          {userId && (
            <>
              <Divider className='my-6' />

              <Row gutter={[16, 16]}>
                {[
                  { icon: <UserAddOutlined className='text-blue-500 hover:text-blue-600' />, label: 'Add friend' },
                  { icon: <HeartOutlined className='text-red-500 hover:text-red-600' />, label: 'Follow' },
                  { icon: <SendOutlined className='text-green-500 hover:text-green-600' />, label: 'Send message' }
                ].map((btn) => (
                  <Col flex='auto' key={btn.label}>
                    <Button block icon={btn.icon} className='flex items-center justify-center gap-2 hover:bg-gray-100'>
                      {btn.label}
                    </Button>
                  </Col>
                ))}
              </Row>
            </>
          )}
        </Card>

        <div className='mt-6 space-y-4'>
          <h3 className='text-xl font-bold'>Recent posts</h3>
          <div className='bg-white rounded-lg p-4 my-6 shadow-sm border border-gray-200'>
            <div
              onClick={() => setIsOpenCreatePost(true)}
              className='flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors'
            >
              <Avatar size={48} src='https://api.dicebear.com/7.x/miniavs/svg?seed=current-user' />
              <div className='flex-1 bg-neutral-100 rounded-full px-4 py-3 text-neutral-600 hover:bg-neutral-200 transition-colors'>
                What's on your mind?
              </div>
            </div>
          </div>

          {posts.length > 0 && (
            <div className='space-y-4'>
              {posts.map((post, index) => (
                <div key={`${post.id}-${index}`}>
                  <Post {...post} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
