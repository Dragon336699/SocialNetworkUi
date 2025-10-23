import { useState } from 'react'
import {
  PictureOutlined,
  SmileOutlined,
  VideoCameraOutlined,
  CloseOutlined,
  GlobalOutlined,
  LockOutlined,
  UsergroupAddOutlined,
  DownOutlined
} from '@ant-design/icons'
import { Button, Input, Dropdown, Avatar, MenuProps } from 'antd'

const { TextArea } = Input

const CreatePost = () => {
  const [expanded, setExpanded] = useState(false)
  const [content, setContent] = useState('')
  const [image, setImage] = useState<string | null>(null)
  const [privacy, setPrivacy] = useState<'Public' | 'Friends' | 'Private'>('Public')

  const handlePost = () => {
    if (!content.trim() && !image) return
    resetField()
    console.log('PostData', { content, image, privacy })
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setImage(URL.createObjectURL(file))
  }

  const getPrivacyIcon = () => {
    switch (privacy) {
      case 'Public':
        return <GlobalOutlined className='text-blue-500' />
      case 'Friends':
        return <UsergroupAddOutlined className='text-green-500' />
      case 'Private':
        return <LockOutlined className='text-red-500' />
      default:
        return null
    }
  }

  const resetField = () => {
    setContent('')
    setImage(null)
    setExpanded(false)
    setPrivacy('Public')
  }

  const privacyItems: MenuProps['items'] = [
    { key: 'public', label: 'Public', icon: <GlobalOutlined className='text-blue-500' /> },
    { key: 'friends', label: 'Friends', icon: <UsergroupAddOutlined className='text-green-500' /> },
    { key: 'private', label: 'Only Me', icon: <LockOutlined className='text-red-500' /> }
  ]

  const handlePrivacyClick: MenuProps['onClick'] = (info) => {
    if (info.key === 'public') setPrivacy('Public')
    else if (info.key === 'friends') setPrivacy('Friends')
    else if (info.key === 'private') setPrivacy('Private')
  }

  return (
    <div className='bg-[rgba(228,203,203,0.91)] rounded-2xl p-4 m-4 shadow-sm w-full max-w-xl'>
      {!expanded && (
        <div onClick={() => setExpanded(true)} className='flex items-center gap-3 cursor-pointer'>
          <Avatar src='' />
          <div className='flex-1 bg-neutral-100 rounded-full px-4 py-2 text-neutral-600 hover:bg-neutral-200 transition'>
            What's on your mind?
          </div>
        </div>
      )}

      {expanded && (
        <div className='space-y-3 animate-fade-in'>
          <div className='flex items-start gap-3'>
            <Avatar src='' size={'large'} />

            <div className='flex flex-col flex-1'>
              <div className='flex justify-between items-center'>
                <p className='font-medium text-neutral-800'>User Name</p>
                <CloseOutlined
                  onClick={() => {
                    setExpanded(false)
                    resetField()
                  }}
                  className='text-neutral-500 hover:text-neutral-700 cursor-pointer'
                />
              </div>

              <div className='mt-1'>
                <Dropdown menu={{ items: privacyItems, onClick: handlePrivacyClick }} trigger={['click']}>
                  <Button className='flex items-center gap-1 text-sm bg-neutral-100 hover:bg-neutral-200'>
                    {getPrivacyIcon()}
                    {privacy}
                    <DownOutlined className='text-xs' />
                  </Button>
                </Dropdown>
              </div>
            </div>
          </div>

          <TextArea
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            autoSize={{ minRows: 3 }}
          />

          {image && (
            <div className='relative'>
              <img src={image} alt='preview' className='rounded-xl max-h-96 object-cover w-full' />
              <Button
                type='text'
                icon={<CloseOutlined />}
                onClick={() => setImage(null)}
                className='absolute top-2 right-2 text-red-500'
              />
            </div>
          )}

          <div className='flex justify-between items-center border-t pt-3 text-sm text-neutral-700'>
            <label className='flex items-center gap-2 cursor-pointer hover:text-green-600'>
              <PictureOutlined className='text-green-500' />
              Photo
              <input type='file' accept='image/*' onChange={handleImageUpload} className='hidden' />
            </label>

            <div className='flex items-center gap-2 cursor-pointer hover:text-blue-500'>
              <SmileOutlined className='text-blue-500' /> Feeling
            </div>

            <div className='flex items-center gap-2 cursor-pointer hover:text-red-500'>
              <VideoCameraOutlined className='text-red-500' /> Video
            </div>
          </div>

          <Button type='primary' block onClick={handlePost} className='font-medium rounded-xl'>
            Post
          </Button>
        </div>
      )}
    </div>
  )
}

export default CreatePost
