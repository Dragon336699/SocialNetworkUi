import { chatService } from '@/app/services/chat.service'
import { useEffect, useRef, useState } from 'react'
import { Avatar, ConfigProvider, Divider, Input, List, message, Skeleton, Tooltip } from 'antd'
import { PhoneOutlined, SearchOutlined, SendOutlined } from '@ant-design/icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCheck,
  faCheckDouble,
  faEllipsisVertical,
  faEye,
  faImage,
  faPaperclip
} from '@fortawesome/free-solid-svg-icons'
import { userService } from '@/app/services/user.service'
import { useParams } from 'react-router-dom'
import { messageService } from '@/app/services/message.service'
import { MessageDto } from '@/app/types/Message/messge.dto'
import { SendMessageRequest } from '@/app/types/Message/Requests/MessageReq'
import { BaseResponse } from '@/app/types/Base/Responses/baseResponse'
import { UserDto } from '@/app/types/User/user.dto'
import { ResponseHasData } from '@/app/types/Base/Responses/ResponseHasData'
import InfiniteScroll from 'react-infinite-scroll-component'
import { conversationService } from '@/app/services/conversation.service'
import { ConversationDto } from '@/app/types/Conversation/conversation.dto'
import { ConversationUsreDto } from '@/app/types/ConversationUser/conversationUser.dto'
import { conversationUserService } from '@/app/services/conversation.user.service'

const Inbox: React.FC = () => {
  const firstMessageRef = useRef<HTMLDivElement | null>(null)
  const newestMessageRef = useRef<HTMLDivElement | null>(null)
  const [conversation, setConversation] = useState<ConversationDto | null>(null)
  const [conversationUsers, setConversationUsers] = useState<ConversationUsreDto[]>([])
  const [isChatFocused, setIsChatFocused] = useState(false)
  const [isInputFocused, setIsInputFocused] = useState(false)
  const { conversationId } = useParams()
  const [userInfo, setUserInfo] = useState<UserDto | null>(null)
  const [receivers, setReceivers] = useState<UserDto[]>([])
  const messageEndRef = useRef<HTMLDivElement | null>(null)
  const [text, setText] = useState('')
  const [skipMessages, setSkipMessages] = useState(0)
  const [takeMessages, setTakeMessages] = useState(20)
  const [messages, setMessages] = useState<MessageDto[]>([])
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagesPreview, setImagesPreview] = useState<string[]>([])

  const loadMoreMessage = () => {
    const firstVisible = firstMessageRef.current
    if (!firstVisible) return
    const oldTopId = firstVisible?.id
    setSkipMessages(skipMessages + 20)
    const element = document.getElementById(oldTopId || '')
    element?.scrollIntoView({ block: 'start' })
  }

  const handleSendMessage = () => {
    const sendMessageRequest: SendMessageRequest = {
      senderId: userInfo?.id || '',
      conversationId: conversationId || '',
      content: text
    }
    if (text.trim() !== '') {
      onSendMessage(sendMessageRequest)
      setText('')
    }
  }

  const onSendMessage = (sendMessageRequest: SendMessageRequest) => {
    chatService
      .onSendPrivateMessage(sendMessageRequest)
      .then((sendMessageReponse) => {
        if (!sendMessageReponse?.status) message.error(sendMessageReponse?.message)
        else setMessages([...messages, sendMessageReponse.newMessage])
      })
      .catch((err) => {
        message.error(err)
      })

    chatService.getUpdatedMessage((newestMessage: MessageDto) => {
      setMessages((prevMessages) =>
        prevMessages.map((m: MessageDto) =>
          m.id === newestMessage.id ? { ...m, ...(newestMessage as MessageDto) } : m
        )
      )
      const container = document.getElementById('scrollableDiv')
      if (container) {
        container.scrollTo({ top: 0, behavior: 'smooth' })
      }
    })
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
      message.error('Error while getting user infomation!')
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
      message.error('Error while getting conversation infomation!')
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
        const conversationUsersRes = response.data as ResponseHasData<ConversationUsreDto[]>
        setConversationUsers(conversationUsersRes.data as ConversationUsreDto[])
      }
    } catch (err) {
      message.error('Error while getting conversation infomation!')
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
      message.error('Error while getting receiver infomation!')
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
      message.error('Error while getting user infomation!')
    }
  }

  const handleImagesFileChange = (e: any) => {
    const selectedFiles: File[] = Array.from(e.target.files)
    setImageFiles(selectedFiles)

    const previewUrls = selectedFiles.map((file) => URL.createObjectURL(file))
    setImagesPreview(previewUrls)
  }

  useEffect(() => {
    if (!newestMessageRef.current) return
    if (document.visibilityState !== 'visible') return

    const textingArea = document.getElementById('scrollableDiv')
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (document.visibilityState !== 'visible') return
        console.log(isInputFocused)

        if (
          ((entry.isIntersecting && isChatFocused) || (entry.isIntersecting && isInputFocused)) &&
          messages[messages.length - 1].sender.id !== userInfo?.id
        ) {
          const updateMessageStatus = chatService.updateMessageStatus({
            messageId: messages[messages.length - 1].id,
            status: 'Seen'
          })
          if (!updateMessageStatus) return
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
        setMessages([...messages, newReceivedMessage])
        const updateMessageStatus = await chatService.updateMessageStatus({
          messageId: newReceivedMessage.id,
          status: 'Delivered'
        })
        if (!updateMessageStatus) return
      })
    })

    chatService.offReceivePrivateMessage()
  })

  useEffect(() => {
    fetchUserInfo()
    fetchConversation()

    const textingArea = document.getElementById('scrollableDiv')
    if (!textingArea) return
    textingArea.tabIndex = 0 // Biến div thành focusable

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
    if (conversation) {
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
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    fetchReceiversInfo()
  }, [conversation, conversationUsers])

  useEffect(() => {
    if (!text) return

    const timeout = setTimeout(() => {
      // Gọi update messageDraft
    }, 2000)

    return () => clearTimeout(timeout)
  }, [text])
  return (
    <div className='h-screen bg-[#212123] overflow-hidden'>
      <div className='flex h-[98%] bg-white rounded-[32px] m-[8px]'>
        <div className='w-[25%] m-[20px]'>
          <ConfigProvider
            theme={{
              components: {
                Input: {
                  activeBorderColor: 'none',
                  activeBg: 'transparent',
                  hoverBg: 'none',
                  hoverBorderColor: 'none',
                  activeShadow: '0 0 0 1px rgba(61, 61, 61, 0.14)'
                }
              }
            }}
          >
            <Input
              className='bg-[#ededf3]'
              size='large'
              placeholder='Search'
              prefix={<SearchOutlined className='text-lg' />}
            />
          </ConfigProvider>
        </div>
        <div className='w-[100%] m-[12px] flex flex-col justify-between'>
          {/* Header */}
          <div className='flex justify-between py-0 px-[16px]'>
            <div className='flex flex-col'>
              {conversationUsers.length !== 0 && conversation?.type === 'Personal' ? (
                <h3 className='text-xl font-medium'>
                  {conversationUsers.find((u) => u.userId !== userInfo?.id)?.nickName}
                </h3>
              ) : (
                <Skeleton active paragraph={{ rows: 0 }} />
              )}
              {conversationUsers.length !== 0 && conversation?.type === 'Personal' ? (
                <span className='text-xs opacity-50'>{receivers.find((u) => u.id !== userInfo?.id)?.status}</span>
              ) : (
                <Skeleton active paragraph={{ rows: 0 }} />
              )}
            </div>
            <div className='flex gap-[16px] items-center'>
              <SearchOutlined className='text-lg cursor-pointer' />
              <PhoneOutlined className='text-lg cursor-pointer' />
              <FontAwesomeIcon icon={faEllipsisVertical} className='text-lg cursor-pointer' />
            </div>
          </div>
          {/* Body */}

          <div id='scrollableDiv' className='h-[100%] overflow-y-auto flex flex-col-reverse'>
            <InfiniteScroll
              dataLength={messages.length}
              next={loadMoreMessage}
              hasMore={true}
              style={{ display: 'flex', flexDirection: 'column-reverse' }}
              inverse={true}
              loader={<div></div>}
              endMessage={<Divider plain>It is all, nothing more 🤐</Divider>}
              scrollableTarget='scrollableDiv'
            >
              <List
                className='overflow-y-auto'
                dataSource={messages}
                renderItem={(item, index) => {
                  const isMe = item.sender?.id == userInfo?.id
                  const isFirst = index === 18
                  return (
                    <div
                      id={`msg-${item.id}`}
                      ref={isFirst ? firstMessageRef : null}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end mb-[12px]`}
                      key={item.id}
                    >
                      {!isMe && (
                        <a href='#' className='mr-2'>
                          <Avatar src={item.sender?.avatarUrl}></Avatar>
                        </a>
                      )}
                      {item.status === 'Sent' && isMe && (
                        <ConfigProvider
                          theme={{
                            token: {
                              colorBgSpotlight: 'transparent',
                              colorTextLightSolid: '#8f8f8fff',
                              boxShadowSecondary: 'none'
                            }
                          }}
                        >
                          {index == messages.length - 1 && (
                            <Tooltip placement='left' title={item.status}>
                              <FontAwesomeIcon className='mr-[8px] mb-[6px] opacity-[0.4]' icon={faCheck} />
                            </Tooltip>
                          )}
                        </ConfigProvider>
                      )}
                      {item.status === 'Delivered' && isMe && (
                        <ConfigProvider
                          theme={{
                            token: {
                              colorBgSpotlight: 'transparent',
                              colorTextLightSolid: '#8f8f8fff',
                              boxShadowSecondary: 'none'
                            }
                          }}
                        >
                          {index == messages.length - 1 && (
                            <Tooltip placement='left' title={item.status}>
                              <FontAwesomeIcon className='mr-[8px] mb-[6px] opacity-[0.4]' icon={faCheckDouble} />
                            </Tooltip>
                          )}
                        </ConfigProvider>
                      )}
                      {item.status === 'Seen' && isMe && (
                        <ConfigProvider
                          theme={{
                            token: {
                              colorBgSpotlight: 'transparent',
                              colorTextLightSolid: '#8f8f8fff',
                              boxShadowSecondary: 'none'
                            }
                          }}
                        >
                          {index == messages.length - 1 && (
                            <Tooltip placement='left' title={item.status}>
                              {/* <Avatar size={16} src={receiverInfo?.avatarUrl}></Avatar> */}
                              <FontAwesomeIcon className='mr-[8px] mb-[6px] opacity-[0.4]' icon={faEye} />
                            </Tooltip>
                          )}
                        </ConfigProvider>
                      )}
                      <p
                        ref={index == messages.length - 1 ? newestMessageRef : null}
                        className={`${isMe ? 'bg-sky-400' : 'bg-gray-300'} p-[12px] rounded-[20px] max-w-[50%] break-all cursor-default`}
                      >
                        {item.content}
                      </p>
                      {isMe && (
                        <a href='#' className='ml-2'>
                          <Avatar src={userInfo?.avatarUrl}></Avatar>
                        </a>
                      )}
                      <div ref={messageEndRef}></div>
                    </div>
                  )
                }}
              />
            </InfiniteScroll>
          </div>
          <div>
            <Input
              className='p-[12px] rounded-[20px]'
              size='large'
              placeholder='Your message'
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              suffix={<SendOutlined className='cursor-pointer' />}
              prefix={
                <div>
                  <FontAwesomeIcon className='cursor-pointer' icon={faPaperclip} />
                  <label htmlFor='imageFileInput'>
                    <FontAwesomeIcon className='cursor-pointer' icon={faImage} />
                    <input id='imageFileInput' hidden type='file' multiple onChange={handleImagesFileChange} />
                  </label>
                </div>
              }
              value={text}
              onChange={(e) => setText(e.target.value)}
              onPressEnter={(e) => {
                e.preventDefault()
                handleSendMessage()
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Inbox
