import { chatService } from '@/app/services/chat.service'
import { useEffect, useRef, useState } from 'react'
import { Avatar, ConfigProvider, Divider, Input, List, message, Skeleton, Tooltip } from 'antd'
import { PhoneOutlined, SearchOutlined, SendOutlined } from '@ant-design/icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck, faCheckDouble, faEllipsisVertical, faPaperclip } from '@fortawesome/free-solid-svg-icons'
import { userService } from '@/app/services/user.service'
import { useParams } from 'react-router-dom'
import { messageService } from '@/app/services/message.service'
import { MessageDto } from '@/app/types/Message/messge.dto'
import { SendMessageRequest } from '@/app/types/Message/Requests/MessageReq'
import { BaseResponse } from '@/app/types/Base/Responses/baseResponse'
import { UserDto } from '@/app/types/User/user.dto'
import { ResponseHasData } from '@/app/types/Base/Responses/ResponseHasData'
import InfiniteScroll from 'react-infinite-scroll-component'

const Inbox: React.FC = () => {
  const firstMessageRef = useRef<HTMLDivElement | null>(null)
  const { receiverUserName } = useParams()
  const [userInfo, setUserInfo] = useState<UserDto | null>(null)
  const [receiverInfo, setReceiverInfo] = useState<UserDto | null>(null)
  const messageEndRef = useRef<HTMLDivElement | null>(null)
  const [text, setText] = useState('')
  const [skipMessages, setSkipMessages] = useState(0)
  const [takeMessages, setTakeMessages] = useState(20)
  const [messages, setMessages] = useState<MessageDto[]>([])

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
      receiverId: receiverInfo?.id || '',
      content: text
    }
    onSendMessage(sendMessageRequest)
    setText('')
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

  const fetchReceiverInfo = async () => {
    try {
      const response = await userService.getUserInfoByUserName(receiverUserName || '')
      if (response.status === 400) {
        const base = response.data as BaseResponse
        message.error(base.message)
      } else if (response.status === 200) {
        setReceiverInfo(response.data as UserDto)
      }
    } catch (err) {
      message.error('Error while getting receiver infomation!')
    }
  }

  const getMessages = async (firstTime: boolean) => {
    try {
      const response = await messageService.getMessages(
        userInfo?.id || '',
        receiverUserName || '',
        skipMessages,
        takeMessages
      )
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

  useEffect(() => {
    chatService.start().then(() => {
      chatService.onReceivePrivateMessage(async (newReceivedMessage) => {
        setMessages([...messages, newReceivedMessage])
        const updateMessageStatus = await chatService.acknowledgeMessage(newReceivedMessage.id)
        if (!updateMessageStatus) return
      })
    })

    chatService.offReceivePrivateMessage()
  })

  useEffect(() => {
    fetchUserInfo()
  }, [])

  useEffect(() => {
    if (receiverUserName) {
      fetchReceiverInfo()
    }
  }, [receiverUserName])

  useEffect(() => {
    if (userInfo && receiverUserName && receiverInfo) {
      if (skipMessages == 0) getMessages(true)
      else getMessages(false)
    }
  }, [userInfo, receiverInfo, receiverUserName, skipMessages])

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])
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
              {receiverInfo?.lastName !== undefined && receiverInfo?.firstName !== undefined ? (
                <h3 className='text-xl font-medium'>{receiverInfo?.lastName + ' ' + receiverInfo?.firstName}</h3>
              ) : (
                <Skeleton active paragraph={{ rows: 0 }} />
              )}
              {receiverInfo?.status !== undefined ? (
                <span className='text-xs opacity-50'>{receiverInfo?.status}</span>
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
                  const isMe = item.senderId == userInfo?.id
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
                          <Avatar src={receiverInfo?.avatarUrl}>K</Avatar>
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
                      <p
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
              suffix={<SendOutlined className='cursor-pointer' />}
              prefix={<FontAwesomeIcon className='cursor-pointer' icon={faPaperclip} />}
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
