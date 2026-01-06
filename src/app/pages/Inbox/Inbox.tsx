import { useCallback, useEffect, useRef, useState } from 'react'
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
  const scrollableDivRef = useRef<HTMLDivElement | null>(null)

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
  const [isFirstLoad, setIsFirstLoad] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const { setUnreadMessages } = useUnread()
  const navigate = useNavigate()
  const { conversationId } = useParams()

  const scrollToBottom = (behavior: ScrollBehavior = 'auto') => {
    const scrollableDiv = document.getElementById('scrollableDiv')
    if (scrollableDiv) {
      scrollableDiv.scrollTo({
        top: scrollableDiv.scrollHeight,
        behavior: behavior
      })
    }
  }

  const loadMoreMessage = useCallback(async () => {
    if (isLoadingMore || !hasMore || !conversationId) return

    setIsLoadingMore(true)

    try {
      const scrollableDiv = document.getElementById('scrollableDiv')
      const oldScrollHeight = scrollableDiv?.scrollHeight || 0

      // Tính skip mới để lấy tin nhắn cũ hơn
      const newSkip = skipMessages + takeMessages

      const response = await messageService.getMessages(conversationId, newSkip, takeMessages)
      if (response.status === 200) {
        const dataResponse = response.data as ResponseHasData<MessageDto[]>
        const newMessages = dataResponse.data as MessageDto[]

        // Kiểm tra nếu không còn tin nhắn nào
        if (newMessages.length < takeMessages) {
          setHasMore(false)
        }

        // Load more: thêm tin nhắn cũ vào ĐẦU mảng
        setMessages((prevMessages) => [...newMessages, ...prevMessages])

        // Cập nhật skip để lần sau load tiếp
        setSkipMessages(newSkip)

        // Giữ vị trí scroll sau khi thêm tin nhắn cũ
        requestAnimationFrame(() => {
          if (scrollableDiv) {
            const newScrollHeight = scrollableDiv.scrollHeight
            const scrollDiff = newScrollHeight - oldScrollHeight
            scrollableDiv.scrollTop = scrollDiff
          }
        })
      }
    } catch (err) {
      message.error('Error while loading more messages!')
    } finally {
      setIsLoadingMore(false)
    }
  }, [isLoadingMore, hasMore, skipMessages, takeMessages, conversationId])

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
          scrollToBottom('smooth')
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
      const scrollableDiv = document.getElementById('scrollableDiv')
      const oldScrollHeight = scrollableDiv?.scrollHeight || 0

      const response = await messageService.getMessages(conversationId || '', skipMessages, takeMessages)
      if (response.status === 400) {
        const base = response.data as BaseResponse
        message.error(base.message)
      } else if (response.status === 200) {
        const dataResponse = response.data as ResponseHasData<MessageDto[]>
        const newMessages = dataResponse.data as MessageDto[]

        // Kiểm tra nếu không còn tin nhắn nào
        if (newMessages.length < takeMessages) {
          setHasMore(false)
        }

        if (firstTime) {
          // Lần đầu load: tin nhắn mới nhất ở cuối mảng (API trả về tin cũ nhất trước)
          setMessages(newMessages)
        } else {
          // Load more: thêm tin nhắn cũ vào ĐẦU mảng
          // Tin nhắn cũ hơn sẽ được hiển thị ở trên
          setMessages((prevMessages) => [...newMessages, ...prevMessages])

          // Giữ vị trí scroll sau khi thêm tin nhắn cũ
          requestAnimationFrame(() => {
            if (scrollableDiv) {
              const newScrollHeight = scrollableDiv.scrollHeight
              const scrollDiff = newScrollHeight - oldScrollHeight
              scrollableDiv.scrollTop = scrollDiff
            }
          })
        }
      }
    } catch (err) {
      message.error('Error while getting messages!')
    } finally {
      setIsLoadingMore(false)
    }
  }

  const navigateToInbox = (newConversationId: string) => {
    // Nếu đang ở conversation hiện tại, không làm gì cả
    if (newConversationId === conversationId) {
      return
    }

    setMessages([])
    setSkipMessages(0)
    setIsFirstLoad(true)
    setHasMore(true)
    setTimeout(() => {
      navigate(`/Inbox/${newConversationId}`)
    }, 100)
  }

  const updateItemInConversations = async (convId: string, newestMessage: MessageDto | null, status: string | null) => {
    try {
      setConversations((prev) => {
        const conversationExists = prev.some((conv) => conv.id === convId)
        if (!conversationExists && newestMessage) {
          fetchAllConversations()
          return prev
        }

        return prev.map((conv) => {
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
      })
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
          messages.length > 0 &&
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
    const handleNewMessage = (event: CustomEvent<MessageDto>) => {
      const newReceivedMessage = event.detail
      updateItemInConversations(newReceivedMessage.conversationId, newReceivedMessage, null)
    
      if (conversationId !== undefined && newReceivedMessage.conversationId === conversationId) {
        setMessages((prev) => [...prev, newReceivedMessage])     
        setTimeout(() => {
          scrollToBottom('smooth')
        }, 100)
      }
    }

    window.addEventListener('new-private-message', handleNewMessage as EventListener)

    return () => {
      window.removeEventListener('new-private-message', handleNewMessage as EventListener)
    }
  }, [conversationId])

  useEffect(() => {
    fetchUserInfo()
    if (conversationId) fetchConversation()
    fetchAllConversations()

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
    chatService.getUpdatedMessage((newestMessage: MessageDto) => {
      setMessages((prevMessages) =>
        prevMessages.map((m: MessageDto) => (m.id === newestMessage.id ? newestMessage : m))
      )
    })

    return () => {
      chatService.offUpdatedMessage()
    }
  })

  // Scroll event để load thêm tin nhắn cũ khi kéo lên đầu
  useEffect(() => {
    const scrollableDiv = document.getElementById('scrollableDiv')
    if (!scrollableDiv) return

    const handleScroll = () => {
      // Khi scrollTop gần 0 (đầu container), load thêm tin nhắn
      if (scrollableDiv.scrollTop < 100 && hasMore && !isLoadingMore) {
        loadMoreMessage()
      }
    }

    scrollableDiv.addEventListener('scroll', handleScroll)
    return () => {
      scrollableDiv.removeEventListener('scroll', handleScroll)
    }
  }, [hasMore, isLoadingMore, loadMoreMessage])

  useEffect(() => {
    if (conversationId) {
      fetchConversation()
      setIsFirstLoad(true)
      setMessages([])
      setSkipMessages(0)
      setHasMore(true)
    }
  }, [conversationId])

  useEffect(() => {
    if (conversation && userInfo) {
      fetchConversationUsers()
    }
  }, [conversation])

  useEffect(() => {
    if (userInfo && conversationId) {
      // Chỉ gọi getMessages khi là lần đầu load (skipMessages = 0)
      // Các lần load more đã được xử lý trong loadMoreMessage
      if (skipMessages === 0) {
        getMessages(true)
      }
    }
  }, [userInfo, conversationId, skipMessages])

  // Mark newest message as Seen when opening a conversation
  useEffect(() => {
    if (
      messages.length > 0 &&
      userInfo &&
      conversationId &&
      messages[messages.length - 1].sender.id !== userInfo.id &&
      messages[messages.length - 1].status !== 'Seen'
    ) {
      const markAsSeen = async () => {
        const updateMessageStatus = await chatService.updateMessageStatus({
          messageId: messages[messages.length - 1].id,
          status: 'Seen'
        })
        if (updateMessageStatus) {
          updateItemInConversations(conversationId, null, 'Seen')
        }
      }
      markAsSeen()
    }
  }, [conversationId, messages.length > 0 && messages[messages.length - 1]?.id])

  // Scroll to bottom after messages are loaded for the first time
  useEffect(() => {
    if (messages.length > 0 && isFirstLoad && skipMessages === 0) {
      // Multiple attempts to ensure scroll works with InfiniteScroll inverse
      const scrollAttempts = [100, 200, 300]
      const timers: NodeJS.Timeout[] = []

      scrollAttempts.forEach((delay) => {
        const timer = setTimeout(() => {
          const scrollableDiv = document.getElementById('scrollableDiv')
          if (scrollableDiv) {
            // Cuộn xuống cuối để xem tin nhắn mới nhất
            scrollableDiv.scrollTop = scrollableDiv.scrollHeight
          }
        }, delay)
        timers.push(timer)
      })

      // Set isFirstLoad to false after last attempt
      const finalTimer = setTimeout(() => {
        setIsFirstLoad(false)
      }, 350)
      timers.push(finalTimer)

      return () => {
        timers.forEach((timer) => clearTimeout(timer))
      }
    }
  }, [messages, isFirstLoad, skipMessages])

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
  return (
    <div className='h-[calc(100vh-64px)] bg-[#F0F2F5] overflow-hidden'>
      <div className='flex h-full bg-white md:m-[8px] shadow-sm overflow-hidden md:rounded-lg'>
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
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            loadMoreMessage={loadMoreMessage}
            handleSendMessage={handleSendMessage}
            handleSendReaction={handleSendReaction}
            onConversationDeleted={() => {
              navigate('/Inbox')
              fetchAllConversations()
            }}
            onNicknameChanged={(userId: string, newNickname: string) => {
              setConversationUsers((prev) =>
                prev.map((cu) => (cu.userId === userId ? { ...cu, nickName: newNickname } : cu))
              )
            }}
            onGroupNameChanged={(newName: string) => {
              setConversation((prev) => (prev ? { ...prev, conversationName: newName } : null))
            }}
          />
        </div>

        <div className='hidden lg:block w-[300px] border-l border-gray-200 flex-shrink-0'>
          <ChatDetails conversation={conversation} conversationId={conversationId} />
        </div>

        <ModalNewMessage isModalOpen={isModalNewMessageOpen} onClose={() => setIsModalNewMessageOpen(false)} />
      </div>
    </div>
  )
}

export default Inbox
