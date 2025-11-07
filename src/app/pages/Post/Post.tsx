import React, { useState, useEffect } from 'react'
import { PostData, PostReactionDto } from '@/app/types/Post/Post'
import PostDropdownMenu from './PostDropdownMenu'
import ImageCarousel from './ImageCarousel'
import ImageModal from './ImageModal'
import EditPostModal from './EditPostModal'
import DeletePostModal from './DeletePostModal'
import PostReaction from './PostReaction'
import { message } from 'antd'
import { postService } from '@/app/services/post.service'
import { Avatar } from 'antd'

interface PostProps extends PostData {
  onToggleLike?: (postId: string) => void
  onPostUpdated?: (updatedPost: PostData) => void
  onPostDeleted?: (postId: string) => void
  currentUserId?: string
}

const Post: React.FC<PostProps> = ({
  id,
  content,
  totalLiked,
  totalComment,
  createdAt,
  user,
  postImages,
  postPrivacy = 'Public',
  postReactionUsers,
  onPostUpdated,
  onPostDeleted,
  currentUserId = ''
}) => {
  const [commentText, setCommentText] = useState('')
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [reactions, setReactions] = useState<PostReactionDto[]>(postReactionUsers)
  const [localTotalLiked, setLocalTotalLiked] = useState(totalLiked)

  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim()

  // Đồng bộ reactions và totalLiked từ props khi chúng thay đổi
  useEffect(() => {
    setReactions(postReactionUsers)
    setLocalTotalLiked(totalLiked)
  }, [postReactionUsers, totalLiked])

  // Xử lý gửi reaction cho bài viết
  const handleSendReaction = async (postId: string, reaction: string) => {
    try {
      const response = await postService.reactionPost(postId, reaction)
      if (response.message && response.message.includes('successfull')) {
        const currentUserReaction = reactions.find(r => r.userId === currentUserId)
        let newReactions: PostReactionDto[] = []
        let newTotalLiked = localTotalLiked

        if (currentUserReaction) {
          if (currentUserReaction.reaction === reaction) {
            newReactions = reactions.filter(r => r.userId !== currentUserId)
            newTotalLiked = Math.max(0, localTotalLiked - 1)
            setReactions(newReactions)
            setLocalTotalLiked(newTotalLiked)
          } else {
            newReactions = reactions.map(r => r.userId === currentUserId ? { ...r, reaction: reaction }: r)
            newTotalLiked = localTotalLiked
            setReactions(newReactions)
          }
        } else {
          const newReaction: PostReactionDto = {
            id: Date.now().toString(),
            userId: currentUserId,
            reaction: reaction,
            user: {
              id: currentUserId,
              firstName: user.firstName || '',
              lastName: user.lastName || '',
              avatarUrl: user.avatarUrl || ''
            }
          }
          newReactions = [...reactions, newReaction]
          newTotalLiked = localTotalLiked + 1
          setReactions(newReactions)
          setLocalTotalLiked(newTotalLiked)
        }

        if (onPostUpdated) {
          onPostUpdated({
            id,
            content,
            totalLiked: newTotalLiked,
            totalComment,
            createdAt,
            user,
            postImages,
            postPrivacy,
            postReactionUsers: newReactions
          } as PostData)
        }
      } else {
        message.error(response.message || 'Reaction failed')
      }
    } catch (error) {
      message.error('An error occurred while reacting')
    }
  }

  const handleEditPost = () => {
    setShowEditModal(true)
    setShowDropdown(false)
  }

  const handleSavePost = (updatedPostData: any) => {
    onPostUpdated?.(updatedPostData)
    setShowEditModal(false)
  }

  const handleDeleteClick = () => {
    setShowDeleteModal(true)
  }

  const handleDeleteSuccess = () => {
    onPostDeleted?.(id)
    setShowDeleteModal(false)
  }

  const handleDropdownActions = {
    onEdit: handleEditPost,
    onDeleteClick: handleDeleteClick,
    onDeleteSuccess: handleDeleteSuccess
  }

  const getTimeAgo = (dateString: string) => {
    let normalizedDateString = dateString
    if (!dateString.includes('Z') && !dateString.includes('+') && !dateString.includes('-', 10)) {
      normalizedDateString = dateString + 'Z'
    }

    const postTime = new Date(normalizedDateString)
    const now = new Date()

    if (isNaN(postTime.getTime())) {
      return 'Invalid time'
    }

    const diffInMs = now.getTime() - postTime.getTime()

    const diffInSeconds = Math.floor(diffInMs / 1000)
    const diffInMinutes = Math.floor(diffInSeconds / 60)
    const diffInHours = Math.floor(diffInMinutes / 60)
    const diffInDays = Math.floor(diffInHours / 24)
    const diffInWeeks = Math.floor(diffInDays / 7)
    const diffInMonths = Math.floor(diffInDays / 30)
    const diffInYears = Math.floor(diffInDays / 365)

    if (diffInSeconds < 60) {
      return 'Vừa xong'
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} phút trước`
    } else if (diffInHours < 24) {
      return `${diffInHours} giờ trước`
    } else if (diffInDays < 7) {
      return `${diffInDays} ngày trước`
    } else if (diffInWeeks < 4) {
      return `${diffInWeeks} tuần trước`
    } else if (diffInMonths < 12) {
      return `${diffInMonths} tháng trước`
    } else {
      return `${diffInYears} năm trước`
    }
  }

  const renderPrivacyIcon = () => {
    const iconClass = 'w-3.5 h-3.5 text-gray-500'

    switch (postPrivacy) {
      case 'Public':
        return (
          <svg className={iconClass} fill='currentColor' viewBox='0 0 20 20'>
            <path
              fillRule='evenodd'
              d='M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0710 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z'
              clipRule='evenodd'
            />
          </svg>
        )
      case 'Friends':
        return (
          <svg className={iconClass} fill='currentColor' viewBox='0 0 20 20'>
            <path d='M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z' />
          </svg>
        )
      case 'Private':
        return (
          <svg className={iconClass} fill='currentColor' viewBox='0 0 20 20'>
            <path
              fillRule='evenodd'
              d='M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z'
              clipRule='evenodd'
            />
          </svg>
        )
      default:
        return null
    }
  }

  const goToPrevious = () => {
    setCurrentImageIndex(prev => prev === 0 ? (postImages?.length || 1) - 1 : prev - 1)
  }

  const goToNext = () => {
    setCurrentImageIndex(prev => prev === (postImages?.length || 1) - 1 ? 0 : prev + 1)
  }

  const goToImage = (index: number) => {
    setCurrentImageIndex(index)
  }

  const handleModalPrevious = () => {
    if (selectedImageIndex !== null && selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1)
    }
  }

  const handleModalNext = () => {
    if (selectedImageIndex !== null && postImages && selectedImageIndex < postImages.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1)
    }
  }

  return (
    <>
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 mb-4'>
        {/* Header */}
        <div className='flex items-center justify-between p-4 pb-2'>
          <div className='flex items-center space-x-3'>
            <Avatar
              src={user.avatarUrl}
              size={40}
              className='w-10 h-10 rounded-full object-cover'
              style={{ minWidth: 40, minHeight: 40 }}
            >
              {user.firstName?.[0] || user.lastName?.[0] || ''}
            </Avatar>
            <div>
              <h4 className='font-semibold text-black-600 text-sm hover:underline cursor-pointer'>{fullName}</h4>
              <div className='flex items-center space-x-1'>
                <span className='text-xs text-gray-500'>{getTimeAgo(createdAt)}</span>
                <span className='text-[8px] text-gray-400'>•</span>
                {renderPrivacyIcon()}
              </div>
            </div>
          </div>
          <div className='relative'>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className='text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100'
            >
              <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
                <path d='M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z' />
              </svg>
            </button>
            <PostDropdownMenu
              isOpen={showDropdown}
              onClose={() => setShowDropdown(false)}
              postId={id}
              {...handleDropdownActions}
            />
          </div>
        </div>

        {/* Content */}
        <div className='px-4 pb-2'>
          <p className='text-gray-800 text-sm leading-relaxed'>{content}</p>
        </div>

        {/* Image Carousel */}
        {postImages && (
          <ImageCarousel
            postImages={postImages}
            currentImageIndex={currentImageIndex}
            onImageClick={setSelectedImageIndex}
            onPrevious={goToPrevious}
            onNext={goToNext}
            onGoToImage={goToImage}
          />
        )}

        {/* Actions */}
        <div className='border-t border-gray-100 px-4 py-3'>
          {reactions.length > 0 && (
            <div className='flex items-center gap-2 mb-3 text-sm text-gray-600'>
              {/* Top reactions icons */}
              <div className='flex items-center -space-x-1'>
                {reactions.slice(0, 3).map((reaction, index) => (
                  <div
                    key={index}
                    className='w-5 h-5 bg-white rounded-full border border-gray-200 flex items-center justify-center text-xs shadow-sm'
                    style={{ zIndex: 3 - index }}
                  >
                    {reaction.reaction}
                  </div>
                ))}
              </div>

              {/* Names and count */}
              <span className='text-sm cursor-pointer'>{reactions.length}</span>
            </div>
          )}

          <div className='flex items-center justify-between space-x-6 mb-3'>
            <PostReaction
              postId={id}
              reactions={reactions}
              onSendReaction={handleSendReaction}
              currentUserId={currentUserId}
              totalLiked={localTotalLiked}
            />
            <button className='flex items-center space-x-2 px-2 py-1 rounded-md text-sm text-gray-600 hover:bg-gray-100 transition-colors'>
              <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
                />
              </svg>
              <span className='font-medium'>Comment</span>
            </button>

            <button className='flex items-center space-x-2 px-2 py-1 rounded-md text-sm text-gray-600 hover:bg-gray-100 transition-colors'>
              <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z'
                />
              </svg>
              <span className='font-medium'>Share</span>
            </button>
          </div>

          {/* Comment input */}
          {/* <div className='flex items-center space-x-2'>
            <img
              src={user.avatarUrl || '/default-avatar.png'}
              alt='Your avatar'
              className='w-8 h-8 rounded-full object-cover'
            />
            <div className='flex-1 flex items-center bg-gray-50 rounded-full px-4 py-2'>
              <input
                type='text'
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder='Write your comment'
                className='flex-1 bg-transparent text-sm outline-none placeholder-gray-500'
              />
            </div>
          </div> */}
        </div>
      </div>

      {/* Image Modal */}
      {postImages && (
        <ImageModal
          postImages={postImages}
          selectedImageIndex={selectedImageIndex}
          onClose={() => setSelectedImageIndex(null)}
          onPrevious={handleModalPrevious}
          onNext={handleModalNext}
        />
      )}

      {/* Edit Post Modal */}
      <EditPostModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        postId={id}
        onSave={handleSavePost}
      />

      {/* Delete Post Modal */}
      <DeletePostModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onDeleteSuccess={handleDeleteSuccess}
        postId={id}
      />
    </>
  )
}

export default Post