import { useState, useRef, useEffect, ChangeEvent } from 'react'
import { Modal, Button, Input, Avatar, Flex, Typography, Divider, message } from 'antd'
import {
  PictureOutlined,
  CloseOutlined,
  SmileOutlined
} from '@ant-design/icons'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { TextAreaRef } from 'antd/es/input/TextArea'
import { postService } from '@/app/services/post.service'
import { PostData, PostImage } from '@/app/types/Post/Post'
import { UserDto } from '@/app/types/User/user.dto'

const { TextArea } = Input
const { Text } = Typography

interface EditPostModalProps {
  isOpen: boolean
  onClose: () => void
  postId: string
  onSave: (updatedPost: PostData) => void
  currentUser: UserDto
}

const EditPostModal: React.FC<EditPostModalProps> = ({ isOpen, onClose, postId, onSave, currentUser }) => {
  const [privacy, setPrivacy] = useState<'Public' | 'Friends' | 'Private'>('Public')
  const [text, setText] = useState('')
  const [originalImages, setOriginalImages] = useState<PostImage[]>([])
  const [existingImages, setExistingImages] = useState<PostImage[]>([])
  const [newImages, setNewImages] = useState<File[]>([])
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [fetchingPost, setFetchingPost] = useState<boolean>(false)

  const textAreaRef = useRef<TextAreaRef>(null)
  const emojiWrapperRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fullName = `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() || ''

  useEffect(() => {
    if (isOpen && postId) {
      fetchPostData()
    }
  }, [isOpen, postId])

  const fetchPostData = async () => {
    setFetchingPost(true)
    try {
      const response = await postService.getPostById(postId)
      const post = response.post
      setText(post.content || '')
      setPrivacy(post.postPrivacy || 'Public')

      const images = post.postImages || []
      setOriginalImages(images)
      setExistingImages(images)
    } catch (error) {
      console.error('Error fetching post:', error)
      message.error('Unable to load post data!')
    } finally {
      setFetchingPost(false)
    }
  }

  const renderPrivacyIcon = () => {
    const iconClass = 'w-4 h-4 text-gray-500'

    switch (privacy) {
      case 'Public':
        return (
          <svg className={iconClass} fill='currentColor' viewBox='0 0 20 20'>
            <path
              fillRule='evenodd'
              d='M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0710 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z'
              clipRule='evenodd'
            />
          </svg>
        )
      case 'Friends':
        return (
          <svg className={iconClass} fill='currentColor' viewBox='0 0 20 20'>
            <path d='M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z' />
          </svg>
        )
      case 'Private':
        return (
          <svg className={iconClass} fill='currentColor' viewBox='0 0 20 20'>
            <path
              fillRule='evenodd'
              d='M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z'
              clipRule='evenodd'
            />
          </svg>
        )
      default:
        return null
    }
  }

  const handlePrivacyClick = () => {
    if (privacy === 'Public') setPrivacy('Friends')
    else if (privacy === 'Friends') setPrivacy('Private')
    else setPrivacy('Public')
  }

  const handleEmojiSelect = (emojiData: any) => {
    const emoji = emojiData.native
    const textarea = textAreaRef.current?.resizableTextArea?.textArea
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newText = text.slice(0, start) + emoji + text.slice(end)
    setText(newText)

    requestAnimationFrame(() => {
      textarea.focus()
      textarea.selectionStart = textarea.selectionEnd = start + emoji.length
    })
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiWrapperRef.current && !emojiWrapperRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false)
      }
    }
    if (showEmojiPicker) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showEmojiPicker])

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const filesArray = Array.from(e.target.files)
    setNewImages((prev) => [...prev, ...filesArray])
    e.target.value = ''
  }

  const removeExistingImage = (imageId: string) => {
    setExistingImages((prev) => prev.filter((img) => img.id !== imageId))
  }

  const removeNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (!text.trim()) {
      message.warning('Please enter the post content!')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('Content', text)
      formData.append('PostPrivacy', privacy)

      const hasNoImages = existingImages.length === 0 && newImages.length === 0
      const hadOriginalImages = originalImages.length > 0

      if (hasNoImages && hadOriginalImages) {
        formData.append('RemoveAllImages', 'true')
      } else {
        formData.append('RemoveAllImages', 'false')

        const deletedImageIds = originalImages
          .filter((originalImg) => !existingImages.find((existingImg) => existingImg.id === originalImg.id))
          .map((img) => img.id)

        deletedImageIds.forEach((imageId) => {
          formData.append('ImageIdsToDelete', imageId)
        })
        newImages.forEach((file) => {
          formData.append('NewImages', file)
        })
      }

      const response = await postService.updatePost(postId, formData)

      message.success('Post updated successfully!')
      onSave(response.post)
      onClose()
      resetValue()
    } catch (error) {
      console.error('Error updating post:', error)
      message.error('An error occurred, please try again!')
    } finally {
      setLoading(false)
    }
  }

  const resetValue = () => {
    setText('')
    setExistingImages([])
    setNewImages([])
    setPrivacy('Public')
  }

  const allImages = [
    ...existingImages.map((img, index) => ({
      type: 'existing' as const,
      data: img,
      index
    })),
    ...newImages.map((file, index) => ({
      type: 'new' as const,
      data: file,
      index
    }))
  ]

  return (
    <Modal
      open={isOpen}
      onCancel={() => {
        onClose()
        resetValue()
      }}
      footer={null}
      width={700}
      closable={false}
      centered={false}
      maskClosable={false}
      style={{
        borderRadius: '8px',
        overflow: 'visible',
        padding: 0,
        top: 50
      }}
      styles={{
        content: {
          padding: 0,
          border: '1px solid #000000',
          borderRadius: '8px',
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
          overflow: 'visible'
        },
        body: {
          padding: '0 24px 24px 24px',
          overflow: 'visible'
        },
        header: {
          padding: '16px 24px 0 24px',
          marginBottom: 0
        }
      }}
      title={
        <Flex
          justify='space-between'
          style={{ borderBottom: '1px solid #000000', paddingBottom: '12px', marginBottom: '16px' }}
        >
          <Flex align='center' gap='small'>
            <div style={{ border: '2px solid #000000', borderRadius: '50%', padding: 0, display: 'inline-flex' }}>
              <Avatar size={40} src={currentUser?.avatarUrl} style={{ minWidth: 40, minHeight: 40 }}>
                {currentUser?.firstName?.[0] || currentUser?.lastName?.[0] || ''}
              </Avatar>
            </div>
            <Flex vertical>
              <Text strong style={{ fontSize: '15px', fontWeight: 600 }}>
                {fullName}
              </Text>
            </Flex>
          </Flex>
          <Flex gap='small' align='flex-start'>
            <Button
              className='flex items-center gap-1 px-2 border border-gray-300 bg-gray-100 hover:bg-gray-200 rounded'
              onClick={handlePrivacyClick}
            >
              {renderPrivacyIcon()}
            </Button>
            <Button
              icon={<CloseOutlined />}
              onClick={() => {
                onClose()
                resetValue()
              }}
              className='border border-gray-300 bg-gray-100 hover:bg-gray-200 rounded'
            />
          </Flex>
        </Flex>
      }
    >
      {fetchingPost ? (
        <div className='text-center py-8'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto'></div>
          <p className='mt-2 text-gray-600'>Loading data...</p>
        </div>
      ) : (
        <>
          <TextArea
            ref={textAreaRef}
            placeholder='Tell us about your thoughts?'
            autoSize={{ minRows: 3, maxRows: 6 }}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className='font-medium text-base mb-4 border-none shadow-none'
            style={{ fontWeight: 500 }}
          />

          <Divider className='my-3 border-black' />

          {allImages.length > 0 && (
            <div
              className='grid gap-2 pb-5'
              style={{
                gridTemplateColumns:
                  allImages.length === 1 ? '1fr' : allImages.length === 2 ? '1fr 1fr' : 'repeat(3, 1fr)'
              }}
            >
              {allImages.slice(0, 6).map((item, displayIndex) => (
                <div
                  key={`${item.type}-${item.index}`}
                  className='relative rounded-lg overflow-hidden'
                  style={{
                    paddingBottom: allImages.length === 1 ? '0' : allImages.length === 2 ? '100%' : '75%'
                  }}
                >
                  <img
                    src={item.type === 'existing' ? item.data.imageUrl : URL.createObjectURL(item.data)}
                    alt={`preview-${displayIndex}`}
                    className='w-full object-cover rounded-lg'
                    style={
                      allImages.length === 1
                        ? { height: 'auto' }
                        : { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }
                    }
                  />
                  <button
                    onClick={() => {
                      if (item.type === 'existing') {
                        removeExistingImage(item.data.id)
                      } else {
                        removeNewImage(item.index)
                      }
                    }}
                    className='absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold hover:bg-opacity-70 transition-all z-10'
                  >
                    ×
                  </button>
                  {allImages.length > 6 && displayIndex === 5 && (
                    <div className='absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center text-white text-xl font-bold rounded-lg cursor-pointer'>
                      +{allImages.length - 6}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <Flex justify='space-between' align='center'>
            <Flex gap='small' align='center'>
              <button
                onClick={() => fileInputRef.current?.click()}
                className='rounded-full border border-gray-300 bg-gray-100 hover:bg-gray-200 transition-colors h-10 flex items-center px-3 gap-2 font-semibold text-sm cursor-pointer'
              >
                <PictureOutlined />
                <span>Picture</span>
              </button>

              <input
                type='file'
                accept='image/*'
                multiple
                className='hidden'
                ref={fileInputRef}
                onChange={handleImageChange}
              />

              <div ref={emojiWrapperRef} className='relative inline-block'>
                <button
                  onClick={() => setShowEmojiPicker((prev) => !prev)}
                  className='rounded-full border border-gray-300 bg-gray-100 hover:bg-gray-200 transition-colors h-10 w-10 flex items-center justify-center cursor-pointer'
                >
                  <SmileOutlined />
                </button>
                {showEmojiPicker && (
                  <div className='absolute bottom-full left-0 mb-2 z-[9999] h-96 overflow-hidden shadow-lg bg-white rounded-lg'>
                    <Picker
                      data={data}
                      onEmojiSelect={handleEmojiSelect}
                      previewPosition='none'
                      theme='light'
                      navPosition='top'
                      perLine={8}
                      emojiSize={22}
                    />
                  </div>
                )}
              </div>
            </Flex>

            <button
              onClick={handleSave}
              disabled={loading || !text}
              className={`
                rounded-full w-10 h-10 flex items-center justify-center transition-colors
                ${loading || !text ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 cursor-pointer'}
              `}
            >
              {loading ? (
                <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
              ) : (
                <svg className='w-5 h-5 text-white' fill='currentColor' viewBox='0 0 24 24'>
                  <path d='M2.01 21L23 12 2.01 3 2 10l15 2-15 2z' />
                </svg>
              )}
            </button>
          </Flex>
        </>
      )}
    </Modal>
  )
}

export default EditPostModal