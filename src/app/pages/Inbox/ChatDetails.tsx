import { Image, Spin } from 'antd'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { ConversationDto } from '@/app/types/Conversation/conversation.dto'
import { useState, useEffect, useCallback } from 'react'
import { messageService } from '@/app/services/message.service'
import { MessageAttachment } from '@/app/types/MessageAttachment/messageAttachment.dto'

interface ChatDetailsProps {
  conversation: ConversationDto | null
  conversationId?: string
}

const ChatDetails: React.FC<ChatDetailsProps> = ({ conversation, conversationId }) => {
  const [showAllMedia, setShowAllMedia] = useState(false)
  const [allSharedMedia, setAllSharedMedia] = useState<MessageAttachment[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [skip, setSkip] = useState(0)
  const take = 20

  // Fetch images from API
  const fetchImageAttachments = useCallback(async (isLoadMore: boolean = false) => {
    if (!conversationId) return
    
    setLoading(true)
    try {
      const currentSkip = isLoadMore ? skip : 0
      const response = await messageService.getImageAttachments(conversationId, currentSkip, take)
      
      if (response.status === 200) {
        const data = response.data as { data: MessageAttachment[], message: string }
        const newImages: MessageAttachment[] = Array.isArray(data.data) ? data.data : []
        
        if (newImages.length < take) {
          setHasMore(false)
        }
        
        if (isLoadMore) {
          setAllSharedMedia((prev: MessageAttachment[]) => [...prev, ...newImages])
        } else {
          setAllSharedMedia(newImages)
        }
        
        if (isLoadMore) {
          setSkip(prev => prev + take)
        }
      }
    } catch (error) {
      console.error('Failed to fetch image attachments:', error)
    } finally {
      setLoading(false)
    }
  }, [conversationId, skip, take])

  // Fetch images when conversation changes
  useEffect(() => {
    if (conversationId) {
      setAllSharedMedia([])
      setSkip(0)
      setHasMore(true)
      fetchImageAttachments(false)
    }
  }, [conversationId])

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      setSkip(prev => prev + take)
      fetchImageAttachments(true)
    }
  }

  // Show only 6 images initially, or all if showAllMedia is true
  const displayedMedia = showAllMedia ? allSharedMedia : allSharedMedia.slice(0, 6)
  const hasMoreMedia = allSharedMedia.length > 6 || hasMore

  return (
    <div className='w-[15%] min-w-[280px] bg-white overflow-y-auto p-6 border-l border-gray-100 h-full flex flex-col'>
      {/* Header */}
      <div className='mb-6 flex-shrink-0'>
        <h3 className='text-lg font-semibold'>Chat details</h3>
      </div>

      {/* Shared media section */}      {(allSharedMedia.length > 0 || loading) && (
        <div className='mb-6 flex-1 overflow-y-auto'>
          <div className='flex justify-between items-center mb-4'>
            <h4 className='text-base font-medium text-gray-900'>
              File Images {allSharedMedia.length > 0 && `(${allSharedMedia.length})`}
            </h4>
          </div>
          
          {/* Loading indicator */}
          {loading && allSharedMedia.length === 0 && (
            <div className='flex justify-center py-4'>
              <Spin size='small' />
            </div>
          )}
          
          {/* Image Grid - 2 columns */}
          <div className='grid grid-cols-2 gap-2'>
            {displayedMedia.map((media, index) => (
              <Image
                key={media.id || index}
                src={media.fileUrl}
                alt={`media-${index}`}
                className='rounded-lg object-cover'
                width='100%'
                height={120}
                style={{ objectFit: 'cover' }}
              />
            ))}
          </div>

          {/* View More / Load More Button */}
          {hasMoreMedia && (
            <button
              onClick={() => {
                if (!showAllMedia) {
                  setShowAllMedia(true)
                  // Load more from API if we're showing all but have more to load
                  if (hasMore && !loading) {
                    handleLoadMore()
                  }
                } else {
                  // If showing all and has more from API, load more
                  if (hasMore && !loading) {
                    handleLoadMore()
                  } else {
                    setShowAllMedia(false)
                  }
                }
              }}
              disabled={loading}
              className='w-full mt-3 py-2 text-xs text-gray-600 hover:bg-gray-100 hover:text-gray-800 rounded-lg transition-colors flex items-center justify-center gap-2 border border-gray-200 disabled:opacity-50'
            >
              {loading ? (
                <Spin size='small' />
              ) : showAllMedia && !hasMore ? (
                <>
                  <span>Show less</span>
                  <FontAwesomeIcon icon={faChevronDown} className='text-xs rotate-180' />
                </>
              ) : (
                <>
                  <span>{showAllMedia && hasMore ? 'Load more' : `View more`}</span>
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