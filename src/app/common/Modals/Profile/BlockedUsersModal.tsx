import { Modal, List, Avatar, Button, message, Popconfirm, Empty, Spin } from 'antd'
import { CloseOutlined, StopOutlined } from '@ant-design/icons'
import { UserDto } from '@/app/types/User/user.dto'
import { relationService } from '@/app/services/relation.service'
import { useState, useEffect, useCallback } from 'react'
import { DEFAULT_AVATAR_URL } from '@/app/common/Assests/CommonVariable'
import { useNavigate } from 'react-router-dom'

interface BlockedUsersModalProps {
  isModalOpen: boolean
  handleCancel: () => void
  onUsersUpdated?: () => void
}

const BlockedUsersModal = ({ isModalOpen, handleCancel, onUsersUpdated }: BlockedUsersModalProps) => {
  const navigate = useNavigate()
  const [blockedUsers, setBlockedUsers] = useState<UserDto[]>([])
  const [loading, setLoading] = useState(false)
  const [unblockingUserId, setUnblockingUserId] = useState<string>('')

  const fetchBlockedUsers = useCallback(async () => {
    try {
      setLoading(true)
      const response = await relationService.getBlockedUsers(0, 100)
      setBlockedUsers(response.data.data as UserDto[])
    } catch (error: any) {
      console.error('Error fetching blocked users:', error)
      setBlockedUsers([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isModalOpen) {
      fetchBlockedUsers()
    }
  }, [isModalOpen, fetchBlockedUsers])

  const handleUnblock = async (targetUserId: string, userName: string) => {
    try {
      setUnblockingUserId(targetUserId)
      await relationService.unblockUser(targetUserId)
      message.success(`Successfully unblocked ${userName}!`)
      await fetchBlockedUsers()
      if (onUsersUpdated) onUsersUpdated()
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Unable to unblock user'
      message.error(errorMessage)
    } finally {
      setUnblockingUserId('')
    }
  }

  return (
    <Modal
      title={
        <div className='flex justify-between items-center border-b-2 border-gray-200 pb-3 mb-4'>
          <div className='flex flex-col gap-1'>
            <span className='text-lg font-semibold flex items-center gap-2'>
              <StopOutlined className='text-red-500' />
              Blocked Users
            </span>
            <span className='text-sm text-gray-500 font-normal'>Users you have blocked</span>
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
      width={550}
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
          border: '2px solid #E5E7EB',
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
        <div className='flex justify-center py-8'>
          <Spin size='large' />
        </div>
      ) : blockedUsers.length === 0 ? (
        <Empty description='No blocked users' image={Empty.PRESENTED_IMAGE_SIMPLE} className='py-8' />
      ) : (
        <>
          <div className='mb-4'>
            <span className='text-gray-600'>
              Total Blocked: <span className='font-bold text-red-500'>{blockedUsers.length}</span>
            </span>
          </div>

          <List
            dataSource={blockedUsers}
            renderItem={(user) => {
              const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User'

              return (
                <List.Item
                  actions={[
                    <Popconfirm
                      key='unblock'
                      title='Unblock User'
                      description={
                        <div className='flex flex-col gap-1'>
                          <span>Unblock {userName}?</span>
                          <span className='text-xs text-gray-500'>
                            You will be able to interact with this user again.
                          </span>
                        </div>
                      }
                      onConfirm={() => handleUnblock(user.id, userName)}
                      okText='Unblock'
                      cancelText='Cancel'
                      okButtonProps={{ className: 'bg-green-500 hover:bg-green-600' }}
                    >
                      <button
                        className='px-3 h-8 text-sm font-semibold rounded border-2 border-green-500 text-green-600 hover:bg-green-200 transition-colors disabled:opacity-50 flex items-center gap-1'
                        disabled={unblockingUserId === user.id}
                      >
                        {unblockingUserId === user.id ? (
                          <div className='w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin'></div>
                        ) : (
                          'Unblock'
                        )}
                      </button>
                    </Popconfirm>
                  ]}
                  className='border-b border-gray-200 last:border-b-0 cursor-pointer hover:bg-gray-50'
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        size={48}
                        src={user.avatarUrl || DEFAULT_AVATAR_URL}
                        className='border-2 border-gray-200 cursor-pointer'
                        onClick={() => navigate(`/profile/${user.userName}`)}
                      >
                        {user.firstName?.[0]?.toUpperCase() || 'U'}
                      </Avatar>
                    }
                    title={
                      <div className='flex items-center gap-2'>
                        <span
                          className='font-semibold hover:underline cursor-pointer'
                          onClick={() => navigate(`/profile/${user.userName}`)}
                        >
                          {userName}
                        </span>
                        <span className='text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded'>Blocked</span>
                      </div>
                    }
                    description={
                      <div className='flex flex-col'>
                        <span className='text-xs text-gray-600 font-medium'>@{user.userName || 'No username'}</span>
                        <span className='text-xs text-gray-600'>{user.email || 'No email'}</span>
                      </div>
                    }
                  />
                </List.Item>
              )
            }}
          />
        </>
      )}
    </Modal>
  )
}

export default BlockedUsersModal
