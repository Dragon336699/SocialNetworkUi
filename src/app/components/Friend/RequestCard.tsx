import { faCheck, faClock, faX } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button } from 'antd'

interface Request {
  id: number
  name: string
  avatar: string
  sentAt: string
}

interface RequestCardProps {
  request: Request
  type: 'sent' | 'received'
}

const RequestCard = ({ request, type }: RequestCardProps) => {
  return (
    <div className='flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-all hover:shadow-md'>
      <div className='flex items-center gap-4'>
        <img src={request.avatar || '/placeholder.svg'} alt={request.name} className='h-12 w-12 rounded-full' />

        <div>
          <h3 className='font-semibold text-foreground'>{request.name}</h3>

          <p className='flex items-center gap-1 text-sm text-muted-foreground'>
            <FontAwesomeIcon className='text-lg text-white' icon={faClock} />
            {request.sentAt}
          </p>
        </div>
      </div>

      <div className='flex items-center gap-2'>
        {type === 'received' ? (
          <>
            <Button type='primary' size='small' className='flex items-center gap-2'>
              <FontAwesomeIcon className='text-lg text-white' icon={faCheck} />
              Chấp nhận
            </Button>

            <Button type='default' size='small' className='flex items-center gap-2'>
              <FontAwesomeIcon className='text-lg text-white' icon={faX} />
              Từ chối
            </Button>
          </>
        ) : (
          <Button type='default' size='small' className='flex items-center gap-2'>
            <FontAwesomeIcon className='text-lg text-white' icon={faX} />
            Hủy lời mời
          </Button>
        )}
      </div>
    </div>
  )
}

export default RequestCard
