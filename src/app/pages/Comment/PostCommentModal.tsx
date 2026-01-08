import React, { useState, useEffect, useRef } from 'react'
import { Avatar, message } from 'antd'
import { CloseOutlined, MessageOutlined, PictureOutlined, MoreOutlined } from '@ant-design/icons'
import { commentService } from '@/app/services/comment.service'
import { CommentDto } from '@/app/types/Comment/CommentResponses'
import ImageCarousel from '../Post/ImageCarousel'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import CommentItem from './CommentItem'
import { UserDto } from '@/app/types/User/user.dto'
import PostDropdownMenu from '../Post/PostDropdownMenu'
import EditPostModal from '../Post/EditPostModal'
import DeletePostModal from '../Post/DeletePostModal'
import ReactionUsersModal from '@/app/common/Modals/ReactionUsersModal'
import { PostData } from '@/app/types/Post/Post'
import { getTimeAgo } from '@/app/helper'
import useDevice from '@/app/hook/useDeivce'
import { useCallback } from 'react'

interface PostCommentModalProps {
  isOpen: boolean
  onClose: () => void
  postId: string
  currentUserId: string
  currentUser: UserDto
  postContent: string
  postUser: any
  postImages?: any[]
  postCreatedAt: string
  postPrivacy: string
  totalLiked: number
  totalComment: number
  postReactionUsers: any[]
  onCommentCountChange?: (newCount: number) => void
  onPostReaction?: (postId: string, reaction: string) => void
  onPostUpdated?: (updatedPost: PostData) => void
  onPostDeleted?: (postId: string) => void
}

const getReactionText = (reaction: string): string => {
  const reactionMap: { [key: string]: string } = {
    '👍': 'Like',
    '❤️': 'Love',
    '😂': 'Haha',
    '😮': 'Wow',
    '😢': 'Sad',
    '😡': 'Angry'
  }
  return reactionMap[reaction] || 'Like'
}

const getReactionColor = (reaction: string): string => {
  if (reaction === '❤️' || reaction === '😡') {
    return '#EF4444'
  }
  return '#F59E0B'
}

const PostCommentModal: React.FC<PostCommentModalProps> = ({
  isOpen,
  onClose,
  postId,
  currentUserId,
  currentUser,
  postContent,
  postUser,
  postImages = [],
  postCreatedAt,
  postPrivacy,
  totalComment,
  postReactionUsers,
  onCommentCountChange,
  onPostReaction,
  onPostUpdated,
  onPostDeleted
}) => {
  const availableReactions = ['👍', '❤️', '😂', '😮', '😢', '😡']

  const [currentPostContent, setCurrentPostContent] = useState(postContent)
  const [currentPostImages, setCurrentPostImages] = useState(postImages)
  const [currentPostPrivacy, setCurrentPostPrivacy] = useState(postPrivacy)
  const { isMobile } = useDevice()

  const [comments, setComments] = useState<CommentDto[]>([])
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState('')
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null)
  const [editingComment, setEditingComment] = useState<CommentDto | null>(null)
  const [showPostReactionPicker, setShowPostReactionPicker] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false)
  const [existingImages, setExistingImages] = useState<any[]>([])
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([])
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null)

  const [showDropdown, setShowDropdown] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showReactionUsersModal, setShowReactionUsersModal] = useState(false)

  const emojiWrapperRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const reactionBarRef = useRef<HTMLDivElement>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const loadComments = useCallback(async () => {
    try {
      setLoading(true)
      const response = await commentService.getCommentsByPostId(postId, 0, 100)
      if (response.comments) {
        setComments(response.comments)
      }
    } catch {
      message.error('Failed to load comments')
    } finally {
      setLoading(false)
    }
  }, [postId])

  useEffect(() => {
    setCurrentPostContent(postContent)
    setCurrentPostImages(postImages)
    setCurrentPostPrivacy(postPrivacy)
  }, [postContent, postImages, postPrivacy])

  useEffect(() => {
    if (isOpen) {
      loadComments()
    }
  }, [isOpen, postId, loadComments])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [content])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiWrapperRef.current && !emojiWrapperRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false)
      }
    }
    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showEmojiPicker])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const clickedOutsideReactionBar = reactionBarRef.current && !reactionBarRef.current.contains(target)

      if (showPostReactionPicker && clickedOutsideReactionBar) {
        setShowPostReactionPicker(false)
      }
    }

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowPostReactionPicker(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscapeKey)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [showPostReactionPicker])

  const handleEmojiSelect = (emojiData: any) => {
    const emoji = emojiData.native
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newText = content.slice(0, start) + emoji + content.slice(end)
    setContent(newText)

    requestAnimationFrame(() => {
      textarea.focus()
      textarea.selectionStart = textarea.selectionEnd = start + emoji.length
    })
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const file = files[0]

    if (file.size > 10 * 1024 * 1024) {
      message.warning(`${file.name} is too large (maximum 10MB)`)
      return
    }

    setSelectedImages([file])
    const url = URL.createObjectURL(file)
    setPreviewUrls([url])
  }

  const removeImage = (index: number) => {
    URL.revokeObjectURL(previewUrls[index])
    setSelectedImages((prev) => prev.filter((_, i) => i !== index))
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index))
  }

  const removeExistingImage = (imageId: string) => {
    setImagesToDelete((prev) => [...prev, imageId])
    setExistingImages((prev) => prev.filter((img) => img.id !== imageId))
  }

  const handleSubmit = async () => {
    if (!content.trim() && selectedImages.length === 0 && existingImages.length === 0) {
      message.warning('Please enter content or select an image')
      return
    }

    try {
      const formData = new FormData()
      formData.append('Content', content.trim())

      if (editingComment) {
        if (selectedImages.length > 0) {
          formData.append('NewImages', selectedImages[0])
        }
        imagesToDelete.forEach((imageId) => {
          formData.append('ImageIdsToDelete', imageId)
        })

        const response = await commentService.updateComment(editingComment.id, formData)

        if (response.message?.includes('success')) {
          loadComments()
          resetForm()
        } else {
          message.error(response.message || 'Failed to update comment')
        }
      } else {
        formData.append('PostId', postId)
        if (replyTo?.id) {
          formData.append('RepliedCommentId', replyTo.id)
        }

        if (selectedImages.length > 0) {
          formData.append('Images', selectedImages[0])
        }

        const response = await commentService.createComment(formData)

        if (response.message?.includes('success')) {
          loadComments()
          resetForm()

          if (onCommentCountChange) {
            onCommentCountChange(totalComment + 1)
          }
        } else {
          message.error(response.message || 'Failed to add comment')
        }
      }
    } catch (error) {
      console.error(error)
      message.error('An error occurred')
    }
  }

  const resetForm = () => {
    setContent('')
    setSelectedImages([])
    previewUrls.forEach((url) => URL.revokeObjectURL(url))
    setPreviewUrls([])
    setReplyTo(null)
    setEditingComment(null)
    setExistingImages([])
    setImagesToDelete([])
  }

  const handleReaction = (reaction: string) => {
    if (onPostReaction) {
      onPostReaction(postId, reaction)
    }
    setShowPostReactionPicker(false)
  }

  const handleMouseEnterReaction = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout)
      setHoverTimeout(null)
    }
    const timeout = setTimeout(() => {
      setShowPostReactionPicker(true)
    }, 300)
    setHoverTimeout(timeout)
  }

  const handleMouseLeaveReaction = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout)
      setHoverTimeout(null)
    }
    const timeout = setTimeout(() => {
      setShowPostReactionPicker(false)
    }, 300)
    setHoverTimeout(timeout)
  }

  const handleLikeClick = () => {
    const currentUserReaction = postReactionUsers?.find((r) => r.userId === currentUserId)
    if (currentUserReaction) {
      handleReaction(currentUserReaction.reaction)
    } else {
      handleReaction('👍')
    }
  }

  const handlePreviousImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : prevIndex))
  }

  const handleNextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex < currentPostImages.length - 1 ? prevIndex + 1 : prevIndex))
  }

  const handleGoToImage = (index: number) => {
    setCurrentImageIndex(index)
  }

  const handleEditPost = () => {
    setShowEditModal(true)
    setShowDropdown(false)
  }

  const handleSavePost = (updatedPostData: PostData) => {
    setCurrentPostContent(updatedPostData.content || '')
    setCurrentPostImages(updatedPostData.postImages || [])
    setCurrentPostPrivacy(updatedPostData.postPrivacy || 'Public')
    if (onPostUpdated) {
      onPostUpdated(updatedPostData)
    }
    setShowEditModal(false)
  }

  const handleDeleteClick = () => {
    setShowDeleteModal(true)
    setShowDropdown(false)
  }

  const handleDeleteSuccess = () => {
    if (onPostDeleted) {
      onPostDeleted(postId)
    }
    setShowDeleteModal(false)
    onClose()
  }

  const renderPrivacyIcon = () => {
    const iconClass = 'w-3 h-3 text-gray-500'

    switch (currentPostPrivacy) {
      case 'Public':
        return (
          <svg className={iconClass} fill='currentColor' viewBox='0 0 20 20'>
            <path
              fillRule='evenodd'
              d='M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z'
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

  const renderReactionsInfo = () => {
    const hasReactions = postReactionUsers && postReactionUsers.length > 0
    const hasComments = totalComment > 0

    if (!hasReactions && !hasComments) {
      return null
    }

    const uniqueReactions = hasReactions ? Array.from(new Set(postReactionUsers.map((r) => r.reaction))) : []
    const currentUserReaction = hasReactions ? postReactionUsers.find((r) => r.userId === currentUserId) : null

    const getFullName = (user: any) => {
      if (!user) return 'User'
      return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User'
    }

    const getReactionDisplayText = () => {
      if (!hasReactions) return ''

      if (postReactionUsers.length === 1) {
        return getFullName(postReactionUsers[0]?.user)
      } else if (postReactionUsers.length === 2) {
        if (currentUserReaction) {
          const otherUser = postReactionUsers.find((r) => r.userId !== currentUserId)?.user
          return otherUser ? `You and ${getFullName(otherUser)}` : 'You and 1 other person'
        }
        return `${getFullName(postReactionUsers[0]?.user)} and ${getFullName(postReactionUsers[1]?.user)}`
      } else {
        if (currentUserReaction) {
          return `You and ${postReactionUsers.length - 1} others`
        }
        return `${getFullName(postReactionUsers[0]?.user)} and ${postReactionUsers.length - 1} others`
      }
    }

    return (
      <div className='flex'>
        {hasReactions && (
          <div 
            className='flex items-center gap-2 rounded-full px-3 font-medium bg-gray-100 border border-gray-300 text-gray-900 text-sm h-10 cursor-pointer hover:bg-gray-200 transition-colors'
            onClick={() => setShowReactionUsersModal(true)}
          >
            <div className='flex items-center -space-x-1'>
              {uniqueReactions.slice(0, 3).map((reactionEmoji, index) => (
                <div
                  key={index}
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                    index === 0 ? 'z-30' : index === 1 ? 'z-20' : 'z-10'
                  }`}
                >
                  {reactionEmoji}
                </div>
              ))}
            </div>

            <span className='truncate'>{getReactionDisplayText()}</span>
          </div>
        )}

        {hasComments && !isMobile && (
          <button className='rounded-full px-3 flex items-center transition-colors font-medium bg-gray-100 border border-gray-300 text-gray-900 hover:bg-gray-200 text-sm h-10 whitespace-nowrap flex-shrink-0'>
            {totalComment} Comment{totalComment > 1 ? 's' : ''}
          </button>
        )}
      </div>
    )
  }

  const fullName = `${postUser.firstName || ''} ${postUser.lastName || ''}`.trim()
  const userReaction = postReactionUsers?.find((r) => r.userId === currentUserId)
  const isCurrentUserPost = currentUserId === postUser.id

  if (!isOpen) return null

  return (
    <>
      <div className='fixed inset-0 bg-black bg-opacity-60 z-[110] flex items-center justify-center p-0 md:p-4'>
        <div className='bg-white w-full h-full md:h-[90vh] md:max-w-[1000px] md:rounded-xl md:border md:border-gray-200 flex flex-col overflow-hidden shadow-2xl'>
          <div className='relative px-4 py-3 border-b border-gray-200 bg-white flex justify-center items-center'>
            <h3 className='font-bold text-xl text-center'>{fullName}'s post</h3>

            <button
              onClick={onClose}
              className='absolute right-4 text-gray-500 hover:bg-gray-100 p-2 rounded-full transition'
            >
              <CloseOutlined style={{ fontSize: '20px' }} />
            </button>
          </div>

          <div className='flex-1 overflow-y-auto'>
            <div className='px-4 pt-3 pb-2'>
              <div className='flex items-start justify-between'>
                <div className='flex items-center gap-3'>
                  <div className='rounded-full border-2 border-gray-200'>
                    <Avatar src={postUser.avatarUrl} size={40}>
                      {postUser.firstName?.[0] || postUser.lastName?.[0] || ''}
                    </Avatar>
                  </div>
                  <div>
                    <h4 className='font-semibold text-sm hover:underline cursor-pointer'>{fullName}</h4>
                    <div className='flex items-center gap-1'>
                      <span className='text-xs text-gray-500'>{getTimeAgo(postCreatedAt)}</span>
                      <span className='text-gray-400'>·</span>
                      {renderPrivacyIcon()}
                    </div>
                  </div>
                </div>
                <div className='relative'>
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className='text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 hover:border hover:border-gray-300 border border-transparent'
                  >
                    <MoreOutlined style={{ fontSize: '20px' }} />
                  </button>

                  <PostDropdownMenu
                    isOpen={showDropdown}
                    isOwner={isCurrentUserPost}
                    onClose={() => setShowDropdown(false)}
                    postId={postId}
                    onEdit={handleEditPost}
                    onDeleteClick={handleDeleteClick}
                  />
                </div>
              </div>
            </div>

            <div className='px-4 pb-3'>
              <p className='text-sm text-gray-900 whitespace-pre-wrap leading-relaxed font-medium'>
                {currentPostContent}
              </p>
            </div>

            {currentPostImages && currentPostImages.length > 0 && (
              <div className='w-full flex items-center justify-center bg-black'>
                <ImageCarousel
                  postImages={currentPostImages}
                  currentImageIndex={currentImageIndex}
                  onImageClick={setCurrentImageIndex}
                  onPrevious={handlePreviousImage}
                  onNext={handleNextImage}
                  onGoToImage={handleGoToImage}
                />
              </div>
            )}

            <div className='px-4 py-3 border-t border-gray-100'>
              <div className='space-y-3'>
                {/* Like, Comment buttons và Reactions Info */}
                <div className='flex items-center justify-between'>
                  <div className='flex items-center space-x-4'>
                    <div className='relative'>
                      <div
                        className={`rounded-full transition-colors h-10 flex items-center border ${
                          userReaction
                            ? 'bg-gray-100 border-gray-300'
                            : 'border-transparent hover:bg-gray-100 hover:border-gray-300'
                        }`}
                        onMouseEnter={handleMouseEnterReaction}
                        onMouseLeave={handleMouseLeaveReaction}
                      >
                        <button
                          onClick={handleLikeClick}
                          className='flex items-center space-x-2 px-3 py-1 rounded-full text-sm transition-colors font-semibold'
                        >
                          {userReaction ? (
                            <>
                              <span className='text-lg'>{userReaction.reaction}</span>
                              <span style={{ color: getReactionColor(userReaction.reaction) }}>
                                {getReactionText(userReaction.reaction)}
                              </span>
                            </>
                          ) : (
                            <>
                              <svg
                                className='w-5 h-5'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                                strokeWidth='2'
                              >
                                <path
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                  d='M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3'
                                />
                              </svg>
                              <span>Like</span>
                            </>
                          )}
                        </button>

                        {showPostReactionPicker && (
                          <div
                            ref={reactionBarRef}
                            className='absolute z-50 flex gap-1 rounded-full py-2 px-3 bottom-full mb-0.5 animate-fadeInUp'
                            style={{
                              minWidth: '200px',
                              background: '#F3F4F6',
                              border: '1px solid #D1D5DB',
                              left: '0'
                            }}
                            onMouseEnter={() => {
                              if (hoverTimeout) {
                                clearTimeout(hoverTimeout)
                                setHoverTimeout(null)
                              }
                            }}
                            onMouseLeave={handleMouseLeaveReaction}
                          >
                            {availableReactions.map((reaction, index) => (
                              <div
                                key={reaction}
                                onClick={() => handleReaction(reaction)}
                                className='text-lg cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:scale-110 p-0.5 rounded-full relative'
                                style={{
                                  animationDelay: `${index * 50}ms`
                                }}
                                title={getReactionText(reaction)}
                              >
                                {reaction}

                                <div className='absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-[10px] px-1 py-0.5 rounded opacity-0 hover:opacity-100 transition-opacity whitespace-nowrap'>
                                  {getReactionText(reaction)}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <button className='flex items-center space-x-2 px-3 rounded-full text-sm transition-colors h-10 font-semibold border border-transparent text-gray-900 hover:bg-gray-100 hover:border-gray-300'>
                      <MessageOutlined style={{ fontSize: '18px' }} />
                      <span className='max-xs:hidden'>Comment</span>
                    </button>
                  </div>

                  {/* Reactions Info - Bên phải */}
                  <div className='flex items-center gap-2 overflow-hidden min-w-0'>
                    <div className='truncate text-[13px] sm:text-[15px]'>{renderReactionsInfo()}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className='px-4 py-3'>
              <div className='border-t-2 border-gray-200 mb-3'></div>
              {loading ? (
                <div className='text-center py-8 text-gray-500'>Loading...</div>
              ) : comments.length === 0 ? (
                <div className='text-center py-8 text-gray-500'>No comments yet. Be the first to comment!</div>
              ) : (
                <div className='space-y-2'>
                  {comments.map((comment) => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      currentUserId={currentUserId}
                      loadComments={loadComments}
                      onCommentCountChange={onCommentCountChange}
                      setEditingComment={setEditingComment}
                      setReplyTo={setReplyTo}
                      setContent={setContent}
                      setExistingImages={setExistingImages}
                      setImagesToDelete={setImagesToDelete}
                      totalComment={totalComment}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className='border-t border-gray-200 bg-white px-4 py-3'>
            {(replyTo || editingComment) && (
              <div className='flex items-center justify-between mb-2 px-3 py-2 bg-blue-50 rounded-lg border-2 border-blue-300 text-sm'>
                <span className='text-gray-600 font-medium'>
                  {editingComment ? '✏️ Editing comment' : `💬 Replying to ${replyTo?.name}`}
                </span>
                <button onClick={resetForm} className='text-gray-500 hover:text-gray-700'>
                  <CloseOutlined style={{ fontSize: '14px' }} />
                </button>
              </div>
            )}

            {/* Preview existing images */}
            {existingImages.length > 0 && (
              <div className='mb-2'>
                <div className='relative inline-block'>
                  <img src={existingImages[0].imageUrl} alt='Existing' className='w-20 h-20 object-cover rounded-lg' />
                  <button
                    onClick={() => removeExistingImage(existingImages[0].id)}
                    className='absolute -top-1.5 -right-1.5 bg-gray-800 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-gray-900 transition-colors'
                  >
                    <CloseOutlined className='text-[10px]' />
                  </button>
                </div>
              </div>
            )}

            {/* Preview new images */}
            {previewUrls.length > 0 && (
              <div className='mb-2'>
                <div className='relative inline-block'>
                  <img src={previewUrls[0]} alt='Preview' className='w-20 h-20 object-cover rounded-lg' />
                  <button
                    onClick={() => removeImage(0)}
                    className='absolute -top-1.5 -right-1.5 bg-gray-800 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-gray-900 transition-colors'
                  >
                    <CloseOutlined className='text-[10px]' />
                  </button>
                </div>
              </div>
            )}

            <div className='flex gap-2 items-center'>
              <div className='flex-shrink-0 rounded-full border-2 border-gray-200'>
                <Avatar
                  src={currentUser.avatarUrl}
                  size={32}
                  className='rounded-full object-cover w-8 h-8 min-w-8 min-h-8'
                >
                  {currentUser.firstName?.[0] || ''}
                </Avatar>
              </div>

              {/* Input container với styling giống Post */}
              <div className='flex-1 flex items-start bg-gray-50 rounded-3xl px-4 py-2.5 border border-gray-300'>
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmit()
                    }
                  }}
                  placeholder='Write a comment...'
                  className='flex-1 bg-transparent outline-none resize-none overflow-hidden text-sm max-h-20 placeholder-gray-500 font-medium pl-2'
                  rows={1}
                />

                <div className='flex items-center gap-1 ml-2 flex-shrink-0'>
                  {/* Image picker - chỉ hiện khi chưa có preview */}
                  {previewUrls.length === 0 && existingImages.length === 0 && (
                    <>
                      <input
                        ref={fileInputRef}
                        type='file'
                        accept='image/*'
                        onChange={handleImageSelect}
                        className='hidden'
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className='text-gray-500 hover:text-gray-700 p-1'
                      >
                        <PictureOutlined className='text-base' />
                      </button>
                    </>
                  )}

                  {/* Emoji picker */}
                  <div ref={emojiWrapperRef} className='relative'>
                    <button
                      onClick={() => setShowEmojiPicker((prev) => !prev)}
                      className='text-gray-500 hover:text-gray-700 p-1'
                    >
                      <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
                        <path
                          fillRule='evenodd'
                          d='M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z'
                          clipRule='evenodd'
                        />
                      </svg>
                    </button>
                    {showEmojiPicker && (
                      <div className='absolute bottom-full right-0 mb-2 z-50'>
                        <Picker
                          data={data}
                          onEmojiSelect={handleEmojiSelect}
                          previewPosition='none'
                          theme='light'
                          perLine={8}
                          emojiSize={20}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Send button - giống như trong Post */}
              {(content.trim() || selectedImages.length > 0 || existingImages.length > 0) && (
                <button
                  onClick={handleSubmit}
                  className='rounded-full transition-colors flex items-center justify-center w-10 h-10 bg-blue-500 hover:bg-blue-600'
                >
                  <svg className='w-5 h-5 text-white' fill='currentColor' viewBox='0 0 24 24'>
                    <path d='M2.01 21L23 12 2.01 3 2 10l15 2-15 2z' />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <EditPostModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        postId={postId}
        onSave={handleSavePost}
        currentUser={currentUser}
      />

      <DeletePostModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onDeleteSuccess={handleDeleteSuccess}
        postId={postId}
      />

      <ReactionUsersModal
        isOpen={showReactionUsersModal}
        onClose={() => setShowReactionUsersModal(false)}
        reactions={postReactionUsers}
        totalLiked={postReactionUsers?.length || 0}
      />
    </>
  )
}

export default PostCommentModal
