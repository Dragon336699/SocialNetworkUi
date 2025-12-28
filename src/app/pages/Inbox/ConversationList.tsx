import { Avatar, ConfigProvider, Input, Skeleton } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPenToSquare } from '@fortawesome/free-solid-svg-icons'
import { ConversationDto } from '@/app/types/Conversation/conversation.dto'
import { UserDto } from '@/app/types/User/user.dto'
import { DEFAULT_AVATAR_URL } from '@/app/common/Assests/CommonVariable'

interface ConversationListProps {
  conversations: ConversationDto[]
  userInfo: UserDto | null
  conversationId?: string
  onNewMessageClick: () => void
  onConversationClick: (id: string) => void
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  userInfo,
  conversationId,
  onNewMessageClick,
  onConversationClick
}) => {
  return (
    <div className='w-[15%] min-w-[280px] p-[20px] border-r border-gray-100'>
      <div className='flex justify-between items-center mb-4'>
        <h2 className='text-2xl font-semibold'>Chats</h2>
        <FontAwesomeIcon
          onClick={onNewMessageClick}
          className='cursor-pointer text-gray-600 hover:text-gray-800 text-lg'
          icon={faPenToSquare}
        />
      </div>
      <ConfigProvider
        theme={{
          components: {
            Input: {
              activeBorderColor: 'none',
              activeBg: 'transparent',
              hoverBg: 'none',
              hoverBorderColor: 'none',
              activeShadow: '0 0 0 1px rgba(61, 61, 61, 0.14)',
              borderRadius: 24
            }
          }
        }}
      >
        <Input
          className='bg-[#ededf3]'
          size='large'
          placeholder='Search in chats'
          prefix={<SearchOutlined className='text-lg' />}
        />
      </ConfigProvider>
      <div className='mt-4 flex flex-col gap-3 overflow-y-auto max-h-[calc(100vh-250px)]'>
        {conversations.length === 0
          ? Array.from({ length: 10 }).map((_, i) => (
              <Skeleton className='mb-3' key={i} active avatar paragraph={{ rows: 1 }} />
            ))
          : conversations.map((conversation) => {
              const seenByMe =
                conversation.newestMessage?.senderId !== userInfo?.id &&
                conversation.newestMessage?.status !== 'Seen'
                  ? false
                  : true

              return (
                <div
                  key={conversation.id}
                  onClick={() => onConversationClick(conversation.id)}
                  className={`flex items-center gap-3 cursor-pointer hover:bg-gray-50 ${
                    conversation.id.toLowerCase() === conversationId?.toLowerCase() ? 'bg-gray-50' : ''
                  } rounded-[12px] py-[12px] px-[16px] transition-colors`}
                >
                  {conversation && conversation.type === 'Personal' ? (
                    <Avatar
                      draggable='false'
                      className='select-none border-2 border-gray-200'
                      size={42}
                      src={conversation.conversationUsers[0]?.user.avatarUrl || DEFAULT_AVATAR_URL}
                    />
                  ) : (
                    <Avatar.Group>
                      <Avatar
                        draggable='false'
                        className='select-none border-2 border-gray-200'
                        size={40}
                        src={conversation.conversationUsers[0]?.user.avatarUrl || DEFAULT_AVATAR_URL}
                      />
                      <Avatar
                        draggable='false'
                        className='select-none border-2 border-gray-200'
                        size={40}
                        src={conversation.conversationUsers[1]?.user.avatarUrl || DEFAULT_AVATAR_URL}
                      />
                    </Avatar.Group>
                  )}
                  <div className='flex flex-col justify-around overflow-hidden flex-1'>
                    <p className={`text-base font-medium select-none truncate ${seenByMe ? '' : 'font-semibold'}`}>
                      {conversation.type === 'Personal'
                        ? conversation.conversationUsers[0]?.nickName
                        : conversation.conversationName}
                    </p>
                    <span
                      className={`text-sm truncate select-none ${seenByMe ? 'text-gray-500' : 'font-medium text-gray-900'}`}
                    >
                      {conversation.newestMessage?.senderId.toLowerCase() === userInfo?.id.toLowerCase() &&
                      (!conversation.newestMessage?.messageAttachments ||
                        conversation.newestMessage.messageAttachments.length === 0)
                        ? 'You: '
                        : ''}
                      {conversation.newestMessage?.content === ''
                        ? conversation.newestMessage.sender.firstName + ' sent attachments'
                        : conversation.newestMessage?.content}
                    </span>
                  </div>
                  {!seenByMe && <div className='text-blue-500 text-sm font-medium'>●</div>}
                </div>
              )
            })}
      </div>
    </div>
  )
}

export default ConversationList