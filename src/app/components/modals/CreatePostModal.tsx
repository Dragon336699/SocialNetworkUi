import { useState, useRef, useEffect, ChangeEvent } from 'react'
import { Modal, Button, Input, Avatar, Flex, Typography, Divider } from 'antd'
import {
  BoldOutlined,
  ItalicOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  PictureOutlined,
  PaperClipOutlined,
  PlusOutlined,
  CloseOutlined,
  SmileOutlined,
  GlobalOutlined,
  UsergroupAddOutlined,
  LockOutlined
} from '@ant-design/icons'
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react'
import { TextAreaRef } from 'antd/es/input/TextArea'
import { ModalProps } from '@/app/types/Common'

const { TextArea } = Input
const { Text } = Typography

const CreatePostModal = ({ isModalOpen, handleCancel }: ModalProps) => {
  const [privacy, setPrivacy] = useState<'Public' | 'Friends' | 'Private'>('Public')
  const [text, setText] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const textAreaRef = useRef<TextAreaRef>(null)
  const emojiWrapperRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getPrivacyIcon = () => {
    switch (privacy) {
      case 'Public':
        return <GlobalOutlined className='text-blue-500' />
      case 'Friends':
        return <UsergroupAddOutlined className='text-green-500' />
      case 'Private':
        return <LockOutlined className='text-red-500' />
    }
  }

  const handlePrivacyClick = () => {
    if (privacy === 'Public') setPrivacy('Friends')
    else if (privacy === 'Friends') setPrivacy('Private')
    else setPrivacy('Public')
  }

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    const emoji = emojiData.emoji
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
    setShowEmojiPicker(false)
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

  const handlePost = () => {
    console.log('Text:', text)
    console.log('Images:', images)
    setText('')
    setImages([])
  }

  return (
    <Modal
      open={isModalOpen}
      onCancel={handleCancel}
      footer={null}
      width={700}
      closable={false}
      title={
        <Flex justify='space-between'>
          <Flex align='center' gap='small'>
            <Avatar size='large' src='https://api.dicebear.com/7.x/miniavs/svg?seed=1' />
            <Flex vertical>
              <Text strong>Seponest</Text>
            </Flex>
          </Flex>
          <Flex gap='small' align='flex-start'>
            <Button className='flex items-center gap-1 text-s !px-2 hover:bg-neutral-200' onClick={handlePrivacyClick}>
              {getPrivacyIcon()}
            </Button>
            <Button icon={<CloseOutlined />} onClick={handleCancel} />
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
        style={{ marginBottom: '8px' }}
      />

      <Flex gap='small' style={{ marginBottom: '16px' }}>
        <Button icon={<BoldOutlined />} />
        <Button icon={<ItalicOutlined />} />
        <div ref={emojiWrapperRef} className='relative inline-block'>
          <Button icon={<SmileOutlined />} onClick={() => setShowEmojiPicker((prev) => !prev)} />
          {showEmojiPicker && (
            <div className='absolute top-full left-0 z-20 w-[300px] max-h-[350px] overflow-y-auto overflow-x-hidden shadow-md bg-white'>
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                previewConfig={{ showPreview: false }}
                width={300}
                height={350}
              />
            </div>
          )}
        </div>

        <Button icon={<UnorderedListOutlined />} />
        <Button icon={<OrderedListOutlined />} />
      </Flex>

      <Divider />

      <div className='grid gap-2 pb-5' style={{ gridTemplateColumns: images.length === 1 ? '1fr' : '1fr 1fr' }}>
        {images.slice(0, 4).map((file, index) => (
          <div key={index} className='relative rounded-lg overflow-hidden'>
            <img src={URL.createObjectURL(file)} alt={`preview-${index}`} className='w-full h-auto object-contain' />
            <button
              onClick={() => removeImage(index)}
              className='absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold'
            >
              ×
            </button>
            {images.length > 4 && index === 3 && (
              <div className='absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center text-white text-xl font-bold rounded-lg cursor-pointer'>
                +{images.length - 4}
              </div>
            )}
          </div>
        ))}
      </div>

      <Flex justify='space-between' align='center'>
        <Flex gap='small'>
          <Button icon={<PictureOutlined />} onClick={() => fileInputRef.current?.click()}>
            Picture/video
          </Button>
          <input
            type='file'
            accept='image/*'
            multiple
            className='hidden'
            ref={fileInputRef}
            onChange={handleImageChange}
          />

          <Button icon={<PaperClipOutlined />}>Attachment</Button>
        </Flex>

        <Button type='primary' icon={<PlusOutlined />} onClick={handlePost}>
          Post
        </Button>
      </Flex>
    </Modal>
  )
}

export default CreatePostModal
