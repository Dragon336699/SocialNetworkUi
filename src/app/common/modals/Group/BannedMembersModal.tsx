import { Modal, List, Avatar, Button, message, Popconfirm, Empty, Spin } from 'antd'
import { CloseOutlined, StopOutlined } from '@ant-design/icons'
import { GroupUserDto } from '@/app/types/Group/group.dto'
import { groupService } from '@/app/services/group.service'
import { useState, useEffect, useCallback } from 'react'

interface BannedMembersModalProps {
  isModalOpen: boolean
  handleCancel: () => void
  groupId: string
  onMembersUpdated: () => void
}

const BannedMembersModal = ({ isModalOpen, handleCancel, groupId, onMembersUpdated }: BannedMembersModalProps) => {
  const [bannedMembers, setBannedMembers] = useState<GroupUserDto[]>([])
  const [loading, setLoading] = useState(false)
  const [unbanningUserId, setUnbanningUserId] = useState<string>('')

  const fetchBannedMembers = useCallback(async () => {
    if (!groupId) return

    try {
      setLoading(true)
      const response = await groupService.getBannedMembers(groupId, 0, 100)
      setBannedMembers(response.bannedMembers || [])
    } catch (error: any) {
      console.error('Error fetching banned members:', error)
      setBannedMembers([])
    } finally {
      setLoading(false)
    }
  }, [groupId])

  useEffect(() => {
    if (isModalOpen) {
      fetchBannedMembers()
    }
  }, [isModalOpen, fetchBannedMembers])

  const handleUnban = async (targetUserId: string, memberName: string) => {
    try {
      setUnbanningUserId(targetUserId)
      await groupService.unbanMember(groupId, targetUserId)
      message.success(`Successfully unbanned ${memberName}!`)
      await fetchBannedMembers()
      onMembersUpdated()
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Unable to unban member'
      message.error(errorMessage)
    } finally {
      setUnbanningUserId('')
    }
  }

  return (
    <Modal
      title={
        <div className='flex justify-between items-center border-b-2 border-gray-200 pb-3 mb-4'>
          <div className='flex flex-col gap-1'>
            <span className='text-lg font-semibold flex items-center gap-2'>
              <StopOutlined className='text-red-500' />
              Banned Members
            </span>
            <span className='text-sm text-gray-500 font-normal'>Members who have been banned from the group</span>
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
      ) : bannedMembers.length === 0 ? (
        <Empty description='No banned members' image={Empty.PRESENTED_IMAGE_SIMPLE} className='py-8' />
      ) : (
        <>
          <div className='mb-4'>
            <span className='text-gray-600'>
              Total Banned: <span className='font-bold text-red-500'>{bannedMembers.length}</span>
            </span>
          </div>

          <List
            dataSource={bannedMembers}
            renderItem={(member) => {
              const memberName = member.user
                ? `${member.user.firstName || ''} ${member.user.lastName || ''}`.trim() || 'Unknown User'
                : 'Unknown User'

              return (
                <List.Item
                  actions={[
                    <Popconfirm
                      key='unban'
                      title='Unban Member'
                      description={
                        <div className='flex flex-col gap-1'>
                          <span>Unban {memberName}?</span>
                          <span className='text-xs text-gray-500'>
                            They will be able to request to join the group again.
                          </span>
                        </div>
                      }
                      onConfirm={() => handleUnban(member.userId, memberName)}
                      okText='Unban'
                      cancelText='Cancel'
                      okButtonProps={{ className: 'bg-green-500 hover:bg-green-600' }}
                    >
                      <button
                        className='px-3 h-8 text-sm font-semibold rounded border-2 border-green-500 text-green-600 hover:bg-green-200 transition-colors disabled:opacity-50 flex items-center gap-1'
                        disabled={unbanningUserId === member.userId}
                      >
                        {unbanningUserId === member.userId ? (
                          <div className='w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin'></div>
                        ) : (
                          'Unban'
                        )}
                      </button>
                    </Popconfirm>
                  ]}
                  className='border-b border-gray-200 last:border-b-0'
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar size={48} src={member.user?.avatarUrl} className='border-2 border-gray-200'>
                        {member.user?.firstName?.[0]?.toUpperCase() || 'U'}
                      </Avatar>
                    }
                    title={
                      <div className='flex items-center gap-2'>
                        <span className='font-semibold'>{memberName}</span>
                        <span className='text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded'>Banned</span>
                      </div>
                    }
                    description={
                      <div className='flex flex-col'>
                        <span className='text-xs text-gray-600 font-medium'>{member.user?.email || 'No email'}</span>
                        <span className='text-xs text-gray-600'>
                          Banned on: {new Date(member.joinedAt).toLocaleDateString('en-US')}
                        </span>
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

export default BannedMembersModal
