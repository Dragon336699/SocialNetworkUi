import { Modal, message, Empty, Spin, Tag } from 'antd'
import { ClockCircleOutlined } from '@ant-design/icons'
import { PostData } from '@/app/types/Post/Post'
import { postService } from '@/app/services/post.service'
import { useState, useEffect, useCallback } from 'react'
import PendingPost from '@/app/components/Group/PendingPost'

interface PendingPostsModalProps {
  isModalOpen: boolean
  handleCancel: () => void
  groupId: string
  onPostsUpdated: () => void
}

const PendingPostsModal = ({ isModalOpen, handleCancel, groupId, onPostsUpdated }: PendingPostsModalProps) => {
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string>('')
  const [pendingPosts, setPendingPosts] = useState<PostData[]>([])

  const fetchPendingPosts = useCallback(async () => {
    try {
      setLoading(true)
      const response = await postService.getPendingPosts(groupId, 0, 50)
      setPendingPosts(response.posts || [])
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to load pending posts'
      message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [groupId])

  useEffect(() => {
    if (isModalOpen) {
      fetchPendingPosts()
    }
  }, [isModalOpen, fetchPendingPosts])

  const handleApprove = async (postId: string) => {
    const post = pendingPosts.find((p) => p.id === postId)
    const userName = post?.user
      ? `${post.user.firstName || ''} ${post.user.lastName || ''}`.trim() || 'this user'
      : 'this user'

    try {
      setActionLoading(postId)
      await postService.approvePost(postId)
      message.success(`Approved ${userName}'s post!`)
      await fetchPendingPosts()
      onPostsUpdated()
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to approve post'
      message.error(errorMessage)
    } finally {
      setActionLoading('')
    }
  }

  const handleReject = async (postId: string) => {
    const post = pendingPosts.find((p) => p.id === postId)
    const userName = post?.user
      ? `${post.user.firstName || ''} ${post.user.lastName || ''}`.trim() || 'this user'
      : 'this user'

    try {
      setActionLoading(postId)
      await postService.rejectPost(postId)
      message.success(`Rejected ${userName}'s post`)
      await fetchPendingPosts()
      onPostsUpdated()
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to reject post'
      message.error(errorMessage)
    } finally {
      setActionLoading('')
    }
  }

  return (
    <Modal
      title={
        <div className='flex items-center gap-2'>
          <ClockCircleOutlined className='text-orange-500' />
          <span>Pending Posts</span>
          {pendingPosts.length > 0 && <Tag color='orange'>{pendingPosts.length}</Tag>}
        </div>
      }
      open={isModalOpen}
      onCancel={handleCancel}
      footer={null}
      width={700}
      styles={{
        body: { maxHeight: '70vh', overflowY: 'auto' }
      }}
      style={{ top: 40 }}
    >
      {loading ? (
        <div className='flex justify-center items-center py-12'>
          <Spin size='large' />
        </div>
      ) : pendingPosts.length === 0 ? (
        <Empty description='No pending posts' image={Empty.PRESENTED_IMAGE_SIMPLE} className='py-8' />
      ) : (
        <div className='space-y-4'>
          {pendingPosts.map((post) => (
            <PendingPost
              key={post.id}
              post={post}
              mode='admin'
              onApprove={handleApprove}
              onReject={handleReject}
              actionLoading={actionLoading}
            />
          ))}
        </div>
      )}
    </Modal>
  )
}

export default PendingPostsModal
