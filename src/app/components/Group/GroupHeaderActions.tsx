import { Button, Badge } from 'antd'
import { UserAddOutlined, MoreOutlined, CheckOutlined } from '@ant-design/icons'
import GroupDropdownMenu, { JoinedDropdownMenu, MemberDropdownMenu } from '@/app/pages/Group/GroupDropdownMenu'

interface GroupHeaderActionsProps {
  isAdmin: boolean
  isSuperAdmin: boolean
  pendingRequestCount: number
  pendingPostCount: number
  myPendingPostCount: number
  showAdminDropdown: boolean
  showJoinedDropdown: boolean
  showMemberDropdown: boolean
  onToggleAdminDropdown: () => void
  onToggleJoinedDropdown: () => void
  onToggleMemberDropdown: () => void
  onCloseAdminDropdown: () => void
  onCloseJoinedDropdown: () => void
  onCloseMemberDropdown: () => void
  onInviteFriends: () => void
  onPendingRequests: () => void
  onManageMembers: () => void
  onEditGroup: () => void
  onLeaveGroup: () => void
  onDeleteGroup: () => void
  onManagePosts: () => void
  onMyPendingPosts: () => void
  onBannedMembers: () => void
}

const GroupHeaderActions = ({
  isAdmin,
  isSuperAdmin,
  pendingRequestCount,
  pendingPostCount,
  myPendingPostCount,
  showAdminDropdown,
  showJoinedDropdown,
  showMemberDropdown,
  onToggleAdminDropdown,
  onToggleJoinedDropdown,
  onToggleMemberDropdown,
  onCloseAdminDropdown,
  onCloseJoinedDropdown,
  onCloseMemberDropdown,
  onInviteFriends,
  onPendingRequests,
  onManageMembers,
  onEditGroup,
  onLeaveGroup,
  onDeleteGroup,
  onManagePosts,
  onMyPendingPosts,
  onBannedMembers
}: GroupHeaderActionsProps) => {
  return (
    <div className='ml-4 flex items-center gap-2'>
      <Button type='primary' icon={<UserAddOutlined />} onClick={onInviteFriends} className='flex items-center'>
        Invite
      </Button>

      {isAdmin ? (
        <div className='relative'>
          <button
            onClick={onToggleAdminDropdown}
            className='flex items-center gap-2 px-3.5 py-1.5 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm font-medium relative'
          >
            <MoreOutlined />
            {(pendingRequestCount > 0 || pendingPostCount > 0) && (
              <Badge count={pendingRequestCount + pendingPostCount} offset={[10, 0]} />
            )}
          </button>
          <GroupDropdownMenu
            isOpen={showAdminDropdown}
            onClose={onCloseAdminDropdown}
            isAdmin={isAdmin}
            isSuperAdmin={isSuperAdmin}
            pendingRequestCount={pendingRequestCount}
            pendingPostCount={pendingPostCount}
            onPendingRequests={onPendingRequests}
            onManageMembers={onManageMembers}
            onEditGroup={onEditGroup}
            onLeaveGroup={onLeaveGroup}
            onDeleteGroup={onDeleteGroup}
            onManagePosts={onManagePosts}
            onBannedMembers={onBannedMembers}
          />
        </div>
      ) : (
        <>
          <div className='relative'>
            <button
              onClick={onToggleJoinedDropdown}
              className='flex items-center gap-2 px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 transition-colors'
            >
              <CheckOutlined />
              <span>Joined</span>
            </button>
            <JoinedDropdownMenu
              isOpen={showJoinedDropdown}
              onClose={onCloseJoinedDropdown}
              onLeaveGroup={onLeaveGroup}
            />
          </div>

          <div className='relative'>
            <button
              onClick={onToggleMemberDropdown}
              className='flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-100 transition-colors'
            >
              <MoreOutlined />
              {myPendingPostCount > 0 && <Badge count={myPendingPostCount} style={{ backgroundColor: '#1890ff' }} />}
            </button>
            <MemberDropdownMenu
              isOpen={showMemberDropdown}
              onClose={onCloseMemberDropdown}
              onMyPendingPosts={onMyPendingPosts}
              myPendingPostCount={myPendingPostCount}
            />
          </div>
        </>
      )}
    </div>
  )
}

export default GroupHeaderActions
