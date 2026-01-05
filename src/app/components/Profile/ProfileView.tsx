import { Avatar, Button, Col, Row, Upload, Image, message, Empty } from 'antd'
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
  CameraOutlined,
  HeartFilled,
  CloseOutlined
} from '@ant-design/icons'
import CreatePostModal from '@/app/common/Modals/CreatePostModal'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { UploadChangeParam } from 'antd/es/upload'
import ImageCropModal from '@/app/common/Modals/ImageCropModal'
import { UserDto } from '@/app/types/User/user.dto'
import { userService } from '@/app/services/user.service'
import { base64ToFile } from '@/app/helper'
import { PostData } from '@/app/types/Post/Post'
import Post from '@/app/pages/Post/Post'
import { useUserStore } from '@/app/stores/auth'
import { relationService } from '@/app/services/relation.service'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUserFriends } from '@fortawesome/free-solid-svg-icons'
import { SentFriendRequestData } from '@/app/types/UserRelation/userRelation'
import ActionConfirmModal from '@/app/common/Modals/ActionConfirmModal'
import { ActionType } from '@/app/types/Common'
import { DEFAULT_AVATAR_URL } from '@/app/common/Assests/CommonVariable'
import { interactionService } from '@/app/services/interaction.service'
import { conversationService } from '@/app/services/conversation.service'
import { BaseResponse } from '@/app/types/Base/Responses/baseResponse'
import { ResponseHasData } from '@/app/types/Base/Responses/ResponseHasData'

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
type statusRelation = 'default' | 'sendRequest' | 'friend' | 'receiveRequest'
const ProfileView = ({
  posts,
  followerList,
  friendList,
  followingList,
  userInfo,
  sentList,
  receivedList,
  refreshData,
  onEdit,
  onPostCreated,
  onPostUpdated,
  onPostDeleted
}: {
  posts: PostData[]
  followerList: UserDto[]
  friendList: UserDto[]
  followingList: UserDto[]
  userInfo: UserDto
  sentList: SentFriendRequestData[]
  receivedList: SentFriendRequestData[]
  refreshData: () => void
  onEdit: () => void
  onPostCreated: (newPost?: PostData) => void
  onPostUpdated: (updatedPost: PostData) => void
  onPostDeleted: (postId: string) => void
}) => {
  const { user } = useUserStore()
  const { userName } = useParams()
  const isMe = user?.userName === userName
  const navigate = useNavigate()

  const isFriend = friendList.some((friend) => friend.id === user?.id)
  const [activeTab, setActiveTab] = useState<TabType>('posts')
  const [relation, setRelation] = useState<statusRelation>(isFriend ? 'friend' : 'default')
  const [previewImage, setPreviewImage] = useState(userInfo.avatarUrl)
  const [imageToCrop, setImageToCrop] = useState<string | null>(null)
  const [currentAction, setCurrentAction] = useState<ActionType>('unfriend')
  const [selectedFriend, setSelectedFriend] = useState<UserDto | null>(null)

  const [isOpenCreatePost, setIsOpenCreatePost] = useState<boolean>(false)
  const [isOpenRelationModal, setIsOpenRelationModal] = useState<boolean>(false)
  const [cropModalOpen, setCropModalOpen] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [loadingRequestFriend, setLoadingRequestFriend] = useState<boolean>(false)
  const [isFollowing, setIsFollowing] = useState<boolean>(false)

  useEffect(() => {
    if (!user || !userInfo) return
    const isFriend = friendList.some((f) => f.id === user.id)
    const isFollowing = followerList.some((f) => f.id === user.id)
    setIsFollowing(isFollowing)
    if (isFriend) {
      setRelation('friend')
      return
    }
    const hasSent = sentList.some((req) => req.receiverId === userInfo.id)
    if (hasSent) {
      setRelation('sendRequest')
      return
    }

    const hasReceived = receivedList.some((req) => req.senderId === userInfo.id)
    if (hasReceived) {
      setRelation('receiveRequest')
      return
    }
    setRelation('default')
  }, [user, userInfo, friendList, sentList, receivedList, followerList])

  useEffect(() => {
    if (!isMe) interactionService.viewUser(userInfo.id)
  }, [])

  const handleContactClick = async (friendId: string) => {
    try {
      const response = await conversationService.createConversation([friendId], 'Personal')
      if (response.status === 400) {
        const res = response.data as BaseResponse
        message.error(res.message)
      } else if (response.status === 200) {
        const res = response.data as ResponseHasData<string>
        navigate(`/Inbox/${res.data}`)
      }
    } catch (err) {
      console.log('Error: ', err)
      message.error('Cannot open conversation')
    }
  }

  const handleFriend = async () => {
    try {
      setLoadingRequestFriend(true)
      if (relation === 'sendRequest') {
        const res = await relationService.cancelFriendRequest(userInfo.id)
        if (res.status === 200) {
          setRelation('default')
          setLoadingRequestFriend(false)
          message.success('Canceled friend request')
        }
      } else if (relation === 'default') {
        const res = await relationService.addFriend(userInfo.id)
        if (res.status === 200) {
          setRelation('sendRequest')
          setLoadingRequestFriend(false)
          message.success('Friend request sent')
        }
      } else if (relation === 'friend') {
        setCurrentAction('unfriend')
        setIsOpenRelationModal(true)
        setLoadingRequestFriend(false)
      } else {
        const res = await relationService.approveFriendRequest(userInfo.id)
        if (res.status === 200) {
          setRelation('friend')
          setLoadingRequestFriend(false)
          refreshData()
          message.success('Accepted successfully')
        }
      }
    } catch {
      setLoadingRequestFriend(false)
      message.error('Error. Try again!')
    }
  }

  const handleUnFriend = async (user: UserDto) => {
    try {
      setLoadingRequestFriend(true)
      const res = await relationService.unFriend(user.id)
      if (res.status === 200) {
        setRelation('default')
        setLoadingRequestFriend(false)
        setIsOpenRelationModal(false)
        message.success('Unfriended successfully')
      }
    } catch {
      setLoadingRequestFriend(false)
      message.error('Error. Try again!')
    }
  }

  const handleFollow = async () => {
    try {
      const res = await relationService.followUser(userInfo.id)
      if (res.status === 200) {
        setIsFollowing(true)
        message.success('Following')
      }
    } catch {
      message.error('Error. Try again!')
    }
  }

  const handleUnFollow = async (user: UserDto) => {
    try {
      const res = await relationService.unfollowUser(user.id)
      if (res.status == 200) {
        setIsFollowing(false)
        message.success('Unfollowed')
      }
    } catch {
      message.error('Error. Try again!')
    }
  }

  const handleCreatePostSuccess = async (newPost?: PostData) => {
    setIsOpenCreatePost(false)
    onPostCreated(newPost)
  }

  const getTabButtonClass = (tabName: TabType) => {
    const baseClass =
      'px-4 py-4 font-bold text-sm transition-all duration-200 relative border-none bg-transparent cursor-pointer flex items-center'
    return activeTab === tabName
      ? `${baseClass} text-blue-600 after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[3px] after:bg-blue-600`
      : `${baseClass} text-gray-500 hover:bg-gray-100 hover:rounded-lg`
  }

  const renderTabContent = () => {
    const renderUserGrid = (list: any[], emptyMessage: string, actionType?: 'following' | 'friends') => {
      if (list.length === 0) return <Empty description={emptyMessage} className='py-10' />

      return (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {list.map((u, i) => (
            <div
              key={u.id || i}
              className='flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all'
            >
              <div className='flex items-center gap-3 overflow-hidden'>
                <Avatar
                  size={54}
                  src={u.avatarUrl || DEFAULT_AVATAR_URL}
                  className='flex-shrink-0 border border-gray-100'
                />
                <div className='overflow-hidden'>
                  <p
                    className='font-bold text-gray-900 hover:cursor-pointer hover:underline truncate m-0 text-[15px]'
                    onClick={() => navigate(`/profile/${u.userName}`)}
                  >
                    {`${u.lastName} ${u.firstName}`}
                  </p>
                  <p className='text-sm text-gray-500 truncate m-0'>{`@${u.userName}`}</p>
                </div>
              </div>

              {isMe && actionType === 'following' && (
                <Button
                  ghost
                  type='primary'
                  className='rounded-lg font-semibold ml-2'
                  onClick={() => {
                    setCurrentAction('unfollow')
                    setSelectedFriend(u)
                    setIsOpenRelationModal(true)
                  }}
                >
                  Following
                </Button>
              )}

              {isMe && actionType === 'friends' && (
                <Button
                  danger
                  className='rounded-lg font-semibold ml-2'
                  onClick={() => {
                    setCurrentAction('unfriend')
                    setSelectedFriend(u)
                    setIsOpenRelationModal(true)
                  }}
                >
                  Remove
                </Button>
              )}
            </div>
          ))}
        </div>
      )
    }

    switch (activeTab) {
      case 'posts':
        return (
          <div className='space-y-4'>
            {isMe && (
              <div className='bg-white rounded-xl p-4 shadow-sm border border-gray-200'>
                <div onClick={() => setIsOpenCreatePost(true)} className='flex items-center gap-3 cursor-pointer'>
                  <Avatar size={40} src={user?.avatarUrl || DEFAULT_AVATAR_URL} className='border-2 border-gray-200' />
                  <div className='flex-1 bg-[#F0F2F5] hover:bg-[#E4E6EB] rounded-full px-4 py-2 text-[#65676B] transition-colors'>
                    What's on your mind?
                  </div>
                </div>
              </div>
            )}
            {posts.length > 0 && userInfo ? (
              <div className='space-y-4'>
                {posts.map((post, index) => {
                  // Kiểm tra post có tồn tại và có đầy đủ dữ liệu cần thiết
                  if (!post || !post.id || !post.user) {
                    console.warn('Post thiếu dữ liệu hoặc undefined:', { post, index })
                    return null
                  }
                  return (
                    <div key={post.id}>
                      <Post
                        {...post}
                        postReactionUsers={post.postReactionUsers || []}
                        currentUser={user as UserDto}
                        currentUserId={user?.id || ''}
                        onPostUpdated={onPostUpdated}
                        onPostDeleted={onPostDeleted}
                        onSeen={() => {}}
                      />
                    </div>
                  )
                })}
              </div>
            ) : (
              <Empty description='No posts yet' className='py-10' />
            )}
          </div>
        )

      case 'followers':
        return renderUserGrid(followerList, 'No followers yet')

      case 'following':
        return renderUserGrid(followingList, 'Not following anyone yet', 'following')

      case 'friends':
        return renderUserGrid(friendList, 'No friends yet', 'friends')

      default:
        return null
    }
  }

  const stats = [
    { label: 'Posts', value: posts?.length, active: 'posts' },
    { label: 'Followers', value: followerList?.length, active: 'followers' },
    { label: 'Following', value: followingList?.length, active: 'following' },
    { label: 'Friends', value: friendList?.length, active: 'friends' }
  ]

  const friendButtonConfig = {
    default: {
      text: 'Add friend',
      icon: <UserAddOutlined className='text-blue-500 hover:text-blue-600' />
    },
    sendRequest: {
      text: 'Cancel request',
      icon: <CloseOutlined className='text-gray-500 hover:text-gray-600' />
    },
    friend: {
      text: 'Friend',
      icon: <FontAwesomeIcon className='text-base text-white' icon={faUserFriends} />
    },
    receiveRequest: {
      text: 'Respond to request',
      icon: <UserAddOutlined className='text-green-500 hover:text-green-600' />
    }
  }

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
      const fileName = `avatar_${Date.now()}.png`
      const newAvatar = base64ToFile(croppedImg, fileName)
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
        currentUser={userInfo}
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
      <ActionConfirmModal
        open={isOpenRelationModal}
        friend={selectedFriend || userInfo}
        type={currentAction}
        onCancel={() => setIsOpenRelationModal(false)}
        loading={loadingRequestFriend}
        onConfirm={async () => {
          if (currentAction === 'unfriend') {
            await handleUnFriend(selectedFriend ?? userInfo)
          } else {
            await handleUnFollow(selectedFriend ?? userInfo)
          }
          await refreshData()
        }}
      />

      <div className='max-w-5xl mx-auto p-4 md:p-6'>
        <div className='rounded-xl p-6 md:p-8 shadow-sm border border-gray-200 mb-8 bg-white'>
          <Row gutter={[32, 24]} align='middle'>
            <Col>
              <Image
                src={previewImage || DEFAULT_AVATAR_URL}
                className='rounded-full object-cover border'
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

          {!isMe && (
            <div className='mt-6 pt-6 border-t border-blue-200'>
              <Row gutter={[12, 12]}>
                {/* Friend */}
                <Col xs={24} sm={isFriend ? 12 : 8}>
                  <Button block size='large' icon={friendButtonConfig[relation].icon} onClick={handleFriend}>
                    {friendButtonConfig[relation].text}
                  </Button>
                </Col>

                {/* Follow – chỉ hiện khi CHƯA là bạn */}
                {!isFriend && (
                  <Col xs={24} sm={8}>
                    <Button
                      block
                      size='large'
                      icon={
                        isFollowing ? (
                          <HeartFilled className='text-red-600' />
                        ) : (
                          <HeartOutlined className='text-red-500' />
                        )
                      }
                      onClick={isFollowing ? () => handleUnFollow(selectedFriend || userInfo) : () => handleFollow()}
                    >
                      {isFollowing ? 'Unfollow' : 'Follow'}
                    </Button>
                  </Col>
                )}

                {/* Message */}
                <Col xs={24} sm={isFriend ? 12 : 8}>
                  <Button
                    block
                    size='large'
                    icon={<SendOutlined className='text-green-500' />}
                    onClick={() => handleContactClick(userInfo.id)}
                  >
                    Send message
                  </Button>
                </Col>
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
