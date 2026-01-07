import React, { useRef, useEffect } from 'react'
import { Badge } from 'antd'
import {
  BellOutlined,
  TeamOutlined,
  EditOutlined,
  DeleteOutlined,
  CloseOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  StopOutlined
} from '@ant-design/icons'

interface GroupDropdownMenuProps {
  isOpen: boolean
  onClose: () => void
  isAdmin: boolean
  isSuperAdmin: boolean
  pendingRequestCount: number
  pendingPostCount?: number
  onPendingRequests: () => void
  onManageMembers: () => void
  onEditGroup: () => void
  onLeaveGroup: () => void
  onDeleteGroup: () => void
  onManagePosts?: () => void
  onBannedMembers?: () => void
}

const GroupDropdownMenu: React.FC<GroupDropdownMenuProps> = ({
  isOpen,
  onClose,
  isAdmin,
  isSuperAdmin,
  pendingRequestCount,
  pendingPostCount = 0,
  onPendingRequests,
  onManageMembers,
  onEditGroup,
  onLeaveGroup,
  onDeleteGroup,
  onManagePosts,
  onBannedMembers
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleClick = (action: () => void) => {
    action()
    onClose()
  }

  return (
    <div
      ref={dropdownRef}
      className='absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden'
    >
      {isAdmin && (
        <>
          <button
            onClick={() => handleClick(onPendingRequests)}
            className='w-full flex items-center justify-between px-4 py-2 hover:bg-gray-200 text-left border-0 bg-transparent'
          >
            <div className='flex items-center'>
              <BellOutlined className='text-lg mr-2 text-gray-600' />
              <span className='text-sm font-medium text-gray-900'>Join Requests</span>
            </div>
            {pendingRequestCount > 0 && <Badge count={pendingRequestCount} style={{ backgroundColor: '#52c41a' }} />}
          </button>

          <button
            onClick={() => handleClick(onManageMembers)}
            className='w-full flex items-center px-4 py-2 hover:bg-gray-200 text-left border-0 bg-transparent'
          >
            <TeamOutlined className='text-lg mr-2 text-gray-600' />
            <span className='text-sm font-medium text-gray-900'>Manage Members</span>
          </button>

          {onBannedMembers && (
            <button
              onClick={() => handleClick(onBannedMembers)}
              className='w-full flex items-center px-4 py-2 hover:bg-gray-200 text-left border-0 bg-transparent'
            >
              <StopOutlined className='text-lg mr-2 text-red-500' />
              <span className='text-sm font-medium text-gray-900'>Banned Members</span>
            </button>
          )}

          {onManagePosts && (
            <button
              onClick={() => handleClick(onManagePosts)}
              className='w-full flex items-center justify-between px-4 py-2 hover:bg-gray-200 text-left border-0 bg-transparent'
            >
              <div className='flex items-center'>
                <FileTextOutlined className='text-lg mr-2 text-gray-600' />
                <span className='text-sm font-medium text-gray-900'>Manage Posts</span>
              </div>
              {pendingPostCount > 0 && <Badge count={pendingPostCount} style={{ backgroundColor: '#fa8c16' }} />}
            </button>
          )}

          <button
            onClick={() => handleClick(onEditGroup)}
            className='w-full flex items-center px-4 py-2 hover:bg-gray-200 text-left border-0 bg-transparent'
          >
            <EditOutlined className='text-lg mr-2 text-gray-600' />
            <span className='text-sm font-medium text-gray-900'>Edit Group</span>
          </button>

          {isSuperAdmin ? (
            <button
              onClick={() => handleClick(onDeleteGroup)}
              className='w-full flex items-center px-4 py-2 hover:bg-red-100 text-left border-0 bg-transparent group'
            >
              <DeleteOutlined className='text-lg mr-2 text-red-500' />
              <span className='text-sm font-medium text-red-500 group-hover:text-red-700'>Delete Group</span>
            </button>
          ) : (
            <button
              onClick={() => handleClick(onLeaveGroup)}
              className='w-full flex items-center px-4 py-2 hover:bg-red-100 text-left border-0 bg-transparent group'
            >
              <DeleteOutlined className='text-lg mr-2 text-red-500' />
              <span className='text-sm font-medium text-red-500 group-hover:text-red-700'>Leave Group</span>
            </button>
          )}
        </>
      )}
    </div>
  )
}

interface PendingDropdownMenuProps {
  isOpen: boolean
  onClose: () => void
  onCancelRequest: () => void
}

export const PendingDropdownMenu: React.FC<PendingDropdownMenuProps> = ({ isOpen, onClose, onCancelRequest }) => {
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleClick = (action: () => void) => {
    action()
    onClose()
  }

  return (
    <div
      ref={dropdownRef}
      className='absolute right-0 top-full mt-1 w-auto bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden'
    >
      <button
        onClick={() => handleClick(onCancelRequest)}
        className='w-full flex items-center px-4 py-2 hover:bg-red-100 text-left border-0 bg-transparent group whitespace-nowrap'
      >
        <CloseOutlined className='text-base mr-2 text-red-500' />
        <span className='text-sm font-medium text-red-500 group-hover:text-red-700'>Cancel Request</span>
      </button>
    </div>
  )
}

interface JoinedDropdownMenuProps {
  isOpen: boolean
  onClose: () => void
  onLeaveGroup: () => void
  onMyPendingPosts?: () => void
  myPendingPostCount?: number
}

export const JoinedDropdownMenu: React.FC<JoinedDropdownMenuProps> = ({
  isOpen,
  onClose,
  onLeaveGroup,
  onMyPendingPosts,
  myPendingPostCount = 0
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleClick = (action: () => void) => {
    action()
    onClose()
  }

  return (
    <div
      ref={dropdownRef}
      className='absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden'
    >
      {onMyPendingPosts && (
        <button
          onClick={() => handleClick(onMyPendingPosts)}
          className='w-full flex items-center justify-between px-4 py-2 hover:bg-gray-200 text-left border-0 bg-transparent'
        >
          <div className='flex items-center'>
            <ClockCircleOutlined className='text-lg mr-2 text-gray-600' />
            <span className='text-sm font-medium text-gray-900'>My Pending Posts</span>
          </div>
          {myPendingPostCount > 0 && <Badge count={myPendingPostCount} style={{ backgroundColor: '#1890ff' }} />}
        </button>
      )}

      <button
        onClick={() => handleClick(onLeaveGroup)}
        className='w-full flex items-center px-3 py-1.5 hover:bg-red-100 text-left border-0 bg-transparent group'
      >
        <DeleteOutlined className='text-sm mr-1.5 text-red-500' />
        <span className='text-sm font-medium text-red-500 group-hover:text-red-700'>Leave Group</span>
      </button>
    </div>
  )
}

interface MemberDropdownMenuProps {
  isOpen: boolean
  onClose: () => void
  onMyPendingPosts: () => void
  myPendingPostCount?: number
}

export const MemberDropdownMenu: React.FC<MemberDropdownMenuProps> = ({
  isOpen,
  onClose,
  onMyPendingPosts,
  myPendingPostCount = 0
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      ref={dropdownRef}
      className='absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden'
    >
      <button
        onClick={() => {
          onMyPendingPosts()
          onClose()
        }}
        className='w-full flex items-center justify-between px-4 py-2 hover:bg-gray-200 text-left border-0 bg-transparent'
      >
        <div className='flex items-center'>
          <ClockCircleOutlined className='text-lg mr-2 text-gray-600' />
          <span className='text-sm font-medium text-gray-900'>My Pending Posts</span>
        </div>
        {myPendingPostCount > 0 && <Badge count={myPendingPostCount} style={{ backgroundColor: '#1890ff' }} />}
      </button>
    </div>
  )
}

export default GroupDropdownMenu
