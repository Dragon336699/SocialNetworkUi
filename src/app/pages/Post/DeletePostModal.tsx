import React from 'react'
import { Modal, message } from 'antd'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import { postService } from '@/app/services/post.service'

interface DeletePostModalProps {
  isOpen: boolean
  onClose: () => void
  onDeleteSuccess: () => void
  postId: string
}

const DeletePostModal: React.FC<DeletePostModalProps> = ({ isOpen, onClose, onDeleteSuccess, postId }) => {
  const handleDelete = async () => {
    try {
      message.loading({ content: 'Deleting post...', key: 'deletePost' })
      await postService.deletePost(postId)
      message.success({
        content: 'Post deleted successfully!',
        key: 'deletePost',
        duration: 3
      })

      onDeleteSuccess()
      onClose()
    } catch (error) {
      console.error('Error deleting post:', error)
      message.error({
        content: 'Failed to delete post. Please try again.',
        key: 'deletePost',
        duration: 5
      })
    }
  }

  return (
    <Modal
      title={
        <div className='flex items-center' style={{ borderBottom: '1px solid #000000', paddingBottom: '12px' }}>
          <ExclamationCircleOutlined className='text-red-500 mr-2' />
          <span className='font-semibold'>Delete post</span>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={
        <div style={{ borderTop: '1px solid #000000', paddingTop: '12px' }}>
          <button
            onClick={onClose}
            className='px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-200 transition-colors mr-2'
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className='px-4 py-2 rounded-md border border-red-500 bg-red-500 text-white font-medium hover:bg-red-600 transition-colors'
          >
            Delete
          </button>
        </div>
      }
      centered
      width={420}
      closable={false}
      style={{ 
        borderRadius: '8px', 
        overflow: 'hidden',
        padding: 0
      }}
      styles={{
        content: { 
          padding: 0,
          border: '1px solid #000000',
          borderRadius: '8px',
          overflow: 'hidden'
        },
        body: { 
          padding: '16px 24px'
        },
        header: {
          padding: '16px 24px 0 24px',
          marginBottom: 0,
          borderBottom: 'none'
        },
        footer: {
          padding: '0 24px 16px 24px',
          marginTop: 0
        }
      }}
    >
      <div className='py-4'>
        <p className='text-gray-900 font-medium'>Are you sure you want to delete this post?</p>
        <p className='text-gray-500 text-sm mt-2'>
          This action cannot be undone. The post and all its comments will be permanently deleted.
        </p>
      </div>
    </Modal>
  )
}

export default DeletePostModal