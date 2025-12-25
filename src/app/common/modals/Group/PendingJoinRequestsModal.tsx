import { Modal, List, Avatar, Button, message, Popconfirm, Empty, Spin } from 'antd'
import { CheckOutlined, CloseOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { GroupUserDto } from '@/app/types/Group/group.dto'
import { groupService } from '@/app/services/group.service'
import { useState, useEffect } from 'react'

interface PendingJoinRequestsModalProps {
  isModalOpen: boolean
  handleCancel: () => void
  groupId: string
  onRequestsUpdated: () => void
}

const PendingJoinRequestsModal = ({
  isModalOpen,
  handleCancel,
  groupId,
  onRequestsUpdated
}: PendingJoinRequestsModalProps) => {
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string>('')
  const [pendingRequests, setPendingRequests] = useState<GroupUserDto[]>([])

  useEffect(() => {
    if (isModalOpen) {
      fetchPendingRequests()
    }
  }, [isModalOpen, groupId])

  const fetchPendingRequests = async () => {
    try {
      setLoading(true)
      const response = await groupService.getPendingJoinRequests(groupId, 0, 50)
      setPendingRequests(response.pendingRequests || [])
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to load pending requests'
      message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (targetUserId: string, userName: string) => {
    try {
      setActionLoading(targetUserId)
      await groupService.approveJoinRequest(groupId, targetUserId)
      message.success(`Approved ${userName}'s request to join!`)
      await fetchPendingRequests()
      onRequestsUpdated()
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to approve request'
      message.error(errorMessage)
    } finally {
      setActionLoading('')
    }
  }

  const handleReject = async (targetUserId: string, userName: string) => {
    try {
      setActionLoading(targetUserId)
      await groupService.rejectJoinRequest(groupId, targetUserId)
      message.success(`Rejected ${userName}'s request`)
      await fetchPendingRequests()
      onRequestsUpdated()
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to reject request'
      message.error(errorMessage)
    } finally {
      setActionLoading('')
    }
  }

  const renderActions = (request: GroupUserDto) => {
    const userName = request.user
      ? `${request.user.firstName || ''} ${request.user.lastName || ''}`.trim() || 'this user'
      : 'this user'

    return (
      <div className='flex items-center gap-2'>
        <Popconfirm
          title='Approve Request'
          description={`Allow ${userName} to join the group?`}
          onConfirm={() => handleApprove(request.userId, userName)}
          okText='Approve'
          cancelText='Cancel'
          okButtonProps={{ type: 'primary' }}
        >
          <button 
            className='px-3 h-8 text-sm font-semibold rounded border-2 border-blue-500 bg-blue-500 text-white hover:bg-blue-600 hover:border-blue-600 transition-colors disabled:opacity-50 flex items-center gap-1'
            disabled={actionLoading === request.userId}
          >
            {actionLoading === request.userId ? (
              <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
            ) : (
              <>
                <CheckOutlined />
                <span>Approve</span>
              </>
            )}
          </button>
        </Popconfirm>

        <Popconfirm
          title='Reject Request'
          description={`Reject ${userName}'s request to join?`}
          onConfirm={() => handleReject(request.userId, userName)}
          okText='Reject'
          cancelText='Cancel'
          okButtonProps={{ danger: true }}
        >
          <button 
            className='px-3 h-8 text-sm font-semibold rounded border-2 border-red-500 bg-red-500 text-white hover:bg-red-600 hover:border-red-600 transition-colors disabled:opacity-50 flex items-center gap-1'
            disabled={actionLoading === request.userId}
          >
            {actionLoading === request.userId ? (
              <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
            ) : (
              <>
                <CloseOutlined />
                <span>Reject</span>
              </>
            )}
          </button>
        </Popconfirm>
      </div>
    )
  }

  return (
    <Modal
      title={
        <div className='flex justify-between items-center border-b-2 border-black pb-3 mb-4'>
          <div className='flex flex-col gap-1'>
            <span className='text-lg font-semibold'>Join Requests</span>
            <span className='text-sm text-gray-500 font-normal'>
              Manage pending requests to join this group
            </span>
          </div>
          <Button
            icon={<CloseOutlined />}
            onClick={handleCancel}
            className='border border-gray-300 bg-gray-100 hover:bg-gray-200 rounded'
          />
        </div>
      }
      open={isModalOpen}
      onCancel={handleCancel}
      footer={null}
      width={650}
      closable={false}
      centered={false}
      maskClosable={false}
      style={{ 
        borderRadius: '8px', 
        overflow: 'visible',
        padding: 0,
        top: 50
      }}
      styles={{
        content: { 
          padding: 0,
          border: '2px solid #000000',
          borderRadius: '8px',
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
          overflow: 'visible'
        },
        body: { 
          padding: '0 24px 24px 24px',
          overflow: 'visible'
        },
        header: {
          padding: '16px 24px 0 24px',
          marginBottom: 0
        }
      }}
    >
      {loading ? (
        <div className='text-center py-8'>
          <Spin size='large' />
        </div>
      ) : pendingRequests.length > 0 ? (
        <>
          <div className='mb-4'>
            <span className='text-gray-600'>
              Pending Requests: <span className='font-bold text-black'>{pendingRequests.length}</span>
            </span>
          </div>

          <List
            dataSource={pendingRequests}
            renderItem={(request) => (
              <List.Item actions={[renderActions(request)]} className='border-b border-black last:border-b-0'>
                <List.Item.Meta
                  avatar={
                    <Avatar size={48} src={request.user?.avatarUrl} className='border-2 border-black'>
                      {request.user?.firstName?.[0]?.toUpperCase() || 'U'}
                    </Avatar>
                  }
                  title={
                    <div className='flex items-center gap-2'>
                      <span className='font-semibold'>
                        {request.user
                          ? `${request.user.firstName || ''} ${request.user.lastName || ''}`.trim() || 'Unknown User'
                          : 'Unknown User'}
                      </span>
                      <ClockCircleOutlined className='text-yellow-500' />
                    </div>
                  }
                  description={
                    <div className='flex flex-col'>
                      <span className='text-xs text-gray-600 font-medium'>
                        {request.user?.email || 'No email'}
                      </span>
                      <span className='text-xs text-gray-600'>
                        Requested: {new Date(request.joinedAt).toLocaleDateString('en-US')}
                      </span>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </>
      ) : (
        <Empty 
          description='No pending join requests' 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          className='py-8'
        />
      )}
    </Modal>
  )
}

export default PendingJoinRequestsModal