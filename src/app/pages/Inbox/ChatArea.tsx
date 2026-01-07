import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar, ConfigProvider, Divider, Input, List, Skeleton, Tooltip, Image, message, Dropdown, Modal } from 'antd'
import { PhoneOutlined, SearchOutlined, SendOutlined, PlusOutlined, CloseOutlined, ArrowDownOutlined } from '@ant-design/icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCheck,
  faCheckDouble,
  faCircleStop,
  faEllipsisVertical,
  faEye,
  faFaceSmile,
  faImage,
  faMicrophone,
  faPaperclip,
  faPause,
  faPlay,
  faPlus,
  faReply,
  faXmark,
  faTrash,
  faEdit,
  faSignature
} from '@fortawesome/free-solid-svg-icons'
import RecordRTC, { StereoAudioRecorder } from 'recordrtc'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import WaveSurfer from 'wavesurfer.js'
import { UserDto } from '@/app/types/User/user.dto'
import { MessageDto } from '@/app/types/Message/messge.dto'
import { ConversationDto } from '@/app/types/Conversation/conversation.dto'
import { ConversationUserDto } from '@/app/types/ConversationUser/conversationUser.dto'
import { conversationService } from '@/app/services/conversation.service'
import VoiceWave from '@/app/common/VoiceWave/VoiceWave'

interface ChatAreaProps {
  conversation: ConversationDto | null
  conversationUsers: ConversationUserDto[]
  conversationId?: string
  userInfo: UserDto | null
  receivers: UserDto[]
  messages: MessageDto[]
  text: string
  setText: (text: string) => void
  repliedMessagePreview: MessageDto | null
  setRepliedMessagePreview: (msg: MessageDto | null) => void
  imageFiles: File[]
  setImageFiles: (files: File[]) => void
  imagesPreview: string[]
  setImagesPreview: (urls: string[]) => void
  audioUrl: string | null
  setAudioUrl: (url: string | null) => void
  audioBlob: Blob | null
  setAudioBlob: (blob: Blob | null) => void
  isRecording: boolean
  setIsRecording: (recording: boolean) => void
  isChatFocused: boolean
  setIsChatFocused: (focused: boolean) => void
  isInputFocused: boolean
  setIsInputFocused: (focused: boolean) => void
  firstMessageRef: React.RefObject<HTMLDivElement>
  newestMessageRef: React.RefObject<HTMLDivElement>
  messageEndRef: React.RefObject<HTMLDivElement>
  recorderRef: React.MutableRefObject<RecordRTC | null>
  streamRef: React.MutableRefObject<MediaStream | null>
  hasMore: boolean
  isLoadingMore: boolean
  loadMoreMessage: () => void
  handleSendMessage: () => void
  handleSendReaction: (messageId: string, reaction: string) => Promise<void>
  onConversationDeleted?: () => void
  onNicknameChanged?: (userId: string, newNickname: string) => void
  onGroupNameChanged?: (newName: string) => void
}

const ChatArea: React.FC<ChatAreaProps> = ({
  conversation,
  conversationUsers,
  conversationId,
  userInfo,
  receivers,
  messages,
  text,
  setText,
  repliedMessagePreview,
  setRepliedMessagePreview,
  imageFiles,
  setImageFiles,
  imagesPreview,
  setImagesPreview,
  audioUrl,
  setAudioUrl,
  audioBlob,
  setAudioBlob,
  isRecording,
  setIsRecording,
  isInputFocused,
  setIsInputFocused,
  firstMessageRef,
  newestMessageRef,
  messageEndRef,
  recorderRef,
  streamRef,
  hasMore,
  isLoadingMore,
  loadMoreMessage,
  handleSendMessage,
  handleSendReaction,
  onConversationDeleted,
  onNicknameChanged,
  onGroupNameChanged
}) => {
  // States
  const waveformRef = useRef(null)
  const wavesurferRef = useRef<WaveSurfer | null>(null)
  const [previewVoicePlaying, setPreviewVoicePlaying] = useState(false)
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)
  const reactions = ['👍', '❤️', '😂', '😮', '😢']
  const reactionBarRef = useRef<HTMLDivElement>(null)
  const pickerEmotionRef = useRef<HTMLDivElement>(null)
  const emojiPickerRef = useRef<HTMLDivElement>(null)
  const attachMenuRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const attachFileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [messageReactionBar, setMessageReactionBar] = useState<string | null>(null)
  const [fullyReactionSelection, setfullyReactionSelection] = useState<string | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showAttachMenu, setShowAttachMenu] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const navigate = useNavigate()

  // Modal states
  const [isNicknameModalVisible, setIsNicknameModalVisible] = useState(false)
  const [isGroupNameModalVisible, setIsGroupNameModalVisible] = useState(false)
  const [newNickname, setNewNickname] = useState('')
  const [newGroupName, setNewGroupName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAvatarClick = (userName: string) => {
    navigate(`/profile/${userName}`)
  }

  const handleDeleteConversation = () => {
    Modal.confirm({
      title: 'Delete Conversation',
      content: 'Are you sure you want to delete this conversation? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          if (!conversationId) return
          const { status } = await conversationService.deleteConversation(conversationId)
          if (status === 200) {
            message.success('Conversation deleted successfully!')
            onConversationDeleted?.()
          }
        } catch (error: any) {
          message.error(error.response?.data?.message || 'Failed to delete conversation!')
        }
      }
    })
  }

  const handleChangeNickname = async () => {
    if (!newNickname.trim()) {
      message.warning('Please enter a nickname')
      return
    }
    if (!conversationId || !userInfo) return

    try {
      setLoading(true)
      const otherUser = conversationUsers.find((u) => u.userId !== userInfo.id)
      if (!otherUser) {
        message.error('Cannot find user')
        return
      }
      const { status } = await conversationService.changeNickname(conversationId, otherUser.userId, newNickname)
      if (status === 200) {
        message.success('Nickname changed successfully!')
        setIsNicknameModalVisible(false)
        onNicknameChanged?.(otherUser.userId, newNickname)
        setNewNickname('')
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to change nickname!')
    } finally {
      setLoading(false)
    }
  }

  const handleChangeGroupName = async () => {
    if (!newGroupName.trim()) {
      message.warning('Please enter a group name')
      return
    }
    if (!conversationId) return

    try {
      setLoading(true)
      const { status } = await conversationService.changeConversationName(conversationId, newGroupName)
      if (status === 200) {
        message.success('Group name changed successfully!')
        setIsGroupNameModalVisible(false)
        onGroupNameChanged?.(newGroupName)
        setNewGroupName('')
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to change group name!')
    } finally {
      setLoading(false)
    }
  }

  // Menu items
  const menuItems = [
    ...(conversation?.type === 'Personal' ? [{
      key: 'nickname',
      label: (
        <div className='flex items-center gap-2'>
          <FontAwesomeIcon icon={faEdit} />
          <span>Change Nickname</span>
        </div>
      ),
      onClick: () => {
        const otherUser = conversationUsers.find((u) => u.userId !== userInfo?.id)
        setNewNickname(otherUser?.nickName || '')
        setIsNicknameModalVisible(true)
      }
    }] : []),
    ...(conversation?.type === 'Group' ? [{
      key: 'groupname',
      label: (
        <div className='flex items-center gap-2'>
          <FontAwesomeIcon icon={faSignature} />
          <span>Change Group Name</span>
        </div>
      ),
      onClick: () => {
        setNewGroupName(conversation?.conversationName || '')
        setIsGroupNameModalVisible(true)
      }
    }] : []),
    { type: 'divider' as const },
    {
      key: 'delete',
      label: (
        <div className='flex items-center gap-2 text-red-500'>
          <FontAwesomeIcon icon={faTrash} />
          <span>Delete Conversation</span>
        </div>
      ),
      onClick: handleDeleteConversation
    }
  ]

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      recorderRef.current = new RecordRTC(stream, {
        type: 'audio',
        mimeType: 'audio/wav',
        recorderType: StereoAudioRecorder,
        desiredSampRate: 16000
      })
      recorderRef.current.startRecording()
      setIsRecording(true)
      setRecordingDuration(0)
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1)
      }, 1000)
    } catch (error) {
      message.error('Cannot access microphone')
    }
  }

  const stopRecording = () => {
    if (!recorderRef.current) return
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current)
      recordingIntervalRef.current = null
    }
    recorderRef.current.stopRecording(() => {
      const blob = recorderRef.current?.getBlob()
      if (blob) {
        setAudioUrl(URL.createObjectURL(blob))
        setAudioBlob(blob)
      }
      streamRef.current?.getTracks().forEach((track) => track.stop())
      setIsRecording(false)
      setRecordingDuration(0)
    })
  }

  const cancelRecording = () => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current)
      recordingIntervalRef.current = null
    }
    if (recorderRef.current) {
      recorderRef.current.stopRecording(() => {
        streamRef.current?.getTracks().forEach((track) => track.stop())
      })
    }
    setIsRecording(false)
    setRecordingDuration(0)
    setAudioUrl(null)
    setAudioBlob(null)
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleFileChange = (e: any) => {
    message.info('File attachment coming soon!')
  }

  const togglePreviewRecord = () => {
    wavesurferRef.current?.playPause()
  }

  const handleImagesFileChange = (e: any) => {
    const selectedFiles: File[] = Array.from(e.target.files)
    setImageFiles(selectedFiles)
    const previewUrls = selectedFiles.map((file) => URL.createObjectURL(file))
    setImagesPreview(previewUrls)
    setShowAttachMenu(false)
  }

  const removePreviewImage = (index: number) => {
    URL.revokeObjectURL(imagesPreview[index])
    setImageFiles(imageFiles.filter((_, i) => i !== index))
    setImagesPreview(imagesPreview.filter((_, i) => i !== index))
  }

  const handleEmojiSelect = (emoji: any) => {
    const textarea = textareaRef.current
    if (!textarea) {
      setText(text + emoji.native)
      return
    }
    const start = textarea.selectionStart || 0
    const end = textarea.selectionEnd || 0
    const newText = text.slice(0, start) + emoji.native + text.slice(end)
    setText(newText)
    requestAnimationFrame(() => {
      textarea.focus()
      textarea.selectionStart = textarea.selectionEnd = start + emoji.native.length
    })
  }

  const scrollToNewestMessage = () => {
    const scrollableDiv = document.getElementById('scrollableDiv')
    if (scrollableDiv) {
      scrollableDiv.scrollTo({
        top: scrollableDiv.scrollHeight,
        behavior: 'smooth'
      })
    }
  }
 
  useEffect(() => {
    const scrollableDiv = document.getElementById('scrollableDiv')
    if (!scrollableDiv) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollableDiv     
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 300
      setShowScrollToBottom(!isNearBottom)
    }

    scrollableDiv.addEventListener('scroll', handleScroll)
    return () => scrollableDiv.removeEventListener('scroll', handleScroll)
  }, [conversationId])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      const scrollHeight = textareaRef.current.scrollHeight
      textareaRef.current.style.height = Math.min(scrollHeight, 100) + 'px'
      textareaRef.current.style.overflowY = scrollHeight > 100 ? 'auto' : 'hidden'
    }
  }, [text])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (messageReactionBar && reactionBarRef.current && !reactionBarRef.current.contains(target) && !fullyReactionSelection) {
        setMessageReactionBar(null)
      }
      if (fullyReactionSelection && pickerEmotionRef.current && !pickerEmotionRef.current.contains(target)) {
        setfullyReactionSelection(null)
      }
      if (showEmojiPicker && emojiPickerRef.current && !emojiPickerRef.current.contains(target)) {
        setShowEmojiPicker(false)
      }
      if (showAttachMenu && attachMenuRef.current && !attachMenuRef.current.contains(target)) {
        setShowAttachMenu(false)
      }
    }

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMessageReactionBar(null)
        setfullyReactionSelection(null)
        setShowEmojiPicker(false)
        setShowAttachMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscapeKey)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [messageReactionBar, fullyReactionSelection, showEmojiPicker, showAttachMenu])

  useEffect(() => {
    if (!waveformRef.current || !audioUrl) return
    wavesurferRef.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: 'rgba(167, 167, 167, 1)',
      progressColor: 'rgba(89, 89, 89, 1)',
      barWidth: 3,
      barGap: 2,
      barRadius: 2,
      height: 40,
      width: 121
    })
    wavesurferRef.current.load(audioUrl || '')
    wavesurferRef.current.on('play', () => setPreviewVoicePlaying(true))
    wavesurferRef.current.on('pause', () => setPreviewVoicePlaying(false))
    return () => {
      wavesurferRef.current?.destroy()
    }
  }, [audioUrl])

  return (
    <div className='flex-1 flex flex-col justify-between h-full overflow-hidden'>
      {/* Modals */}
      <Modal
        title='Change Nickname'
        open={isNicknameModalVisible}
        onOk={handleChangeNickname}
        onCancel={() => setIsNicknameModalVisible(false)}
        confirmLoading={loading}
      >
        <Input
          placeholder='Enter new nickname'
          value={newNickname}
          onChange={(e) => setNewNickname(e.target.value)}
          onPressEnter={handleChangeNickname}
        />
      </Modal>

      <Modal
        title='Change Group Name'
        open={isGroupNameModalVisible}
        onOk={handleChangeGroupName}
        onCancel={() => setIsGroupNameModalVisible(false)}
        confirmLoading={loading}
      >
        <Input
          placeholder='Enter new group name'
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          onPressEnter={handleChangeGroupName}
        />
      </Modal>

      {/* Header */}
      <div className='flex justify-between py-4 px-[20px] border-b border-gray-100 flex-shrink-0'>
        <div className='flex items-center gap-3'>
          {conversationUsers.length !== 0 && conversation?.type === 'Personal' && (
            <div
              className='cursor-pointer hover:opacity-80 transition-opacity'
              onClick={() => {
                const otherUser = conversationUsers.find((u) => u.userId !== userInfo?.id)
                if (otherUser) handleAvatarClick(otherUser.user.userName)
              }}
            >
              <Avatar
                size={48}
                src={conversationUsers.find((u) => u.userId !== userInfo?.id)?.user.avatarUrl}
                className='border-2 border-gray-200'
              />
            </div>
          )}

          {conversationUsers.length !== 0 && conversation?.type === 'Group' && (
            <Avatar.Group
              maxCount={2}
              maxStyle={{
                backgroundColor: '#6b7280',
                width: '40px',
                height: '40px',
                lineHeight: '40px',
                border: '2px solid rgb(229, 231, 235)'
              }}
            >
              {conversationUsers.map((cu) => (
                <div
                  key={cu.userId}
                  className='cursor-pointer hover:opacity-80 transition-opacity inline-block'
                  onClick={(e) => {
                    e.stopPropagation()
                    handleAvatarClick(cu.user.userName)
                  }}
                >
                  <Avatar size={40} src={cu.user.avatarUrl} className='border-2 border-gray-200' />
                </div>
              ))}
            </Avatar.Group>
          )}

          <div className='flex flex-col'>
            {conversationUsers.length === 0 ? (
              <Skeleton active paragraph={{ rows: 0 }} />
            ) : conversation?.type === 'Personal' ? (
              <>
                <h3 className='text-base font-semibold'>
                  {conversationUsers.find((u) => u.userId !== userInfo?.id)?.nickName}
                </h3>
                <div className='text-xs text-gray-500 flex gap-1 items-center'>
                  <span
                    className={`select-none cursor-default text-xs ${receivers.find((u) => u.id !== userInfo?.id)?.status === 'Online' ? 'text-green-500' : 'text-gray-400'}`}
                  >
                    ●
                  </span>
                  <p>{receivers.find((u) => u.id !== userInfo?.id)?.status}</p>
                </div>
              </>
            ) : (
              <>
                <h3 className='text-base font-semibold'>{conversation?.conversationName}</h3>
                {(() => {
                  const onlineCount = conversationUsers.filter((cu) => cu.user.status === 'Online').length
                  return onlineCount > 0 ? (
                    <div className='text-xs text-gray-500 flex gap-1 items-center'>
                      <span className='select-none cursor-default text-xs text-green-500'>●</span>
                      <p>{onlineCount} online</p>
                    </div>
                  ) : null
                })()}
              </>
            )}
          </div>
        </div>
        {conversationId && (
          <div className='flex gap-[20px] items-center'>
            <SearchOutlined className='text-xl cursor-pointer text-gray-600 hover:text-gray-800' />
            <PhoneOutlined className='text-xl cursor-pointer text-gray-600 hover:text-gray-800' />
            <Dropdown menu={{ items: menuItems }} trigger={['click']} placement='bottomRight'>
              <FontAwesomeIcon
                icon={faEllipsisVertical}
                className='text-xl cursor-pointer text-gray-600 hover:text-gray-800'
              />
            </Dropdown>
          </div>
        )}
      </div>

      {/* Body - Messages List */}
      {conversationId && (
        <div className='relative flex-1 overflow-hidden'>
          <div 
            id='scrollableDiv' 
            className='h-full overflow-y-auto px-[20px] pb-4 flex flex-col'
          >

          {/* Loading indicator at top */}
          {isLoadingMore && (
            <div className='text-center py-3 text-gray-500'>
              <div className='inline-flex items-center gap-2'>
                <div className='w-4 h-4 border-2 border-gray-300 border-t-sky-500 rounded-full animate-spin'></div>
                <span className='text-sm'>Loading older messages...</span>
              </div>
            </div>
          )}
          {!isLoadingMore && hasMore && (
            <div className='text-center py-2 text-gray-400'>
              <span className='text-sm'>↑ Scroll up to see older messages</span>
            </div>
          )}
          {!hasMore && messages.length > 0 && (
            <Divider plain>No more messages 🤐</Divider>
          )}
          
          <List
            className='w-full'
            dataSource={messages}
            renderItem={(item, index) => {
              const isMe = item.sender?.id == userInfo?.id
              const isFirst = index === 18
              return (
                <div
                  id={`msg-${item.id}`}
                  ref={isFirst ? firstMessageRef : null}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end mb-[12px] mt-[16px]`}
                  key={item.id}
                >
                  {!isMe && (
                    <a href='#' className='mr-2'>
                      <Avatar src={item.sender?.avatarUrl} className='border-2 border-gray-200'></Avatar>
                    </a>
                  )}

                  <div className={`flex gap-1 ${item.content === '' ? '' : 'flex-col-reverse'} max-w-[70%]`}>
                    <div className='flex items-center'>
                      <div className={`flex ${isMe ? 'items-end' : 'items-start'} flex-col gap-1`}>
                        {item.repliedMessage && (
                          item.repliedMessage.content !== '' ? (
                            <p className={`${isMe ? 'bg-gray-500 bg-opacity-20' : 'bg-gray-300 bg-opacity-60'} inline-block p-[12px] rounded-[20px] break-all cursor-default text-[#0000007a]`}>
                                {item.repliedMessage.content}
                              </p>
                            ) : item.repliedMessage.messageAttachments[0]?.fileType === 'Image' ? (
                              item.repliedMessage.messageAttachments.map((img, idx) => (
                                <Image
                                  key={idx}
                                  className='rounded-[28px]'
                                  width={150}
                                  height={150}
                                  src={img.fileUrl}
                                />
                              ))
                            ) : (
                              <p
                                className={`${isMe ? 'bg-gray-500 bg-opacity-20' : 'bg-gray-300 bg-opacity-60'} inline-block p-[12px] rounded-[20px] break-all cursor-default text-[#0000007a]`}
                              >
                                Attachment
                              </p>
                            ))}
                          {(item.content !== '' || item.messageAttachments.length !== 0) && (
                            <div
                              className='flex flex-col items-end gap-2 relative'
                              ref={index === messages.length - 1 ? newestMessageRef : null}
                            >
                              <ConfigProvider
                                theme={{
                                  components: {
                                    Tooltip: {
                                      colorBgSpotlight: 'transparent',
                                      colorTextLightSolid: '#8f8f8fff',
                                      boxShadowSecondary: 'none'
                                    }
                                  }
                                }}
                              >
                                <Tooltip
                                  placement={isMe ? 'left' : 'right'}
                                  title={
                                    <div className='flex gap-2'>
                                      <FontAwesomeIcon
                                        onClick={() => {
                                          setMessageReactionBar(item.id)
                                          setfullyReactionSelection(null)
                                        }}
                                        className='cursor-pointer'
                                        icon={faFaceSmile}
                                      />
                                      <FontAwesomeIcon
                                        onClick={() => {
                                          setRepliedMessagePreview(item)
                                          setfullyReactionSelection(null)
                                        }}
                                        className='cursor-pointer'
                                        icon={faReply}
                                      />
                                    </div>
                                  }
                                >
                                  <div
                                    className={`${item.messageAttachments.length !== 0 && item.content != '' ? 'flex flex-col-reverse gap-2' : ''} relative inline-block rounded-[20px] break-all cursor-default`}
                                  >
                                    {item.content !== '' && (
                                      <p className={`${isMe ? 'bg-sky-400' : 'bg-gray-300'} p-[12px] rounded-[20px]`}>
                                        {item.content}
                                      </p>
                                    )}
                                    {item.messageAttachments.length !== 0 && (
                                      <div className='flex gap-2 flex-wrap mt-2'>
                                        {item.messageAttachments.map((att, idx) =>
                                          att.fileType === 'Image' ? (
                                            <Image
                                              key={idx}
                                              className='rounded-[28px]'
                                              width={150}
                                              height={150}
                                              src={att.fileUrl}
                                            />
                                          ) : att.fileType === 'Voice' ? (
                                            <div
                                              key={idx}
                                              className={`rounded-3xl ${isMe ? 'bg-sky-300' : 'bg-gray-300'}`}
                                            >
                                              <VoiceWave url={att.fileUrl} />
                                            </div>
                                          ) : (
                                            <p key={idx}>Error</p>
                                          )
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </Tooltip>

                                {item.messageReactionUsers.length !== 0 && (
                                  <div
                                    className={`cursor-pointer absolute ${isMe ? 'left-[0]' : 'right-[0]'} ${index === messages.length - 1 && isMe ? 'bottom-[6px]' : 'bottom-[-12px]'} flex gap-1 text-sm bg-black py-[2px] px-[8px] rounded-[30px]`}
                                  >
                                    {[...new Set(item.messageReactionUsers.map((u) => u.reaction))]
                                      .slice(0, 4)
                                      .map((emoji) => (
                                        <div key={emoji}>{emoji}</div>
                                      ))}
                                    {item.messageReactionUsers.length > 1 && (
                                      <p className='text-white'>{item.messageReactionUsers.length}</p>
                                    )}
                                  </div>
                                )}

                                {messageReactionBar === item.id && (
                                  <div
                                    ref={reactionBarRef}
                                    className={`z-[100] flex gap-2 bg-gray-500 text-white rounded-[20px] py-[8px] px-[14px] absolute ${isMe ? 'left-[-150px]' : 'right-[-160px]'} top-[-50px]`}
                                  >
                                    {reactions.map((r) => (
                                      <div
                                        key={r}
                                        onClick={() => handleSendReaction(item.id, r)}
                                        className='text-lg cursor-pointer transition-transform duration-150 hover:-translate-y-1 hover:scale-110'
                                      >
                                        {r}
                                      </div>
                                    ))}
                                    <div className='text-lg cursor-pointer transition-transform duration-150 hover:-translate-y-1 hover:scale-110'>
                                      <FontAwesomeIcon
                                        onClick={() => {
                                          setfullyReactionSelection(item.id)
                                          setMessageReactionBar(null)
                                        }}
                                        icon={faPlus}
                                      />
                                    </div>
                                  </div>
                                )}

                                {fullyReactionSelection === item.id && (
                                  <div
                                    className={`absolute z-[200] ${isMe ? 'left-[-300px]' : 'right-[-300px]'} top-[-437px]`}
                                    ref={pickerEmotionRef}
                                  >
                                    <Picker
                                      previewPosition='none'
                                      data={data}
                                      onEmojiSelect={(emoji: any) => handleSendReaction(item.id, emoji.native)}
                                    />
                                  </div>
                                )}

                                {isMe && index === messages.length - 1 && (
                                  <>
                                    {item.status === 'Sent' && (
                                      <Tooltip placement='left' title={item.status}>
                                        <FontAwesomeIcon className='mr-[8px] opacity-[0.4]' icon={faCheck} />
                                      </Tooltip>
                                    )}
                                    {item.status === 'Delivered' && (
                                      <Tooltip placement='left' title={item.status}>
                                        <FontAwesomeIcon className='mr-[8px] opacity-[0.4]' icon={faCheckDouble} />
                                      </Tooltip>
                                    )}
                                    {item.status === 'Seen' && (
                                      <Tooltip placement='left' title={item.status}>
                                        <FontAwesomeIcon className='mr-[8px] opacity-[0.4]' icon={faEye} />
                                      </Tooltip>
                                    )}
                                  </>
                                )}
                              </ConfigProvider>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {isMe && (
                      <a href='#' className='ml-2'>
                        <Avatar className='select-none border-2 border-gray-200' src={userInfo.avatarUrl}></Avatar>
                      </a>
                    )}
                    <div ref={messageEndRef}></div>
                  </div>
                )
              }}
            />
          </div>
          
          {/* Scroll to bottom button */}
          {showScrollToBottom && (
            <button
              onClick={scrollToNewestMessage}
              className='absolute bottom-4 left-1/2 -translate-x-1/2 w-10 h-10 bg-white border-2 border-gray-300 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 transition-all z-50'
              title='Scroll to newest message'
            >
              <ArrowDownOutlined className='text-gray-600' />
            </button>
          )}
        </div>
      )}

      {/* Footer - Input Area */}
      <div className='px-[20px] pb-[12px]'>
        {imagesPreview.length > 0 && (
          <div className='flex flex-wrap gap-2 mb-[8px]'>
            {imagesPreview.map((image, index) => (
              <div key={index} className='relative inline-block'>
                <Image className='rounded-[12px] select-none' width={90} height={90} src={image} />
                <button
                  onClick={() => removePreviewImage(index)}
                  className='absolute -top-2 -right-2 bg-gray-800 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-gray-900'
                >
                  <CloseOutlined className='text-xs' />
                </button>
              </div>
            ))}
          </div>
        )}

        {audioUrl && (
          <div className='mb-[8px]'>
            <div className='p-3 bg-gray-100 rounded-full max-w-md flex items-center gap-3'>
              <button
                onClick={togglePreviewRecord}
                className='w-8 h-8 flex items-center justify-center rounded-full bg-blue-500 hover:bg-blue-600 text-white'
              >
                <FontAwesomeIcon icon={!previewVoicePlaying ? faPlay : faPause} className='text-xs' />
              </button>
              <div ref={waveformRef} className='flex-1'></div>
              <button
                onClick={() => {
                  setAudioUrl(null)
                  setAudioBlob(null)
                }}
                className='w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200'
              >
                <CloseOutlined className='text-sm' />
              </button>
            </div>
          </div>
        )}

        {repliedMessagePreview && (
          <div className='bg-[#8fd8d2] px-[10px] py-[12px] rounded-[20px] mb-2 border-l-4 border-gray-400'>
            <div className='flex justify-between items-start gap-2'>
              <div className='flex-1 min-w-0'>
                <p className='text-sm font-bold mb-1'>Replying to {repliedMessagePreview.sender.firstName}</p>
                {repliedMessagePreview.content === '' &&
                repliedMessagePreview.messageAttachments[0]?.fileType === 'Image' ? (
                  repliedMessagePreview.messageAttachments.map((img, i) => (
                    <Image key={i} className='rounded-[12px]' width={80} height={80} src={img.fileUrl} />
                  ))
                ) : repliedMessagePreview.content === '' ? (
                  <p className='text-xs text-[#000000ab]'>Attachment</p>
                ) : (
                  <p className='text-xs text-[#000000ab] break-words'>{repliedMessagePreview.content}</p>
                )}
              </div>
              <FontAwesomeIcon
                className='cursor-pointer text-gray-600 hover:text-gray-800'
                onClick={() => setRepliedMessagePreview(null)}
                icon={faXmark}
              />
            </div>
          </div>
        )}

        {conversation && (
          /* Container chính: Thêm px-2 sm:px-0 để không bị sát mép trên mobile */
          <div className='flex items-end gap-1.5 sm:gap-2 p-2 sm:p-0'>
            {isRecording ? (
              /* CHẾ ĐỘ GHI ÂM */
              <div className='flex-1 flex items-center gap-2 sm:gap-3 bg-gray-50 rounded-[24px] px-3 sm:px-4 py-2 sm:py-3 border border-gray-200'>
                <div className='flex items-center gap-2 sm:gap-3 flex-1 min-w-0'>
                  <div className='w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse flex-shrink-0'></div>
                  <span className='text-xs sm:text-sm font-medium text-gray-700 flex-shrink-0'>
                    {formatDuration(recordingDuration)}
                  </span>

                  {/* Progress bar: Ẩn trên mobile cực nhỏ, hiện từ sm trở lên để tiết kiệm chỗ */}
                  <div className='hidden sm:block flex-1 h-6 sm:h-8 bg-gray-200 rounded-full overflow-hidden relative'>
                    <div
                      className='h-full bg-blue-500 rounded-full transition-all duration-300'
                      style={{ width: `${Math.min((recordingDuration / 60) * 100, 100)}%` }}
                    ></div>
                  </div>
                  {/* Mobile view: text chạy thay cho bar */}
                  <span className='sm:hidden text-[10px] text-gray-400 truncate'>Recording...</span>
                </div>

                <button
                  onClick={cancelRecording}
                  className='text-gray-500 hover:text-gray-800 p-1.5 sm:p-2 flex-shrink-0'
                >
                  <FontAwesomeIcon icon={faXmark} className='text-base sm:text-lg' />
                </button>
                <button
                  onClick={stopRecording}
                  className='w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-blue-500 text-white flex-shrink-0'
                >
                  <FontAwesomeIcon icon={faCircleStop} className='text-sm sm:text-base' />
                </button>
              </div>
            ) : (
              /* CHẾ ĐỘ NHẬP LIỆU BÌNH THƯỜNG */
              <>
                {/* Nhóm Icon bên trái khi chưa nhập text */}
                {!text.trim() && (
                  <div className='flex items-center gap-0.5 sm:gap-1'>
                    <input ref={attachFileInputRef} hidden type='file' onChange={handleFileChange} />
                    <button
                      onClick={() => attachFileInputRef.current?.click()}
                      className='w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100'
                    >
                      <FontAwesomeIcon icon={faPaperclip} className='text-base sm:text-lg' />
                    </button>

                    {/* Ẩn bớt 1 icon trên mobile cực nhỏ nếu cần, ở đây giữ nguyên nhưng thu nhỏ size */}
                    <input
                      ref={fileInputRef}
                      hidden
                      type='file'
                      multiple
                      accept='image/*'
                      onChange={handleImagesFileChange}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className='w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100'
                    >
                      <FontAwesomeIcon icon={faImage} className='text-base sm:text-lg' />
                    </button>
                    <button
                      onClick={startRecording}
                      className='w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100'
                    >
                      <FontAwesomeIcon icon={faMicrophone} className='text-base sm:text-lg' />
                    </button>
                  </div>
                )}

                {/* Nút Plus khi đang nhập text */}
                {text.trim() && (
                  <div className='relative' ref={attachMenuRef}>
                    <button
                      onClick={() => setShowAttachMenu(!showAttachMenu)}
                      className='w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full text-blue-500 hover:bg-blue-50'
                    >
                      <PlusOutlined className='text-lg' />
                    </button>
                    {showAttachMenu && (
                      <div className='absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden w-36 sm:w-40 z-[100]'>
                        <button
                          onClick={() => {
                            document.getElementById('attachFileInputMenu')?.click()
                            setShowAttachMenu(false)
                          }}
                          className='w-full px-3 py-2 sm:px-4 sm:py-2.5 text-left hover:bg-gray-100 flex items-center gap-3 text-gray-700 text-sm'
                        >
                          <FontAwesomeIcon icon={faPaperclip} className='w-4' />
                          <span>File</span>
                        </button>
                        <button
                          onClick={() => {
                            fileInputRef.current?.click()
                            setShowAttachMenu(false)
                          }}
                          className='w-full px-3 py-2 sm:px-4 sm:py-2.5 text-left hover:bg-gray-100 flex items-center gap-3 text-gray-700 text-sm'
                        >
                          <FontAwesomeIcon icon={faImage} className='w-4' />
                          <span>Image</span>
                        </button>
                        <button
                          onClick={() => {
                            startRecording()
                            setShowAttachMenu(false)
                          }}
                          className='w-full px-3 py-2 sm:px-4 sm:py-2.5 text-left hover:bg-gray-100 flex items-center gap-3 text-gray-700 text-sm'
                        >
                          <FontAwesomeIcon icon={faMicrophone} className='w-4' />
                          <span>Voice</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Ô soạn thảo text */}
                <div className='flex-1 relative min-w-0'>
                  <div className='flex items-end bg-white rounded-[20px] sm:rounded-[24px] px-3 sm:px-4 border border-gray-200 focus-within:border-blue-400 transition-all'>
                    <textarea
                      ref={textareaRef}
                      className='flex-1 content-center bg-transparent text-[14px] sm:text-sm outline-none placeholder-gray-500 resize-none overflow-hidden max-h-[100px] py-1'
                      placeholder='Message...'
                      onFocus={() => setIsInputFocused(true)}
                      onBlur={() => setIsInputFocused(false)}
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                      rows={1}
                    />

                    {/* Emoji Picker: Xử lý z-index và vị trí trên mobile */}
                    <div className='flex-shrink-0 ml-1 sm:ml-2' ref={emojiPickerRef}>
                      <button
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className='text-gray-400 hover:text-gray-600 p-1'
                      >
                        <FontAwesomeIcon icon={faFaceSmile} className='text-lg sm:text-base' />
                      </button>
                      {showEmojiPicker && (
                        /* Trên mobile có thể bảng emoji sẽ bị tràn, thêm max-w-screen nếu cần */
                        <div className='absolute bottom-full right-0 mb-2 z-[100] max-w-[calc(100vw-40px)]'>
                          <Picker
                            data={data}
                            onEmojiSelect={handleEmojiSelect}
                            previewPosition='none'
                            theme='light'
                            perLine={window.innerWidth < 640 ? 7 : 8}
                            emojiSize={window.innerWidth < 640 ? 18 : 20}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Nút Gửi */}
                <button
                  onClick={handleSendMessage}
                  className='w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-blue-500 hover:bg-blue-600 text-white flex-shrink-0 transition-transform active:scale-95'
                >
                  <SendOutlined className='text-base sm:text-lg' />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatArea