import React from 'react'
import { Button, Card, Typography } from 'antd'
import { useNavigate } from 'react-router-dom'
import { getTimeAgo } from '@/app/helper'
import { SentFriendRequestData } from '@/app/types/UserRelation/userRelation'
import { DEFAULT_AVATAR_URL } from '@/app/common/Assests/CommonVariable'

const { Text } = Typography

interface RequestCardProps {
  request: SentFriendRequestData
  type: 'sent' | 'received'
  onConfirm?: (senderId: string, receiverId: string) => void
  onDelete?: (senderId: string, receiverId: string) => void
  loading?: boolean
}

const RequestCard: React.FC<RequestCardProps> = ({ request, type, onConfirm, onDelete, loading }) => {
  const navigate = useNavigate()
  const displayUser = request?.sender ?? request?.receiver

  return (
    <Card
      hoverable
      className='overflow-hidden rounded-xl border-gray-200 shadow-sm'
      bodyStyle={{ padding: window.innerWidth < 640 ? '8px' : '12px' }}
      cover={
        <div className='aspect-square w-full overflow-hidden bg-gray-100'>
          <img
            alt='avatar'
            src={displayUser.avatarUrl || DEFAULT_AVATAR_URL}
            className='h-full w-full object-cover transition-transform hover:scale-105'
            onClick={() => navigate(`/profile/${displayUser.userName}`)}
          />
        </div>
      }
    >
      <div className='mb-2 sm:mb-3'>
        <h4
          className='m-0 truncate font-bold text-[14px] sm:text-[16px] hover:underline cursor-pointer'
          onClick={() => navigate(`/profile/${displayUser.userName}`)}
        >
          {displayUser.lastName} {displayUser.firstName}
        </h4>
        <Text type='secondary' className='text-[10px] sm:text-[12px] block truncate'>
          {getTimeAgo(String(request.createdAt))}
        </Text>
      </div>

      <div className='flex flex-col gap-1.5 sm:gap-2'>
        {type === 'received' ? (
          <>
            <Button
              type='primary'
              block
              size='small'
              className='h-7 sm:h-9 text-[12px] sm:text-[14px] rounded-md'
              onClick={() => onConfirm?.(request.senderId, request.receiverId)}
              loading={loading}
            >
              Confirm
            </Button>
            <Button
              block
              size='small'
              className='bg-gray-200 border-none hover:bg-gray-300 h-7 sm:h-9 text-[12px] sm:text-[14px] rounded-md'
              onClick={() => onDelete?.(request.senderId, request.receiverId)}
              disabled={loading}
            >
              Delete
            </Button>
          </>
        ) : (
          <Button
            danger
            block
            size='small'
            className='h-7 sm:h-9 text-[12px] sm:text-[14px] rounded-md'
            onClick={() => onDelete?.(request.senderId, request.receiverId)}
            loading={loading}
          >
            Cancel
          </Button>
        )}
      </div>
    </Card>
  )
}

export default RequestCard
