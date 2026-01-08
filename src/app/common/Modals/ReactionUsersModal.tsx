import React, { useState } from 'react'
import { Modal, Avatar, Tabs } from 'antd'
import { PostReactionDto } from '@/app/types/Post/Post'
import { useNavigate } from 'react-router-dom'

interface ReactionUsersModalProps {
  isOpen: boolean
  onClose: () => void
  reactions: PostReactionDto[]
  totalLiked: number
}

const reactionLabels: { [key: string]: string } = {
  '👍': 'Like',
  '❤️': 'Love',
  '😂': 'Haha',
  '😮': 'Wow',
  '😢': 'Sad',
  '😡': 'Angry'
}

const ReactionUsersModal: React.FC<ReactionUsersModalProps> = ({ isOpen, onClose, reactions, totalLiked }) => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<string>('all')

  const getFullName = (user: PostReactionDto['user']) => {
    if (!user) return 'User'
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User'
  }

  const handleUserClick = (userName?: string) => {
    if (userName) {
      onClose()
      navigate(`/profile/${userName}`)
    }
  }

  const groupedReactions = reactions.reduce(
    (acc, reaction) => {
      const emoji = reaction.reaction
      if (!acc[emoji]) {
        acc[emoji] = []
      }
      acc[emoji].push(reaction)
      return acc
    },
    {} as { [key: string]: PostReactionDto[] }
  )

  const availableReactions = Object.keys(groupedReactions)

  const filteredReactions = activeTab === 'all' ? reactions : groupedReactions[activeTab] || []

  const tabItems = [
    {
      key: 'all',
      label: (
        <div className='flex items-center gap-2 px-2'>
          <span className='font-semibold'>All</span>
          <span className='text-gray-500'>{totalLiked}</span>
        </div>
      )
    },
    ...availableReactions.map((emoji) => ({
      key: emoji,
      label: (
        <div className='flex items-center gap-1 px-2'>
          <span className='text-lg'>{emoji}</span>
          <span className='text-gray-500'>{groupedReactions[emoji].length}</span>
        </div>
      )
    }))
  ]

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      title={null}
      closable={true}
      width={480}
      centered
      className='reaction-users-modal'
      styles={{
        body: {
          padding: 0,
          height: '500px',
          overflow: 'hidden'
        },
        content: {
          height: '500px'
        }
      }}
    >
      <div className='flex flex-col h-full'>
        <div className='border-b flex-shrink-0'>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            className='reaction-tabs px-4'
            tabBarStyle={{ marginBottom: 0 }}
          />
        </div>

        <div className='overflow-y-auto flex-1 py-2'>
          {filteredReactions.length === 0 ? (
            <div className='text-center text-gray-500 py-8'>No reactions yet</div>
          ) : (
            filteredReactions.map((reaction) => (
              <div
                key={reaction.id}
                className='flex items-center justify-between px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors'
                onClick={() => handleUserClick((reaction.user as any)?.userName)}
              >
                <div className='flex items-center gap-3'>
                  <div className='relative'>
                    <Avatar src={reaction.user.avatarUrl} size={40} className='border-2 border-gray-200'>
                      {reaction.user.firstName?.[0] || reaction.user.lastName?.[0] || ''}
                    </Avatar>

                    <div className='absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-200'>
                      <span className='text-xs'>{reaction.reaction}</span>
                    </div>
                  </div>
                  <div>
                    <p className='font-semibold text-gray-900 text-sm hover:underline'>{getFullName(reaction.user)}</p>
                    <p className='text-xs text-gray-500'>{reactionLabels[reaction.reaction] || 'Reacted'}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  )
}

export default ReactionUsersModal
