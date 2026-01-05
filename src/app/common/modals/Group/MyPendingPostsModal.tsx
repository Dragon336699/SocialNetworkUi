import { Modal, message, Empty, Spin, Typography, Tag } from 'antd'
import { ClockCircleOutlined } from '@ant-design/icons'
import { PostData } from '@/app/types/Post/Post'
import { postService } from '@/app/services/post.service'
import { useState, useEffect, useCallback } from 'react'
import PendingPost from '@/app/components/Group/PendingPost'

const { Text } = Typography

interface MyPendingPostsModalProps {
  isModalOpen: boolean
  handleCancel: () => void
  groupId?: string
  onPostsUpdated: () => void
}

const MyPendingPostsModal = ({ isModalOpen, handleCancel, groupId, onPostsUpdated }: MyPendingPostsModalProps) => {
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string>('')
  const [myPendingPosts, setMyPendingPosts] = useState<PostData[]>([])

  const fetchMyPendingPosts = useCallback(async () => {
    try {
      setLoading(true)
      const response = await postService.getMyPendingPosts(groupId, 0, 50)
      setMyPendingPosts(response.posts || [])
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to load your pending posts'
      message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [groupId])

  useEffect(() => {
    if (isModalOpen) {
      fetchMyPendingPosts()
    }
  }, [isModalOpen, fetchMyPendingPosts])

  const handleCancelPost = async (postId: string) => {
    try {
      setActionLoading(postId)
      await postService.cancelPendingPost(postId)
      message.success('Post cancelled successfully!')
      await fetchMyPendingPosts()
      onPostsUpdated()
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to cancel post'
      message.error(errorMessage)
    } finally {
      setActionLoading('')
    }
  }

  return (
    <Modal
      title={
        <div className='flex items-center gap-2'>
          <ClockCircleOutlined className='text-blue-500' />
          <span>My Pending Posts</span>
          {myPendingPosts.length > 0 && <Tag color='blue'>{myPendingPosts.length}</Tag>}
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
      ) : myPendingPosts.length === 0 ? (
        <Empty description='You have no pending posts' image={Empty.PRESENTED_IMAGE_SIMPLE} className='py-8' />
      ) : (
        <>
          <div className='mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200'>
            <Text type='secondary' className='text-sm'>
              <ClockCircleOutlined className='mr-1' />
              Your posts are waiting for administrator approval before they appear in the group.
            </Text>
          </div>

          <div className='space-y-4'>
            {myPendingPosts.map((post) => (
              <PendingPost
                key={post.id}
                post={post}
                mode='user'
                onCancel={handleCancelPost}
                actionLoading={actionLoading}
              />
            ))}
          </div>
        </>
      )}
    </Modal>
  )
}

export default MyPendingPostsModal
