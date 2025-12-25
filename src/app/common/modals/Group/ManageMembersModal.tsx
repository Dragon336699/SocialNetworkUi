import { Modal, List, Avatar, Tag, Button, message, Popconfirm, Tooltip } from 'antd'
import { CrownOutlined, UserOutlined, StarOutlined, DeleteOutlined, UserDeleteOutlined, CloseOutlined } from '@ant-design/icons'
import { GroupDto, GroupUserDto } from '@/app/types/Group/group.dto'
import { groupService } from '@/app/services/group.service'
import { useState } from 'react'

interface ManageMembersModalProps {
  isModalOpen: boolean
  handleCancel: () => void
  group: GroupDto
  currentUserId: string
  onMembersUpdated: () => void
}

const ManageMembersModal = ({
  isModalOpen,
  handleCancel,
  group,
  currentUserId,
  onMembersUpdated
}: ManageMembersModalProps) => {
  const [loading, setLoading] = useState<string>('')

  const currentUserRole = group.groupUsers?.find(gu => gu.userId === currentUserId)?.roleName || ''
  const isSuperAdmin = currentUserRole === 'SuperAdministrator'
  const isAdmin = currentUserRole === 'Administrator'

  const adminCount =
    group.groupUsers?.filter(gu => gu.roleName === 'Administrator' || gu.roleName === 'SuperAdministrator').length || 0

  const handlePromote = async (targetUserId: string) => {
    try {
      setLoading(targetUserId)
      await groupService.promoteToAdmin(group.id, targetUserId)
      message.success('Successfully promoted user to admin!')
      onMembersUpdated()
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Unable to promote user'
      message.error(errorMessage)
    } finally {
      setLoading('')
    }
  }

  const handleDemote = async (targetUserId: string) => {
    try {
      setLoading(targetUserId)
      await groupService.demoteAdmin(group.id, targetUserId)
      message.success('Successfully demoted admin to member!')
      onMembersUpdated()
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Unable to demote admin'
      message.error(errorMessage)
    } finally {
      setLoading('')
    }
  }

  const handleKick = async (targetUserId: string, memberName: string) => {
    try {
      setLoading(targetUserId)
      await groupService.kickMember(group.id, targetUserId)
      message.success(`Successfully kicked ${memberName} from the group!`)
      onMembersUpdated()
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Unable to kick member'
      message.error(errorMessage)
    } finally {
      setLoading('')
    }
  }

  const canKickMember = (member: GroupUserDto) => {
    const isSelf = member.userId === currentUserId
    const isMemberSuperAdmin = member.roleName === 'SuperAdministrator'
    const isMemberAdmin = member.roleName === 'Administrator'

    if (isSelf) return false
    if (isMemberSuperAdmin) return false
    if (isSuperAdmin && (isMemberAdmin || member.roleName === 'User')) {
      return true
    }
    if (isAdmin && member.roleName === 'User') {
      return true
    }
    return false
  }

  const renderActions = (member: GroupUserDto) => {
    const isSelf = member.userId === currentUserId
    const isMemberSuperAdmin = member.roleName === 'SuperAdministrator'
    const isMemberAdmin = member.roleName === 'Administrator'
    const isMemberUser = member.roleName === 'User'
    const memberName = member.user
      ? `${member.user.firstName || ''} ${member.user.lastName || ''}`.trim() || 'this user'
      : 'this user'

    if (isSelf && isSuperAdmin) {
      return (
        <Tag color='gold' icon={<StarOutlined />}>
          You (Owner)
        </Tag>
      )
    }

    if (isSelf) {
      return <span className='text-gray-500 text-sm'>You</span>
    }
    if (!isSuperAdmin && !isAdmin) {
      return null
    }

    if (isMemberSuperAdmin) {
      return (
        <Tag color='gold' icon={<StarOutlined />}>
          Owner
        </Tag>
      )
    }

    const actions: React.ReactNode[] = []

    if (isSuperAdmin) {
      if (isMemberUser) {
        if (adminCount >= 10) {
          actions.push(
            <Tooltip key='promote' title='Maximum 10 admins reached'>
              <button 
                className='px-3 h-8 text-sm rounded border border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
                disabled
              >
                Make Admin
              </button>
            </Tooltip>
          )
        } else {
          actions.push(
            <Popconfirm
              key='promote'
              title='Promote to Admin'
              description={`Make ${memberName} an admin?`}
              onConfirm={() => handlePromote(member.userId)}
              okText='Yes'
              cancelText='No'
            >
              <button 
                className='px-3 h-8 text-sm font-semibold rounded border-2 border-blue-500 text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50'
                disabled={loading === member.userId}
              >
                {loading === member.userId ? (
                  <div className='w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin'></div>
                ) : (
                  'Make Admin'
                )}
              </button>
            </Popconfirm>
          )
        }
      }

      if (isMemberAdmin) {
        actions.push(
          <Popconfirm
            key='demote'
            title='Remove Admin Role'
            description={`Remove admin role from ${memberName}?`}
            onConfirm={() => handleDemote(member.userId)}
            okText='Yes'
            cancelText='No'
          >
            <button 
              className='px-3 h-8 text-sm font-semibold rounded text-red-600 border-2 border-transparent hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center gap-1'
              disabled={loading === member.userId}
            >
              {loading === member.userId ? (
                <div className='w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin'></div>
              ) : (
                <>
                  <DeleteOutlined />
                  <span>Remove Admin</span>
                </>
              )}
            </button>
          </Popconfirm>
        )
      }
    }

    if (canKickMember(member)) {
      const kickReason = isSuperAdmin ? (isMemberAdmin ? 'Kick this admin?' : 'Kick this member?') : 'Kick this member?'
      actions.push(
        <Popconfirm
          key='kick'
          title='Kick Member'
          description={
            <div className='flex flex-col gap-1'>
              <span>{kickReason}</span>
              <span className='text-xs text-gray-500'>
                {memberName} will be removed from the group.
              </span>
            </div>
          }
          onConfirm={() => handleKick(member.userId, memberName)}
          okText='Kick'
          cancelText='Cancel'
          okButtonProps={{ danger: true }}
        >
          <button 
            className='px-3 h-8 text-sm font-semibold rounded border-2 border-red-500 bg-red-500 text-white hover:bg-red-600 hover:border-red-600 transition-colors disabled:opacity-50 flex items-center gap-1'
            disabled={loading === member.userId}
          >
            {loading === member.userId ? (
              <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
            ) : (
              <>
                <UserDeleteOutlined />
                <span>Kick</span>
              </>
            )}
          </button>
        </Popconfirm>
      )
    }

    return actions.length > 0 ? <div className='flex items-center gap-2'>{actions}</div> : null
  }

  const renderRoleTag = (roleName: string) => {
    if (roleName === 'SuperAdministrator') {
      return (
        <Tag color='gold' icon={<StarOutlined />}>
          Owner
        </Tag>
      )
    }
    if (roleName === 'Administrator') {
      return (
        <Tag color='blue' icon={<CrownOutlined />}>
          Admin
        </Tag>
      )
    }
    return (
      <Tag color='default' icon={<UserOutlined />}>
        Member
      </Tag>
    )
  }

  const sortedMembers = [...(group.groupUsers || [])].sort((a, b) => {
    const roleOrder = { 'SuperAdministrator': 0, 'Administrator': 1, 'User': 2 }
    const roleA = roleOrder[a.roleName as keyof typeof roleOrder] ?? 3
    const roleB = roleOrder[b.roleName as keyof typeof roleOrder] ?? 3
    return roleA - roleB
  })

  return (
    <Modal
      title={
        <div className='flex justify-between items-center border-b-2 border-black pb-3 mb-4'>
          <div className='flex flex-col gap-1'>
            <span className='text-lg font-semibold'>Manage Members</span>
            {!isSuperAdmin && !isAdmin && (
              <span className='text-sm text-gray-500 font-normal'>
                Only admins can manage members
              </span>
            )}
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
      <div className='mb-4 flex items-center gap-4'>
        <span className='text-gray-600'>
          Total Members: <span className='font-bold text-black'>{group.memberCount}</span>
        </span>
        <span className='text-gray-400'>|</span>
        <span className='text-gray-600'>
          Admins: <span className={`font-bold ${adminCount >= 10 ? 'text-red-500' : 'text-black'}`}>{adminCount}/10</span>
        </span>
      </div>

      {!isSuperAdmin && isAdmin && (
        <div className='mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200'>
          <span className='text-sm text-blue-700'>
            💡 As an admin, you can kick regular members. Only the owner can manage admin roles.
          </span>
        </div>
      )}

      {!isSuperAdmin && !isAdmin && (
        <div className='mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200'>
          <span className='text-sm text-blue-700'>
            💡 Only the group owner and admins can manage members.
          </span>
        </div>
      )}

      <List
        dataSource={sortedMembers}
        renderItem={(member) => (
          <List.Item actions={[renderActions(member)]} className='border-b border-black last:border-b-0'>
            <List.Item.Meta
              avatar={
                <Avatar size={48} src={member.user?.avatarUrl} className='border-2 border-black'>
                  {member.user?.firstName?.[0]?.toUpperCase() || 'U'}
                </Avatar>
              }
              title={
                <div className='flex items-center gap-2'>
                  <span className='font-semibold'>
                    {member.user
                      ? `${member.user.firstName || ''} ${member.user.lastName || ''}`.trim() || 'Unknown User'
                      : 'Unknown User'}
                  </span>
                  {renderRoleTag(member.roleName)}
                </div>
              }
              description={
                <div className='flex flex-col'>
                  <span className='text-xs text-gray-600 font-medium'>
                    {member.user?.email || 'No email'}
                  </span>
                  <span className='text-xs text-gray-600'>
                    Joined: {new Date(member.joinedAt).toLocaleDateString('en-US')}
                  </span>
                </div>
              }
            />
          </List.Item>
        )}
      />
    </Modal>
  )
}

export default ManageMembersModal