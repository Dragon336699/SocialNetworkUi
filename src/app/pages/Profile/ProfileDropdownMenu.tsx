import React, { useRef, useEffect } from 'react'
import { StopOutlined, UnorderedListOutlined } from '@ant-design/icons'

interface ProfileDropdownMenuProps {
  isOpen: boolean
  onClose: () => void
  isMe: boolean
  onViewBlockedUsers?: () => void
  onBlockUser?: () => void
}

const ProfileDropdownMenu: React.FC<ProfileDropdownMenuProps> = ({
  isOpen,
  onClose,
  isMe,
  onViewBlockedUsers,
  onBlockUser
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

  const handleClick = (action?: () => void) => {
    if (action) action()
    onClose()
  }

  return (
    <div
      ref={dropdownRef}
      className='absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden'
    >
      {isMe ? (
        <>
          {onViewBlockedUsers && (
            <button
              onClick={() => handleClick(onViewBlockedUsers)}
              className='w-full flex items-center px-4 py-2.5 hover:bg-gray-50 text-left border-0 bg-transparent transition-colors'
            >
              <UnorderedListOutlined className='text-lg mr-3 text-gray-600' />
              <span className='text-sm font-medium text-gray-900'>View Blocked Users</span>
            </button>
          )}
        </>
      ) : (
        <>
          {onBlockUser && (
            <button
              onClick={() => handleClick(onBlockUser)}
              className='w-full flex items-center px-4 py-2.5 hover:bg-red-50 text-left border-0 bg-transparent transition-colors group'
            >
              <StopOutlined className='text-lg mr-3 text-red-500 group-hover:text-red-600' />
              <span className='text-sm font-medium text-red-500 group-hover:text-red-600'>Block This User</span>
            </button>
          )}
        </>
      )}
    </div>
  )
}

export default ProfileDropdownMenu
