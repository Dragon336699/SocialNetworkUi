import { useState, useRef, useEffect, ChangeEvent } from 'react'
import { Modal, Button, Input, Avatar, Flex, Typography, Divider, message } from 'antd'
import { PictureOutlined, CloseOutlined, SmileOutlined } from '@ant-design/icons'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { TextAreaRef } from 'antd/es/input/TextArea'
import { ModalProps } from '@/app/types/Common'
import { postService } from '@/app/services/post.service'

import { ResponseHasData } from '@/app/types/Base/Responses/ResponseHasData'
import useDevice from '@/app/hook/useDeivce'

const { TextArea } = Input
const { Text } = Typography

const CreatePostModal = ({ isModalOpen, handleCancel, onCreatePostSuccess, groupId, currentUser }: ModalProps) => {
  const { isMobile, isTablet } = useDevice()
  const [privacy, setPrivacy] = useState<'Public' | 'Friends' | 'Private'>('Public')
  const [text, setText] = useState('')
  const [images, setImages] = useState<File[]>([])

  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [isRewriting, setIsRewriting] = useState<boolean>(false)

  const textAreaRef = useRef<TextAreaRef>(null)
  const emojiWrapperRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fullName = `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() || ''

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

  const rewriteCaption = async () => {
    setIsRewriting(true)
    try {
      const response = await postService.rewriteCaption(text)
      if (response.status === 200) {
        const data = response.data as ResponseHasData<string>
        const newText = data.data
        setText('')
        let index = 0
        const interval = setInterval(() => {
          setText((prev) => prev + newText[index])
          index++
          if (index >= newText.length) {
            clearInterval(interval)
          }
        }, 5)
      }
    } catch (err) {
      console.log(err)
    } finally {
      setIsRewriting(false)
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
    setImages((prev) => [...prev, ...filesArray])
    e.target.value = ''
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handlePost = async () => {
    if (!text) {
      message.warning('Please enter content!')
      return
    }
    const formData = new FormData()
    formData.append('Content', text)
    formData.append('PostPrivacy', privacy)

    images.forEach((file) => {
      formData.append('Images', file)
    })
    if (groupId) {
      formData.append('GroupId', groupId)
    }

    setLoading(true)
    try {
      const res = await postService.createPost(formData)

      if (res?.message && res?.data) {
        message.success('Post created successfully!')
        handleCancel()
        onCreatePostSuccess?.(res.data)
        resetValue()
      } else {
        message.error('Failed to create post, please try again!')
      }
    } catch (err) {
      console.error(err)
      message.error('An error occurred, please try again!')
    } finally {
      setLoading(false)
    }
  }

  const resetValue = () => {
    setText('')
    setImages([])
    setPrivacy('Public')
  }

  return (
    <Modal
      open={isModalOpen}
      onCancel={() => {
        handleCancel()
        resetValue()
      }}
      footer={null}
      width={700}
      closable={false}
      centered={false}
      maskClosable={false}
      className='create-post-modal'
      style={{
        borderRadius: '8px',
        overflow: 'visible',
        padding: 0,
        top: 50
      }}
      styles={{
        content: {
          padding: 0,
          border: '1px solid #E5E7EB',
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
          style={{ borderBottom: '1px solid #E5E7EB', paddingBottom: '12px', marginBottom: '16px' }}
        >
          <Flex align='center' gap='small'>
            <div style={{ border: '2px solid #E5E7EB', borderRadius: '50%', padding: 0, display: 'inline-flex' }}>
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
            {!isMobile && (
              <Button onClick={rewriteCaption} disabled={!text || isRewriting} loading={isRewriting}>
                Rewrite caption
              </Button>
            )}
            <Button
              className='flex items-center gap-1 px-2 border border-gray-300 bg-gray-100 hover:bg-gray-200 rounded'
              onClick={handlePrivacyClick}
            >
              {renderPrivacyIcon()}
            </Button>
            <Button
              icon={<CloseOutlined />}
              onClick={() => {
                handleCancel()
                resetValue()
              }}
              className='border border-gray-300 bg-gray-100 hover:bg-gray-200 rounded'
            />
          </Flex>
        </Flex>
      }
    >
      <TextArea
        ref={textAreaRef}
        placeholder='Tell us about your thoughts?'
        autoSize={{ minRows: 3, maxRows: 6 }}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className='font-medium text-base mb-4 border-none shadow-none'
        style={{ fontWeight: 500 }}
      />

      <Divider className='my-3 border-gray-200' />

      <div
        className='grid gap-2 pb-5'
        style={{
          gridTemplateColumns: images.length === 1 ? '1fr' : images.length === 2 ? '1fr 1fr' : 'repeat(3, 1fr)'
        }}
      >
        {images.slice(0, 6).map((file, index) => (
          <div
            key={index}
            className='relative rounded-lg overflow-hidden'
            style={{
              paddingBottom: images.length === 1 ? '0' : images.length === 2 ? '100%' : '75%'
            }}
          >
            <img
              src={URL.createObjectURL(file)}
              alt={`preview-${index}`}
              className='w-full object-cover rounded-lg'
              style={
                images.length === 1
                  ? { height: 'auto' }
                  : { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }
              }
            />
            <button
              onClick={() => removeImage(index)}
              className='absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold hover:bg-opacity-70 transition-all z-10'
            >
              ×
            </button>
            {images.length > 6 && index === 5 && (
              <div className='absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center text-white text-xl font-bold rounded-lg cursor-pointer'>
                +{images.length - 6}
              </div>
            )}
          </div>
        ))}
      </div>

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
          onClick={handlePost}
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
    </Modal>
  )
}

export default CreatePostModal
