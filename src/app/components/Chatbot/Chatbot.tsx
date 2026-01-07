import { useState, useRef, useEffect } from 'react'
import { MessageDto } from '../../types/Message/messge.dto'
import { UserDto } from '../../types/User/user.dto'
import { userService } from '../../services/user.service'
import { chatService } from '../../services/chat.service'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRobot } from '@fortawesome/free-solid-svg-icons'
import { BaseResponse } from '../../types/Base/Responses/baseResponse'

// Mock chatbot user data
const chatbotUser: UserDto = {
  id: 'chatbotUser',
  userName: 'Chatbot',
  email: 'bot@example.com',
  status: 'online',
  firstName: 'Chat',
  lastName: 'Bot',
  avatarUrl: '/public/vite.svg',
  gender: 'Other'
}

const BotTypingIndicator = () => (
  <div className='flex items-end gap-2 justify-start'>
    <img src={chatbotUser.avatarUrl || '/public/vite.svg'} alt='avatar' className='w-6 h-6 rounded-full' />
    <div className='max-w-xs lg:max-w-md px-3 py-2 rounded-xl bg-gray-200 text-gray-800 rounded-bl-none'>
      <div className='flex items-center justify-center space-x-1'>
        <div className='w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:-0.3s]'></div>
        <div className='w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:-0.15s]'></div>
        <div className='w-2 h-2 bg-gray-500 rounded-full animate-pulse'></div>
      </div>
    </div>
  </div>
)

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<MessageDto[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [loggedInUser, setLoggedInUser] = useState<UserDto | null>(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [isBotReplying, setIsBotReplying] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Welcome message on load
    setMessages([
      {
        id: 'welcome-msg',
        content: 'Hello! I am a chatbot. How can I help you today?',
        senderId: 'chatbotUser',
        sender: chatbotUser,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'sent',
        conversationId: 'chatbot-conversation',
        repliedMessageId: null,
        repliedMessage: null,
        messageReactionUsers: [],
        messageAttachments: []
      }
    ])

    const fetchUserInfo = async () => {
      try {
        const response = await userService.getUserInfoByToken()
        if (response.status === 200) {
          const userData = (response.data as BaseResponse).data
            ? ((response.data as BaseResponse).data as UserDto)
            : (response.data as UserDto)
          setLoggedInUser(userData)
        } else {
          console.error('Failed to fetch user info:', response)
          setLoggedInUser(null)
        }
      } catch (error) {
        console.error('Error fetching user info:', error)
        setLoggedInUser(null)
      } finally {
        setIsLoadingUser(false)
      }
    }
    fetchUserInfo()
  }, [])

  const toggleChatbot = () => {
    setIsOpen(!isOpen)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value)
  }

  const handleSendMessage = async () => {
    if (inputMessage.trim() === '' || !loggedInUser || isBotReplying) return

    const newMessage: MessageDto = {
      id: Math.random().toString(36).substr(2, 9),
      content: inputMessage,
      senderId: loggedInUser.id,
      sender: loggedInUser,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'sent',
      conversationId: 'chatbot-conversation',
      repliedMessageId: null,
      repliedMessage: null,
      messageReactionUsers: [],
      messageAttachments: []
    }

    setMessages((prevMessages) => [...prevMessages, newMessage])
    setInputMessage('')
    setIsBotReplying(true)

    try {
      const chatBotResponse = await chatService.askChatbot(newMessage.content)
      if (chatBotResponse.status === 200) {
        const botContent = chatBotResponse.data.data as string
        const botResponse: MessageDto = {
          id: Math.random().toString(36).substr(2, 9),
          content: botContent,
          senderId: 'chatbotUser',
          sender: chatbotUser,
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'sent',
          conversationId: 'chatbot-conversation',
          repliedMessageId: null,
          repliedMessage: null,
          messageReactionUsers: [],
          messageAttachments: []
        }
        setMessages((prevMessages) => [...prevMessages, botResponse])
      }
    } catch (err) {
      console.error(err)
      const errorResponse: MessageDto = {
        id: Math.random().toString(36).substr(2, 9),
        content: "Sorry, I'm having trouble connecting. Please try again later.",
        senderId: 'chatbotUser',
        sender: chatbotUser,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'sent',
        conversationId: 'chatbot-conversation',
        repliedMessageId: null,
        repliedMessage: null,
        messageReactionUsers: [],
        messageAttachments: []
      }
      setMessages((prevMessages) => [...prevMessages, errorResponse])
    } finally {
      setIsBotReplying(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage()
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className='fixed bottom-12 right-4 z-50'>
      {isOpen ? (
        <div className='w-80 sm:w-96 h-[500px] bg-white rounded-lg shadow-2xl flex flex-col border'>
          <div className='p-3 bg-gray-800 text-white rounded-t-lg flex justify-between items-center shadow-md'>
            <h3 className='font-bold text-lg'>Support Chat</h3>
            <button onClick={toggleChatbot} className='text-white hover:text-gray-300 text-2xl font-bold'>
              &times;
            </button>
          </div>
          <div className='flex-1 p-4 overflow-y-auto bg-gray-50 space-y-4' ref={messagesEndRef}>
            {isLoadingUser ? (
              <div className='text-center text-gray-500'>Loading user info...</div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2 ${loggedInUser && msg.senderId === loggedInUser.id ? 'justify-end' : 'justify-start'}`}
                  >
                    {(!loggedInUser || msg.senderId !== loggedInUser.id) && (
                      <img
                        src={msg.sender.avatarUrl || '/public/vite.svg'}
                        alt='avatar'
                        className='w-6 h-6 rounded-full'
                      />
                    )}
                    <div
                      className={`max-w-xs lg:max-w-md px-3 py-2 rounded-xl ${
                        loggedInUser && msg.senderId === loggedInUser.id
                          ? 'bg-gray-800 text-white rounded-br-none'
                          : 'bg-gray-200 text-gray-800 rounded-bl-none'
                      }`}
                    >
                      <p className='text-sm'>{msg.content}</p>
                    </div>
                  </div>
                ))}
                {isBotReplying && <BotTypingIndicator />}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className='p-3 border-t border-gray-200 bg-white'>
            <div className='flex items-center'>
              <input
                type='text'
                placeholder={
                  isLoadingUser
                    ? 'Loading...'
                    : loggedInUser
                      ? isBotReplying
                        ? 'Chatbot is typing...'
                        : 'Type a message...'
                      : 'Log in to chat...'
                }
                className='flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-800'
                value={inputMessage}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                disabled={isLoadingUser || !loggedInUser || isBotReplying}
              />
              <button
                className='ml-3 px-4 py-2 bg-gray-800 text-white rounded-full hover:bg-gray-700 focus:outline-none disabled:bg-gray-400'
                onClick={handleSendMessage}
                disabled={isLoadingUser || !loggedInUser || inputMessage.trim() === '' || isBotReplying}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={toggleChatbot}
          className='bg-gray-800 text-white w-16 h-16 rounded-full shadow-xl flex items-center justify-center hover:bg-gray-700 transition-transform transform hover:scale-110 focus:outline-none'
        >
          <FontAwesomeIcon icon={faRobot} />
        </button>
      )}
    </div>
  )
}

export default Chatbot
