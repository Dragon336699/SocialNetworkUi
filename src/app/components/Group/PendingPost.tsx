import React, { useState } from 'react'
import { Avatar, Tag, Popconfirm } from 'antd'
import {
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  GlobalOutlined,
  LockOutlined
} from '@ant-design/icons'
import { PostData } from '@/app/types/Post/Post'
import { getTimeAgo } from '@/app/helper'
import { useNavigate } from 'react-router-dom'
import ImageCarousel from '@/app/pages/Post/ImageCarousel'
import ImageModal from '@/app/pages/Post/ImageModal'

interface PendingPostProps {
  post: PostData
  mode: 'admin' | 'user'
  onApprove?: (postId: string) => Promise<void>
  onReject?: (postId: string) => Promise<void>
  onCancel?: (postId: string) => Promise<void>
  actionLoading?: string
}

const PendingPost: React.FC<PendingPostProps> = ({ post, mode, onApprove, onReject, onCancel, actionLoading = '' }) => {
  const navigate = useNavigate()
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const { id, content, createdAt, user, postImages, group } = post
  const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Unknown User'
  const isLoading = actionLoading === id

  const handleUserClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (user?.userName) {
      navigate(`/profile/${user.userName}`)
    }
  }

  const goToPrevious = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? (postImages?.length || 1) - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentImageIndex((prev) => (prev === (postImages?.length || 1) - 1 ? 0 : prev + 1))
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

  const renderPrivacyIcon = () => {
    if (group) {
      return group.isPublic ? (
        <GlobalOutlined className='text-gray-500 w-3.5 h-3.5' />
      ) : (
        <LockOutlined className='text-gray-500 w-3.5 h-3.5' />
      )
    }
    return null
  }

  return (
    <>
      <div className='bg-white shadow-sm border-2 border-gray-200 rounded-lg mb-4'>
        {/* Header */}
        <div className='flex items-center justify-between p-4 pb-2'>
          <div className='flex items-center space-x-3'>
            <div onClick={handleUserClick} className='cursor-pointer relative'>
              <div className='rounded-full flex items-center justify-center border-2 border-gray-200'>
                <Avatar
                  src={user?.avatarUrl}
                  size={40}
                  className='rounded-full object-cover w-10 h-10 min-w-10 min-h-10'
                >
                  {user?.firstName?.[0] || user?.lastName?.[0] || ''}
                </Avatar>
              </div>
            </div>

            <div>
              <div className='flex items-center gap-2'>
                <h4
                  className='font-semibold text-gray-800 text-sm hover:underline cursor-pointer'
                  onClick={handleUserClick}
                >
                  {fullName}
                </h4>
                <Tag color='orange' className='text-xs'>
                  <ClockCircleOutlined className='mr-1' />
                  Pending
                </Tag>
              </div>
              <div className='flex items-center space-x-1'>
                <span className='text-xs text-gray-500 font-medium'>{getTimeAgo(createdAt)}</span>
                {group && (
                  <>
                    <span className='text-[8px] text-gray-400'>•</span>
                    {renderPrivacyIcon()}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Group info for user view */}
        {mode === 'user' && group && (
          <div className='px-4 pb-2'>
            <span className='text-xs text-gray-500'>
              Posted in <span className='font-medium text-gray-700'>{group.name}</span>
            </span>
          </div>
        )}

        {/* Content */}
        <div className='px-4 pb-2'>
          <p className='text-gray-900 leading-relaxed font-medium text-[15px]'>{content}</p>
        </div>

        {/* Image Carousel */}
        {postImages && postImages.length > 0 && (
          <ImageCarousel
            postImages={postImages}
            currentImageIndex={currentImageIndex}
            onImageClick={setSelectedImageIndex}
            onPrevious={goToPrevious}
            onNext={goToNext}
            onGoToImage={goToImage}
          />
        )}

        {/* Action Buttons */}
        <div className='border-t border-gray-100 px-4 py-3'>
          <div className='flex items-center justify-end gap-2'>
            {mode === 'admin' ? (
              <>
                <button
                  onClick={() => onApprove?.(id)}
                  className='px-4 h-10 text-sm font-semibold rounded-lg border-2 border-blue-500 bg-blue-500 text-white hover:bg-blue-600 hover:border-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2'
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                  ) : (
                    <>
                      <CheckOutlined />
                      <span>Approve</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => onReject?.(id)}
                  className='px-4 h-10 text-sm font-semibold rounded-lg border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50 flex items-center gap-2'
                  disabled={isLoading}
                >
                  <CloseOutlined />
                  <span>Reject</span>
                </button>
              </>
            ) : (
              <Popconfirm
                title='Cancel Post'
                description='Are you sure you want to cancel this pending post? This action cannot be undone.'
                onConfirm={() => onCancel?.(id)}
                okText='Cancel Post'
                cancelText='Keep'
                okButtonProps={{ danger: true }}
              >
                <button
                  className='px-4 h-10 text-sm font-semibold rounded-lg border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50 flex items-center gap-2'
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className='w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin'></div>
                  ) : (
                    <>
                      <DeleteOutlined />
                      <span>Cancel Post</span>
                    </>
                  )}
                </button>
              </Popconfirm>
            )}
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImageIndex !== null && postImages && (
        <ImageModal
          postImages={postImages}
          selectedImageIndex={selectedImageIndex}
          onClose={() => setSelectedImageIndex(null)}
          onPrevious={handleModalPrevious}
          onNext={handleModalNext}
        />
      )}
    </>
  )
}

export default PendingPost
