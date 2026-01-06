import { useEffect, useRef, useState } from 'react'
import { message } from 'antd'
import RecordRTC from 'recordrtc'

import { UserDto } from '@/app/types/User/user.dto'
import { MessageDto } from '@/app/types/Message/messge.dto'
import { ConversationDto } from '@/app/types/Conversation/conversation.dto'
import { ConversationUserDto } from '@/app/types/ConversationUser/conversationUser.dto'

import { userService } from '@/app/services/user.service'
import { chatService } from '@/app/services/chat.service'
import { messageService } from '@/app/services/message.service'
import { conversationService } from '@/app/services/conversation.service'
import { conversationUserService } from '@/app/services/conversation.user.service'
import { useNavigate, useParams } from 'react-router-dom'
import { BaseResponse } from '@/app/types/Base/Responses/baseResponse'
import { ResponseHasData } from '@/app/types/Base/Responses/ResponseHasData'

import ModalNewMessage from './ModalNewMessage'
import ConversationList from './ConversationList'
import ChatArea from './ChatArea'
import ChatDetails from './ChatDetails'
import { useUnread } from '@/app/common/Contexts/UnreadContext'

interface InboxProps {
  conversationId?: string
}

const Inbox: React.FC<InboxProps> = () => {
  const firstMessageRef = useRef<HTMLDivElement | null>(null)
  const newestMessageRef = useRef<HTMLDivElement | null>(null)
  const messageEndRef = useRef<HTMLDivElement | null>(null)
  const recorderRef = useRef<RecordRTC | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [conversation, setConversation] = useState<ConversationDto | null>(null)
  const [conversationUsers, setConversationUsers] = useState<ConversationUserDto[]>([])
  const [isChatFocused, setIsChatFocused] = useState(false)
  const [isInputFocused, setIsInputFocused] = useState(false)
  const [userInfo, setUserInfo] = useState<UserDto | null>(null)
  const [receivers, setReceivers] = useState<UserDto[]>([])
  const [text, setText] = useState('')
  const [repliedMessagePreview, setRepliedMessagePreview] = useState<MessageDto | null>(null)
  const [skipMessages, setSkipMessages] = useState(0)
  const [takeMessages, setTakeMessages] = useState(20)
  const [messages, setMessages] = useState<MessageDto[]>([])
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagesPreview, setImagesPreview] = useState<string[]>([])
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [isRecording, setIsRecording] = useState<boolean>(false)
  const [conversations, setConversations] = useState<ConversationDto[]>([])
  const [isModalNewMessageOpen, setIsModalNewMessageOpen] = useState(false)
  const [messageUnseen, setMessageUnseen] = useState(0)
  const { setUnreadMessages } = useUnread()
  const navigate = useNavigate()
  const { conversationId } = useParams()

  const loadMoreMessage = () => {
    const firstVisible = firstMessageRef.current
    if (!firstVisible) return
    const oldTopId = firstVisible?.id
    setSkipMessages(skipMessages + 20)
    const element = document.getElementById(oldTopId || '')
    element?.scrollIntoView({ block: 'start' })
  }

  const handleSendMessage = () => {
    const formData = new FormData()
    formData.append('senderId', userInfo?.id || '')
    formData.append('conversationId', conversationId || '')
    if (repliedMessagePreview !== null) formData.append('repliedMessageId', repliedMessagePreview.id)

    // Ưu tiên gửi voice nếu đang có voice recording
    if (audioUrl !== null && audioBlob !== null) {
      // Gửi voice, KHÔNG gửi text (giữ lại text)
      formData.append('content', '') // Không gửi text
      formData.append('files', new File([audioBlob], `${userInfo?.id}_${Date.now()}_voice.wav`, { type: 'audio/wav' }))
      formData.append('fileType', 'Voice')
      setAudioBlob(null)
      setAudioUrl(null)
      onSendMessage(formData)
    }
    // Gửi ảnh và text
    else if (imageFiles.length !== 0 && audioUrl === null) {
      formData.append('content', text)
      imageFiles.forEach((file) => {
        formData.append('files', file)
      })
      formData.append('fileType', 'Image')
      onSendMessage(formData)
      if (text.trim() !== '') {
        setText('')
      }
      setImageFiles([])
      setImagesPreview([])
    }
    // Chỉ gửi text
    else if (imageFiles.length === 0 && audioUrl === null) {
      if (text.trim() !== '') {
        formData.append('content', text)
        onSendMessage(formData)
        setText('')
      }
    }
    setRepliedMessagePreview(null)
  }

  const onSendMessage = async (sendMessageRequest: FormData) => {
    try {
      const sendMessageReponse = await messageService.sendMessage(sendMessageRequest)
      if (sendMessageReponse.status === 400) {
        const res = sendMessageReponse.data as BaseResponse
        message.error(res.message)
      } else if (sendMessageReponse.status === 200) {
        const res = sendMessageReponse.data as ResponseHasData<MessageDto>
        setMessages([...messages, res.data as MessageDto])
        updateItemInConversations(conversationId || '', res.data as MessageDto, null)
        setTimeout(() => {
          newestMessageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
        }, 100)
      }
    } catch (err) {
      message.error('Error while sending message!')
    }
  }

  const handleSendReaction = async (messageId: string, reaction: string) => {
    try {
      const sendMessageReponse = await messageService.reactionMessage(messageId, reaction)
      if (sendMessageReponse.status === 400) {
        const res = sendMessageReponse.data as BaseResponse
        message.error(res.message)
      } else if (sendMessageReponse.status === 200) {
        const res = sendMessageReponse.data as ResponseHasData<MessageDto>
        const updatedMessage = res.data as MessageDto
        setMessages((prev) => prev.map((m) => (m.id === updatedMessage.id ? updatedMessage : m)))
      }
    } catch (err) {
      message.error('Error while sending reaction!')
    }
  }

  const fetchUserInfo = async () => {
    try {
      const response = await userService.getUserInfoByToken()
      if (response.status === 400) {
        const base = response.data as BaseResponse
        message.error(base.message)
      } else if (response.status === 200) {
        setUserInfo(response.data as UserDto)
      }
    } catch (err) {
      message.error('Error while getting user information!')
    }
  }

  const fetchConversation = async () => {
    try {
      const response = await conversationService.getConversation(conversationId || '')
      if (response.status === 400) {
        const base = response.data as BaseResponse
        message.error(base.message)
      } else if (response.status === 200) {
        const conversationData = response.data as ResponseHasData<ConversationDto>
        setConversation(conversationData.data as ConversationDto)
      }
    } catch (err) {
      return
    }
  }

  const fetchAllConversations = async () => {
    try {
      const response = await conversationService.getAllConversationsByUser()
      if (response.status === 400) {
        const base = response.data as BaseResponse
        message.error(base.message)
      } else if (response.status === 200) {
        const conversationUsersRes = response.data as ResponseHasData<ConversationDto[]>
        setConversations(conversationUsersRes.data as ConversationDto[])
      }
    } catch (err) {
      message.error('Error while getting list conversations')
    }
  }

  const fetchConversationUsers = async () => {
    try {
      const response = await conversationUserService.getConversationUser({
        senderId: userInfo?.id || '',
        conversationId: conversationId || '',
        conversationType: conversation?.type || ''
      })
      if (response.status === 400) {
        const base = response.data as BaseResponse
        message.error(base.message)
      } else if (response.status === 200) {
        const conversationUsersRes = response.data as ResponseHasData<ConversationUserDto[]>
        setConversationUsers(conversationUsersRes.data as ConversationUserDto[])
      }
    } catch (err) {
      return
    }
  }

  const fetchReceiversInfo = async () => {
    try {
      let userIds: string[] = []
      if (conversation?.type === 'Personal') {
        const otherId = conversationUsers.find((u) => u.userId !== userInfo?.id)?.userId
        if (otherId) userIds = [otherId]
      }
      if (!userIds.length) return
      const responses = await Promise.all(userIds.map((id) => userService.getUserInfoById(id)))
      setReceivers(responses.map((r) => r.data as UserDto))
    } catch (err) {
      message.error('Error while getting receiver information!')
    }
  }

  const getMessages = async (firstTime: boolean) => {
    try {
      const response = await messageService.getMessages(conversationId || '', skipMessages, takeMessages)
      if (response.status === 400) {
        const base = response.data as BaseResponse
        message.error(base.message)
      } else if (response.status === 200) {
        const dataResponse = response.data as ResponseHasData<MessageDto[]>
        if (firstTime) setMessages([...messages, ...(dataResponse.data as MessageDto[])])
        else setMessages([...(dataResponse.data as MessageDto[]), ...messages])
      }
    } catch (err) {
      message.error('Error while getting messages!')
    }
  }

  const navigateToInbox = (conversationId: string) => {
    setMessages([])
    setSkipMessages(0)
    setTimeout(() => {
      navigate(`/Inbox/${conversationId}`)
    }, 1000)
  }

  const updateItemInConversations = async (convId: string, newestMessage: MessageDto | null, status: string | null) => {
    try {
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id !== convId) return conv
          const updatedConv = { ...conv }
          if (newestMessage) {
            updatedConv.newestMessage = newestMessage
          } else if (status && updatedConv.newestMessage) {
            updatedConv.newestMessage = {
              ...updatedConv.newestMessage,
              status
            }
          }
          return updatedConv
        })
      )
    } catch (err) {
      return
    }
  }

  useEffect(() => {
    if (!newestMessageRef.current) return
    if (document.visibilityState !== 'visible') return

    const textingArea = document.getElementById('scrollableDiv')
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (document.visibilityState !== 'visible') return
        if (
          ((entry.isIntersecting && isChatFocused) || (entry.isIntersecting && isInputFocused)) &&
          messages[messages.length - 1].sender.id !== userInfo?.id
        ) {
          const updateMessageStatus = chatService.updateMessageStatus({
            messageId: messages[messages.length - 1].id,
            status: 'Seen'
          })
          if (!updateMessageStatus) return
          setMessageUnseen(messageUnseen - 1)
          updateItemInConversations(conversationId || '', null, 'Seen')
        }
      },
      {
        root: textingArea,
        threshold: 0.8
      }
    )

    observer.observe(newestMessageRef.current)

    return () => observer.disconnect()
  }, [messages, isChatFocused, isInputFocused])

  useEffect(() => {
    chatService.start().then(() => {
      chatService.onReceivePrivateMessage(async (newReceivedMessage) => {
        if (conversationId !== undefined) {
          setMessages([...messages, newReceivedMessage])
          updateItemInConversations(newReceivedMessage.conversationId, newReceivedMessage, null)
        }
        const updateMessageStatus = await chatService.updateMessageStatus({
          messageId: newReceivedMessage.id,
          status: 'Delivered'
        })
        if (!updateMessageStatus) return
      })
    })

    return () => {
      chatService.offReceivePrivateMessage()
    }
  })

  useEffect(() => {
    fetchUserInfo()
    if (conversationId) fetchConversation()
    fetchAllConversations()
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' })

    chatService.getUpdatedMessage((newestMessage: MessageDto) => {
      setMessages((prevMessages) =>
        prevMessages.map((m: MessageDto) => (m.id === newestMessage.id ? newestMessage : m))
      )
    })

    chatService.updateUser((user: UserDto) => {
      setReceivers((prevReceivers) => prevReceivers.map((u: UserDto) => (u.id === user.id ? user : u)))
    })

    const textingArea = document.getElementById('scrollableDiv')
    if (!textingArea) return
    textingArea.tabIndex = 0

    const handleFocus = () => setIsChatFocused(true)
    const handleBlur = () => setIsChatFocused(false)

    textingArea.addEventListener('focus', handleFocus)
    textingArea.addEventListener('blur', handleBlur)

    return () => {
      textingArea.removeEventListener('focus', handleFocus)
      textingArea.removeEventListener('blur', handleBlur)
    }
  }, [])

  useEffect(() => {
    if (conversationId) {
      fetchConversation()
    }
  }, [conversationId])

  useEffect(() => {
    if (conversation && userInfo) {
      fetchConversationUsers()
    }
  }, [conversation])

  useEffect(() => {
    if (userInfo && conversationId) {
      if (skipMessages == 0) getMessages(true)
      else getMessages(false)
    }
  }, [userInfo, conversationId, skipMessages])

  useEffect(() => {
    fetchReceiversInfo()
  }, [conversation, conversationUsers])

  useEffect(() => {
    if (!text) return

    const timeout = setTimeout(() => {
      // Update messageDraft
    }, 2000)

    return () => clearTimeout(timeout)
  }, [text])

  useEffect(() => {
    let count = 0
    conversations.map((conversation) => {
      if (conversation.newestMessage?.senderId !== userInfo?.id && conversation.newestMessage?.status !== 'Seen')
        count++
    })
    setMessageUnseen(count)
    setUnreadMessages(count)
  }, [conversations])

  useEffect(() => {
    const baseTitle = 'FriCon'
    if (messageUnseen > 0) document.title = `(${messageUnseen}) ${baseTitle}`
    else document.title = baseTitle
  }, [messageUnseen])

  console.log('conversationId:', conversationId)
  console.log('conversations:', conversations)
  console.log('messages:', messages)

  return (
    <div className='h-[calc(100vh-64px)] bg-[#F0F2F5] overflow-hidden'>
      {/* Bỏ margin 8px trên mobile để tối ưu không gian, chỉ giữ trên desktop */}
      <div className='flex h-full bg-white md:m-[8px] shadow-sm overflow-hidden md:rounded-lg'>
        {/* CỘT 1: DANH SÁCH CUỘC TRÒ CHUYỆN */}
        <div
          className={`
        ${conversationId ? 'hidden md:block' : 'block'} 
        w-full md:w-[300px] lg:w-[360px] border-r border-gray-200 flex-shrink-0
      `}
        >
          <ConversationList
            conversations={conversations}
            userInfo={userInfo}
            conversationId={conversationId}
            onNewMessageClick={() => setIsModalNewMessageOpen(true)}
            onConversationClick={navigateToInbox}
          />
        </div>

        {/* CỘT 2: KHU VỰC CHAT CHÍNH */}
        <div
          className={`
        ${conversationId ? 'flex' : 'hidden md:flex'} 
        flex-1 flex-col h-full min-w-0
      `}
        >
          <ChatArea
            conversation={conversation}
            conversationUsers={conversationUsers}
            conversationId={conversationId}
            userInfo={userInfo}
            receivers={receivers}
            messages={messages}
            text={text}
            setText={setText}
            repliedMessagePreview={repliedMessagePreview}
            setRepliedMessagePreview={setRepliedMessagePreview}
            imageFiles={imageFiles}
            setImageFiles={setImageFiles}
            imagesPreview={imagesPreview}
            setImagesPreview={setImagesPreview}
            audioUrl={audioUrl}
            setAudioUrl={setAudioUrl}
            audioBlob={audioBlob}
            setAudioBlob={setAudioBlob}
            isRecording={isRecording}
            setIsRecording={setIsRecording}
            isChatFocused={isChatFocused}
            setIsChatFocused={setIsChatFocused}
            isInputFocused={isInputFocused}
            setIsInputFocused={setIsInputFocused}
            firstMessageRef={firstMessageRef}
            newestMessageRef={newestMessageRef}
            messageEndRef={messageEndRef}
            recorderRef={recorderRef}
            streamRef={streamRef}
            loadMoreMessage={loadMoreMessage}
            handleSendMessage={handleSendMessage}
            handleSendReaction={handleSendReaction}
            onConversationDeleted={() => {
              navigate('/Inbox')
              fetchAllConversations()
            }}
            onNicknameChanged={(userId, newNickname) => {
              setConversationUsers((prev) =>
                prev.map((cu) => (cu.userId === userId ? { ...cu, nickName: newNickname } : cu))
              )
            }}
            onGroupNameChanged={(newName) => {
              setConversation((prev) => (prev ? { ...prev, conversationName: newName } : null))
            }}
          />
        </div>

        {/* CỘT 3: CHI TIẾT CUỘC TRÒ CHUYỆN */}
        {/* Chỉ hiển thị trên màn hình lớn (Laptop trở lên) */}
        <div className='hidden lg:block w-[300px] border-l border-gray-200 flex-shrink-0'>
          <ChatDetails conversation={conversation} messages={messages} />
        </div>

        <ModalNewMessage isModalOpen={isModalNewMessageOpen} onClose={() => setIsModalNewMessageOpen(false)} />
      </div>
    </div>
  )
}

export default Inbox