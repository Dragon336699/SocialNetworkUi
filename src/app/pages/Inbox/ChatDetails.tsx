import { Image } from 'antd'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown, faChevronRight } from '@fortawesome/free-solid-svg-icons'
import { ConversationDto } from '@/app/types/Conversation/conversation.dto'
import { MessageDto } from '@/app/types/Message/messge.dto'
import { useState } from 'react'

interface ChatDetailsProps {
  conversation: ConversationDto | null
  messages: MessageDto[]
}

const ChatDetails: React.FC<ChatDetailsProps> = ({ conversation, messages }) => {
  const [showAllMedia, setShowAllMedia] = useState(false)

  // Extract shared media (images) - get images from recent messages
  const allSharedMedia: any[] = []

  // Loop through messages from newest to oldest
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i]
    if (msg.messageAttachments && msg.messageAttachments.length > 0) {
      const imageAttachments = msg.messageAttachments.filter(att => att.fileType === 'Image')
      for (const att of imageAttachments) {
        allSharedMedia.push(att)
      }
    }
  }

  // Show only 6 images initially, or all if showAllMedia is true
  const displayedMedia = showAllMedia ? allSharedMedia : allSharedMedia.slice(0, 6)
  const hasMoreMedia = allSharedMedia.length > 6

  return (
    <div className='w-[15%] min-w-[280px] bg-white overflow-y-auto p-6 border-l border-gray-100 h-full flex flex-col'>
      {/* Header */}
      <div className='mb-6 flex-shrink-0'>
        <h3 className='text-lg font-semibold'>Chat details</h3>
      </div>

      {/* Shared media section */}
      {allSharedMedia.length > 0 && (
        <div className='mb-6 flex-1 overflow-y-auto'>
          <div className='flex justify-between items-center mb-4'>
            <h4 className='text-base font-medium text-gray-900'>
              File Images
            </h4>
          </div>
          
          {/* Image Grid - 2 columns */}
          <div className='grid grid-cols-2 gap-2'>
            {displayedMedia.map((media, index) => (
              <Image
                key={index}
                src={media.fileUrl}
                alt={`media-${index}`}
                className='rounded-lg object-cover'
                width='100%'
                height={120}
                style={{ objectFit: 'cover' }}
              />
            ))}
          </div>

          {/* View More Button */}
          {hasMoreMedia && (
            <button
              onClick={() => setShowAllMedia(!showAllMedia)}
              className='w-full mt-3 py-2 text-xs text-gray-600 hover:bg-gray-100 hover:text-gray-800 rounded-lg transition-colors flex items-center justify-center gap-2 border border-gray-200'
            >
              {showAllMedia ? (
                <>
                  <span>Show less</span>
                  <FontAwesomeIcon icon={faChevronDown} className='text-xs rotate-180' />
                </>
              ) : (
                <>
                  <span>View more ({allSharedMedia.length - 6})</span>
                  <FontAwesomeIcon icon={faChevronDown} className='text-xs' />
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Empty state when no conversation selected */}
      {!conversation && (
        <div className='flex items-center justify-center h-full text-gray-400'>
          <p className='text-sm text-center'>Select a conversation to view details</p>
        </div>
      )}

      {/* Empty state when no media */}
      {conversation && allSharedMedia.length === 0 && (
        <div className='flex items-center justify-center py-8 text-gray-400'>
          <p className='text-sm text-center'>No shared media yet</p>
        </div>
      )}
    </div>
  )
}

export default ChatDetails