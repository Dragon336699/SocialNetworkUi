import React, { useState, useEffect, useRef } from 'react'
import { PostData, PostReactionDto, SeenPost } from '@/app/types/Post/Post'
import PostDropdownMenu from './PostDropdownMenu'
import ImageCarousel from './ImageCarousel'
import ImageModal from './ImageModal'
import EditPostModal from './EditPostModal'
import DeletePostModal from './DeletePostModal'
import PostReaction from './PostReaction'
import { message } from 'antd'
import { postService } from '@/app/services/post.service'
import { commentService } from '@/app/services/comment.service'
import { Avatar } from 'antd'
import PostCommentModal from '../Comment/PostCommentModal'
import { UserDto } from '@/app/types/User/user.dto'
import { getTimeAgo } from '@/app/helper'
import { useNavigate } from 'react-router-dom'
import { PictureOutlined, CloseOutlined } from '@ant-design/icons'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { interactionService } from '@/app/services/interaction.service'

interface PostProps extends PostData {
  feedId?: string
  feedCreatedAt?: number
  onToggleLike?: (postId: string) => void
  onPostUpdated?: (updatedPost: PostData) => void
  onPostDeleted?: (postId: string) => void
  onSeen?: (item: SeenPost) => void
  currentUserId?: string
  currentUser: UserDto
  hideHeader?: boolean
}

const Post: React.FC<PostProps> = ({
  id,
  content,
  totalLiked,
  totalComment,
  createdAt,
  feedId,
  feedCreatedAt,
  user,
  postImages,
  postPrivacy = 'Public',
  postReactionUsers,
  onPostUpdated,
  onPostDeleted,
  onSeen,
  currentUserId = '',
  currentUser,
  hideHeader = false
}) => {
  const navigate = useNavigate()
  const postRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const emojiWrapperRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [reactions, setReactions] = useState<PostReactionDto[]>(postReactionUsers)
  const [localTotalLiked, setLocalTotalLiked] = useState(totalLiked)

  const [showComments, setShowComments] = useState(false)
  const [localTotalComment, setLocalTotalComment] = useState(totalComment)
  const [commentText, setCommentText] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])

  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim()

  useEffect(() => {
    setReactions(postReactionUsers)
    setLocalTotalLiked(totalLiked)
  }, [postReactionUsers, totalLiked])

  useEffect(() => {
    setLocalTotalComment(totalComment)
  }, [totalComment])

  useEffect(() => {
    const el = postRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!feedId || !feedCreatedAt) return
          const seenPostObject: SeenPost = {
            feedId,
            createdAt: feedCreatedAt,
            postId: id
          }
          onSeen?.(seenPostObject)
          observer.unobserve(el)
        }
      },
      { threshold: 0.6 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [id, onSeen, feedId, feedCreatedAt])

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
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [commentText])

  const handleUserClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (user?.userName) {
      navigate(`/profile/${user.userName}`)
    }
  }

  const handleCommentCountChange = (newCount: number) => {
    setLocalTotalComment(newCount)
    if (onPostUpdated) {
      onPostUpdated({
        id,
        content,
        totalLiked,
        totalComment: newCount,
        createdAt,
        user,
        postImages,
        postPrivacy,
        postReactionUsers
      } as PostData)
    }
  }

  const handleEmojiSelect = (emojiData: any) => {
    const emoji = emojiData.native
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart || 0
    const end = textarea.selectionEnd || 0
    const newText = commentText.slice(0, start) + emoji + commentText.slice(end)
    setCommentText(newText)

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

  const handleSendComment = async () => {
    if (!commentText.trim() && selectedImages.length === 0) {
      message.warning('Please enter a comment or select an image')
      return
    }

    try {
      const formData = new FormData()
      formData.append('Content', commentText.trim())
      formData.append('PostId', id)

      if (selectedImages.length > 0) {
        formData.append('Images', selectedImages[0])
      }

      const response = await commentService.createComment(formData)
      
      if (response.message?.includes('success')) {
        message.success('Comment sent successfully')
        setCommentText('')
        setSelectedImages([])
        previewUrls.forEach((url) => URL.revokeObjectURL(url))
        setPreviewUrls([])
        setLocalTotalComment(prev => prev + 1)
        
        if (onPostUpdated) {
          onPostUpdated({
            id,
            content,
            totalLiked,
            totalComment: localTotalComment + 1,
            createdAt,
            user,
            postImages,
            postPrivacy,
            postReactionUsers
          } as PostData)
        }
      } else {
        message.error(response.message || 'Failed to send comment')
      }
    } catch (error) {
      console.error('Comment error:', error)
      message.error('Failed to send comment')
    }
  }

  const handleSendReaction = async (postId: string, reaction: string) => {
    try {
      const response = await postService.reactionPost(postId, reaction)
      if (response.message && response.message.includes('successfully')) {
        const currentUserReaction = reactions.find((r) => r.userId === currentUserId)
        let newReactions: PostReactionDto[] = []
        let newTotalLiked = localTotalLiked

        if (currentUserReaction) {
          if (currentUserReaction.reaction === reaction) {
            newReactions = reactions.filter((r) => r.userId !== currentUserId)
            newTotalLiked = Math.max(0, localTotalLiked - 1)
            setReactions(newReactions)
            setLocalTotalLiked(newTotalLiked)
          } else {
            newReactions = reactions.map((r) => (r.userId === currentUserId ? { ...r, reaction: reaction } : r))
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
              firstName: currentUser.firstName || '',
              lastName: currentUser.lastName || '',
              avatarUrl: currentUser.avatarUrl || ''
            }
          }
          newReactions = [...reactions, newReaction]
          newTotalLiked = localTotalLiked + 1
          setReactions(newReactions)
          setLocalTotalLiked(newTotalLiked)

          const postData = response.data
          interactionService.likePostOfUser(postData.userId)
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

  const getFullName = (user: any) => {
    if (!user) return 'User'
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User'
  }

  const getReactionText = () => {
    if (!postReactionUsers || postReactionUsers.length === 0) return ''

    const currentUserReaction = postReactionUsers.find((r) => r.userId === currentUserId)

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

  return (
    <>
      <div
        ref={postRef}
        className={`bg-white shadow-sm border-2 border-black mb-4 ${hideHeader ? 'border-t-0 rounded-b-lg' : 'rounded-lg'}`}
      >
        {/* Header */}
        {!hideHeader && (
          <div className='flex items-center justify-between p-4 pb-2'>
            <div className='flex items-center space-x-3'>
              <div onClick={handleUserClick} className='cursor-pointer relative'>
                <div className='rounded-full flex items-center justify-center border-2 border-black'>
                  <Avatar
                    src={user.avatarUrl}
                    size={40}
                    className='rounded-full object-cover w-10 h-10 min-w-10 min-h-10'
                  >
                    {user.firstName?.[0] || user.lastName?.[0] || ''}
                  </Avatar>
                </div>
              </div>

              <div>
                <h4
                  className='font-semibold text-gray-800 text-sm hover:underline cursor-pointer'
                  onClick={handleUserClick}
                >
                  {fullName}
                </h4>
                <div className='flex items-center space-x-1'>
                  <span className='text-xs text-gray-500 font-medium'>{getTimeAgo(createdAt)}</span>
                  <span className='text-[8px] text-gray-400'>•</span>
                  {renderPrivacyIcon()}
                </div>
              </div>
            </div>
            <div className='relative'>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className='text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 hover:border hover:border-gray-300 border border-transparent'
              >
                <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
                  <path d='M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z' />
                </svg>
              </button>
              <PostDropdownMenu
                isOpen={showDropdown}
                onClose={() => setShowDropdown(false)}
                postId={id}
                isOwner={currentUserId === user.id}
                {...handleDropdownActions}
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className='px-4 pb-2'>
          {/* <div className='border-t-2 border-black mb-3'></div> */}
          <p className='text-gray-900 leading-relaxed font-medium text-[15px]'>{content}</p>
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
          {/* Divider */}
          {/* <div className='border-t-2 border-black mb-3'></div> */}

          <div className='space-y-3'>
            {/* Row 1: Like, Comment buttons và Reactions Info */}
            <div className='flex items-center justify-between'>
              {/* Like and Comment buttons - Bên trái */}
              <div className='flex items-center space-x-4'>
                <div 
                  className={`rounded-full transition-colors h-10 flex items-center border ${
                    reactions.find(r => r.userId === currentUserId) 
                      ? 'bg-gray-100 border-gray-300' 
                      : 'border-transparent hover:bg-gray-100 hover:border-gray-300'
                  }`}
                >
                  <PostReaction
                    postId={id}
                    reactions={reactions}
                    onSendReaction={handleSendReaction}
                    currentUserId={currentUserId}
                    totalLiked={localTotalLiked}
                  />
                </div>
                <button
                  onClick={() => setShowComments(true)}
                  className='flex items-center space-x-2 px-3 rounded-full text-sm transition-colors h-10 font-semibold border border-transparent text-gray-900 hover:bg-gray-100 hover:border-gray-300'
                >
                  <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
                    />
                  </svg>
                  <span>Comment</span>
                </button>
              </div>

              {/* Reactions Info - Bên phải */}
              <div className='flex items-center gap-2'>
                {postReactionUsers && postReactionUsers.length > 0 && (
                  <div className='flex items-center gap-2 rounded-full px-3 font-medium bg-gray-100 border border-gray-300 text-gray-900 text-sm h-10'>
                    <div className='flex items-center -space-x-1'>
                      {Array.from(new Set(postReactionUsers.map((r) => r.reaction))).slice(0, 3).map((reactionEmoji, index) => (
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
                    <span className='whitespace-nowrap'>{getReactionText()}</span>
                  </div>
                )}

                {localTotalComment > 0 && (
                  <button
                    onClick={() => setShowComments(true)} 
                    className='rounded-full px-3 flex items-center transition-colors font-medium bg-gray-100 border border-gray-300 text-gray-900 hover:bg-gray-200 text-sm h-10 whitespace-nowrap'
                  >
                    {localTotalComment} Comment
                  </button>
                )}
              </div>
            </div>

            {/* Row 2: Avatar + Comment input and Send button */}
            <div className='flex items-center space-x-3'>
              {/* Avatar người dùng */}
              <div className='flex-shrink-0'>
                <div className='rounded-full flex items-center justify-center border-2 border-black'>
                  <Avatar
                    src={currentUser.avatarUrl}
                    size={40}
                    className='rounded-full object-cover w-10 h-10 min-w-10 min-h-10'
                  >
                    {currentUser.firstName?.[0] || currentUser.lastName?.[0] || ''}
                  </Avatar>
                </div>
              </div>

              {/* Comment input and Send button */}
              <div className='flex items-center space-x-2 flex-1'>
                <div className='flex-1 flex items-start bg-gray-50 rounded-3xl px-4 py-2.5 border border-gray-300'>
                  <textarea
                    ref={textareaRef}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendComment()
                      }
                    }}
                    placeholder='Write your comment'
                    className='flex-1 bg-transparent text-sm outline-none placeholder-gray-500 font-medium resize-none overflow-hidden pl-2'
                    rows={1}
                  />

                  <div className='flex items-center gap-1 ml-2 flex-shrink-0'>
                    {/* Image picker */}
                    {previewUrls.length === 0 && (
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
                <button
                  onClick={handleSendComment}
                  disabled={!commentText.trim() && selectedImages.length === 0}
                  className={`rounded-full transition-colors flex items-center justify-center w-10 h-10 flex-shrink-0 self-center ${
                    !commentText.trim() && selectedImages.length === 0
                      ? 'bg-blue-300 cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600 cursor-pointer'
                  }`}
                >
                  <svg className='w-5 h-5 text-white' fill='currentColor' viewBox='0 0 24 24'>
                    <path d='M2.01 21L23 12 2.01 3 2 10l15 2-15 2z' />
                  </svg>
                </button>
              </div>
            </div>

            {/* Row 3: Image preview */}
            {previewUrls.length > 0 && (
              <div className='flex justify-end pr-12 pl-[52px]'>
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
          </div>
        </div>
      </div>

      {/* Modals */}
      {postImages && (
        <ImageModal
          postImages={postImages}
          selectedImageIndex={selectedImageIndex}
          onClose={() => setSelectedImageIndex(null)}
          onPrevious={handleModalPrevious}
          onNext={handleModalNext}
        />
      )}

      <EditPostModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        postId={id}
        onSave={handleSavePost}
        currentUser={currentUser}
      />

      <DeletePostModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onDeleteSuccess={handleDeleteSuccess}
        postId={id}
      />

      {showComments && (
        <PostCommentModal
          isOpen={showComments}
          onClose={() => setShowComments(false)}
          postId={id}
          currentUserId={currentUserId}
          currentUser={currentUser}
          postContent={content}
          postUser={user}
          postImages={postImages}
          postCreatedAt={createdAt}
          postPrivacy={postPrivacy}
          totalLiked={localTotalLiked}
          totalComment={localTotalComment}
          postReactionUsers={reactions}
          onCommentCountChange={handleCommentCountChange}
          onPostReaction={handleSendReaction}
          onPostUpdated={onPostUpdated}
          onPostDeleted={onPostDeleted}
        />
      )}
    </>
  )
}

export default Post