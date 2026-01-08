import React from 'react'
import { Dropdown, Button, MenuProps, Avatar, message } from 'antd'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEllipsisVertical, faComment, faUserXmark, faBan } from '@fortawesome/free-solid-svg-icons'
import { ActionType } from '@/app/types/Common'
import { useNavigate } from 'react-router-dom'
import { UserDto } from '@/app/types/User/user.dto'
import { DEFAULT_AVATAR_URL } from '@/app/common/Assests/CommonVariable'
import { conversationService } from '@/app/services/conversation.service'
import { BaseResponse } from '@/app/types/Base/Responses/baseResponse'
import { ResponseHasData } from '@/app/types/Base/Responses/ResponseHasData'

interface FriendCardProps {
  friend: UserDto
  onAction: (type: ActionType, friend: UserDto) => void
}

const statusColor: { [key: string]: string } = {
  online: 'bg-green-500',
  offline: 'bg-gray-400',
  away: 'bg-yellow-500'
}

const FriendCard: React.FC<FriendCardProps> = ({ friend, onAction }) => {
  const navigate = useNavigate()
  const handleContactClick = async (friendId: string) => {
    try {
      const response = await conversationService.createConversation([friendId], 'Personal')
      if (response.status === 400) {
        const res = response.data as BaseResponse
        message.error(res.message)
      } else if (response.status === 200) {
        const res = response.data as ResponseHasData<string>
        navigate(`/Inbox/${res.data}`)
      }
    } catch (err) {
      console.log('Error: ', err)
      message.error('Cannot open conversation')
    }
  }
  const menuItems: MenuProps['items'] = [
    {
      key: 'message',
      icon: <FontAwesomeIcon icon={faComment} />,
      label: `Message`,
      onClick: () => handleContactClick(friend.id)
    },
    { type: 'divider' },
    {
      key: 'unfriend',
      icon: <FontAwesomeIcon icon={faUserXmark} />,
      label: 'Unfriend',
      danger: true,
      onClick: () => onAction('unfriend', friend)
    },
    {
      key: 'block',
      icon: <FontAwesomeIcon icon={faBan} />,
      label: 'Block',
      danger: true,
      onClick: () => onAction('block', friend)
    }
  ]

  return (
    <div className='flex items-center justify-between rounded-xl border border-gray-300 bg-white p-3 shadow-sm hover:shadow-md transition-all'>
      <div className='flex gap-3 items-center overflow-hidden'>
        <div className='relative flex-shrink-0'>
          <Avatar size={56} src={friend.avatarUrl || DEFAULT_AVATAR_URL} className='border border-gray-100' />
          <span
            className={`absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${statusColor[friend.status.toLowerCase() as keyof typeof statusColor] || 'bg-gray-400'}`}
          ></span>
        </div>

        <div className='overflow-hidden'>
          <h4
            className='font-bold text-gray-900 text-[15px] truncate m-0 hover:underline cursor-pointer'
            onClick={() => navigate(`/profile/${friend.userName}`)}
          >
            {friend.lastName} {friend.firstName}
          </h4>
          <p className='text-[12px] text-gray-500 m-0 capitalize'>{friend.status}</p>
        </div>
      </div>

      <Dropdown menu={{ items: menuItems }} trigger={['click']} placement='bottomRight'>
        <Button type='text' shape='circle' className='text-gray-400'>
          <FontAwesomeIcon icon={faEllipsisVertical} />
        </Button>
      </Dropdown>
    </div>
  )
}

export default FriendCard
