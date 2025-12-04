import React from 'react'
import { Button } from 'antd'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck, faClock, faXmark } from '@fortawesome/free-solid-svg-icons'
import { Friend } from '@/app/types/Common'
import { useNavigate } from 'react-router-dom'

interface RequestCardProps {
  friend: Friend & { sentAt?: string }
  type: 'sent' | 'received'
  onConfirm?: (id: number) => void
  onDelete?: (id: number) => void
  loading?: boolean
}

const RequestCard: React.FC<RequestCardProps> = ({ friend, type, onConfirm, onDelete, loading }) => {
  const navigate = useNavigate()
  return (
    <div className='flex items-center justify-between rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-blue-100'>
      <div className='flex items-center gap-4'>
        <img
          src={friend.avatar || '/placeholder.svg'}
          alt={friend.name}
          className='h-14 w-14 rounded-full object-cover border border-gray-200'
        />

        <div>
          <h3
            className='font-semibold text-gray-900 text-base hover:underline hover:cursor-pointer'
            onClick={() => navigate(`/profile/${friend.name}`)}
          >
            {friend.name}
          </h3>

          {friend.sentAt && (
            <p className='flex items-center gap-1.5 text-xs text-gray-500 mt-1'>
              <FontAwesomeIcon icon={faClock} />
              {friend.sentAt}
            </p>
          )}
        </div>
      </div>

      <div className='flex items-center gap-2'>
        {type === 'received' ? (
          <>
            <Button
              type='primary'
              className='flex items-center gap-2 bg-blue-600 hover:bg-blue-700'
              onClick={() => onConfirm?.(friend.id)}
              loading={loading}
            >
              <FontAwesomeIcon icon={faCheck} />
              Confirm
            </Button>

            <Button
              type='default'
              className='flex items-center gap-2 bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-200'
              onClick={() => onDelete?.(friend.id)}
              disabled={loading}
            >
              <FontAwesomeIcon icon={faXmark} />
              Delete
            </Button>
          </>
        ) : (
          <Button
            danger
            type='default'
            className='flex items-center gap-2 hover:bg-red-50'
            onClick={() => onDelete?.(friend.id)}
            loading={loading}
          >
            <FontAwesomeIcon icon={faXmark} />
            Cancel Request
          </Button>
        )}
      </div>
    </div>
  )
}

export default RequestCard
