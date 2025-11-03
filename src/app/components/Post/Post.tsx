import React, { useState } from 'react'
import { PostData } from '@/app/types/Post/Post'

interface PostProps extends PostData {
  onToggleLike?: (postId: string) => void
}

const Post: React.FC<PostProps> = ({
  id,
  content,
  totalLiked,
  totalComment,
  createdAt,
  user,
  postImages,
  isLikedByCurrentUser = false,
  postPrivacy = 'Public',
  onToggleLike
}) => {
  const [commentText, setCommentText] = useState('')
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim()

  // Hàm tính thời gian đăng bài
  const getTimeAgo = (dateString: string) => {
    let normalizedDateString = dateString
    // Kiểm tra nếu không có timezone info thì thêm 'Z' (UTC)
    if (!dateString.includes('Z') && !dateString.includes('+') && !dateString.includes('-', 10)) {
      normalizedDateString = dateString + 'Z'
    }

    const postTime = new Date(normalizedDateString)
    const now = new Date()

    if (isNaN(postTime.getTime())) {
      return 'Invalid time'
    }

    // Tính chênh lệch thời gian bằng mili giây
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

  // Hiển thị biểu tượng quyền riêng tư
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

  // Hiển thị băng chuyền ảnh
  const renderImages = () => {
    if (!postImages || postImages.length === 0) return null

    const imageCount = postImages.length

    // CÁC HÀM ĐIỀU HƯỚNG BĂNG CHUYỀN
    const goToPrevious = () => {
      setCurrentImageIndex(prev => prev === 0 ? imageCount - 1 : prev - 1)
    }

    const goToNext = () => {
      setCurrentImageIndex(prev => prev === imageCount - 1 ? 0 : prev + 1)
    }

    const goToImage = (index: number) => {
      setCurrentImageIndex(index)
    }

    return (
      <div className='px-4 pb-3'>
        <div className='relative bg-gray-100 rounded-lg overflow-hidden'>
          {/* HIỂN THỊ ẢNH CHÍNH */}
          <div className='relative h-64 md:h-80'>
            <img
              src={postImages[currentImageIndex].imageUrl}
              alt={`Post content ${currentImageIndex + 1}`}
              className='w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity'
              onClick={() => setSelectedImageIndex(currentImageIndex)}
            />

            {/*MŨI TÊN ĐIỀU HƯỚNG */}
            {imageCount > 1 && (
              <>
                {currentImageIndex > 0 && (
                  <button
                    onClick={goToPrevious}
                    className='absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2 transition-colors'
                  >
                    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M15 19l-7-7 7-7' />
                    </svg>
                  </button>
                )}

                {currentImageIndex < imageCount - 1 && (
                  <button
                    onClick={goToNext}
                    className='absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2 transition-colors'
                  >
                    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M9 5l7 7-7 7' />
                    </svg>
                  </button>
                )}
              </>
            )}
          </div>

          {/* CHẤM THUMBNAIL */}
          {imageCount > 1 && (
            <div className='absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2'>
              {postImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToImage(index)}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50 hover:bg-opacity-70'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // MODAL XEM ẢNH LỚN
  const renderImageModal = () => {
    if (selectedImageIndex === null || !postImages) return null
    // Xử lý sự kiện phím
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedImageIndex(null)
      } else if (e.key === 'ArrowLeft' && selectedImageIndex > 0) {
        setSelectedImageIndex(selectedImageIndex - 1)
      } else if (e.key === 'ArrowRight' && selectedImageIndex < postImages.length - 1) {
        setSelectedImageIndex(selectedImageIndex + 1)
      }
    }

    return (
      <div
        className='fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50'
        onClick={() => setSelectedImageIndex(null)}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        <div className='relative max-w-5xl max-h-full p-4'>
          <img
            src={postImages[selectedImageIndex].imageUrl}
            alt={`Post content ${selectedImageIndex + 1}`}
            className='max-w-full max-h-full object-contain rounded-lg'
            onClick={(e) => e.stopPropagation()}
          />
          {/* Nút đóng */}
          <button
            onClick={() => setSelectedImageIndex(null)}
            className='absolute -top-2 -right-2 text-white bg-red-500 hover:bg-red-600 rounded-full p-2 transition-colors shadow-lg'
          >
            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M6 18L18 6M6 6l12 12' />
            </svg>
          </button>

          {/* Mũi tên điều hướng */}
          {postImages.length > 1 && (
            <>
              {selectedImageIndex > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedImageIndex(selectedImageIndex - 1)
                  }}
                  className='absolute left-4 top-1/2 transform -translate-y-1/2 text-white bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full p-3 transition-colors shadow-lg'
                >
                  <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M15 19l-7-7 7-7' />
                  </svg>
                </button>
              )}

              {selectedImageIndex < postImages.length - 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedImageIndex(selectedImageIndex + 1)
                  }}
                  className='absolute right-4 top-1/2 transform -translate-y-1/2 text-white bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full p-3 transition-colors shadow-lg'
                >
                  <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M9 5l7 7-7 7' />
                  </svg>
                </button>
              )}
            </>
          )}

          {/* Bộ đếm ảnh */}
          <div className='absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-70 px-4 py-2 rounded-full text-sm font-medium'>
            {selectedImageIndex + 1} / {postImages.length}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 mb-4 overflow-hidden'>
        {/* Header */}
        <div className='flex items-center justify-between p-4 pb-2'>
          <div className='flex items-center space-x-3'>
            <img
              src={user.avatar || '/default-avatar.png'}
              alt={fullName}
              className='w-10 h-10 rounded-full object-cover'
            />
            <div>
              <h4 className='font-semibold text-black-600 text-sm hover:underline cursor-pointer'>{fullName}</h4>
              <div className='flex items-center space-x-1'>
                <span className='text-xs text-gray-500'>{getTimeAgo(createdAt)}</span>
                <span className='text-[8px] text-gray-400'>•</span>
                {renderPrivacyIcon()}
              </div>
            </div>
          </div>
          <button className='text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100'>
            <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
              <path d='M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z' />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className='px-4 pb-2'>
          <p className='text-gray-800 text-sm leading-relaxed'>{content}</p>
        </div>

        {/* BĂNG CHUYỀN ẢNH */}
        {renderImages()}

        {/* Actions */}
        <div className='border-t border-gray-100 px-4 py-3'>
          <div className='flex items-center space-x-6 mb-3'>
            <button
              onClick={() => onToggleLike?.(id)}
              className={`flex items-center space-x-2 text-sm transition-colors ${
                isLikedByCurrentUser ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
              }`}
            >
              <svg
                className='w-5 h-5'
                fill={isLikedByCurrentUser ? 'currentColor' : 'none'}
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z'
                />
              </svg>
              <span className='font-medium'>{totalLiked}</span>
            </button>

            <button className='flex items-center space-x-2 text-sm text-gray-500 hover:text-blue-500 transition-colors'>
              <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
                />
              </svg>
              <span className='font-medium'>{totalComment}</span>
            </button>

            <button className='flex items-center space-x-2 text-sm text-gray-500 hover:text-green-500 transition-colors'>
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

          {/* Ô nhập bình luận */}
          <div className='flex items-center space-x-2'>
            <img
              src={user.avatar || '/default-avatar.png'}
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
          </div>
        </div>
      </div>

      {/* Modal xem ảnh lớn */}
      {renderImageModal()}
    </>
  )
}

export default Post