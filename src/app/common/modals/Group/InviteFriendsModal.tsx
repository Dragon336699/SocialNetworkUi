import { useState, useEffect } from 'react'
import { Modal, Avatar, Checkbox, Button, Input, Empty, message, Spin } from 'antd'
import { SearchOutlined, UserAddOutlined } from '@ant-design/icons'
import { relationService } from '@/app/services/relation.service'
import { groupService } from '@/app/services/group.service'
import { UserDto } from '@/app/types/User/user.dto'
import { ResponseHasData } from '@/app/types/Base/Responses/ResponseHasData'
import { GroupDto } from '@/app/types/Group/group.dto'
import { useCallback } from 'react'

interface InviteFriendsModalProps {
  isModalOpen: boolean
  handleCancel: () => void
  group: GroupDto
  onInviteSuccess: () => void
}

const InviteFriendsModal: React.FC<InviteFriendsModalProps> = ({
  isModalOpen,
  handleCancel,
  group,
  onInviteSuccess
}) => {
  const [friends, setFriends] = useState<UserDto[]>([])
  const [filteredFriends, setFilteredFriends] = useState<UserDto[]>([])
  const [selectedFriends, setSelectedFriends] = useState<string[]>([])
  const [searchText, setSearchText] = useState('')
  const [loading, setLoading] = useState(false)
  const [inviting, setInviting] = useState(false)

  const fetchFriendsNotInGroup = useCallback(async () => {
    try {
      setLoading(true)
      const response = await relationService.getFriendsList(undefined, 0, 1000)

      if (response.status === 200 && response.data && 'data' in response.data) {
        const resData = response.data as ResponseHasData<UserDto[]>
        let allFriends: UserDto[] = []
        if (resData.data && Array.isArray(resData.data)) {
          allFriends = resData.data as UserDto[]
        }

        const memberIds = new Set(group.groupUsers?.map((gu) => gu.userId) || [])

        const friendsNotInGroup = allFriends.filter((friend: UserDto) => !memberIds.has(friend.id))
        setFriends(friendsNotInGroup)
        setFilteredFriends(friendsNotInGroup)
      }
    } catch (error) {
      console.error('Error fetching friends:', error)
      message.error('Failed to load friends list')
    } finally {
      setLoading(false)
    }
  }, [group.groupUsers])

  const filterFriends = useCallback(() => {
    if (!searchText.trim()) {
      setFilteredFriends(friends)
      return
    }

    const searchLower = searchText.toLowerCase()
    const filtered = friends.filter((friend) => {
      const fullName = `${friend.firstName} ${friend.lastName}`.toLowerCase()
      return fullName.includes(searchLower) || friend.email?.toLowerCase().includes(searchLower)
    })
    setFilteredFriends(filtered)
  }, [searchText, friends])

  useEffect(() => {
    if (isModalOpen) {
      fetchFriendsNotInGroup()
    } else {
      setSelectedFriends([])
      setSearchText('')
    }
  }, [isModalOpen, fetchFriendsNotInGroup])

  useEffect(() => {
    filterFriends()
  }, [searchText, friends, filterFriends])

  const handleToggleSelect = (userId: string) => {
    setSelectedFriends((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId)
      } else {
        return [...prev, userId]
      }
    })
  }

  const handleSelectAll = () => {
    if (selectedFriends.length === filteredFriends.length) {
      setSelectedFriends([])
    } else {
      setSelectedFriends(filteredFriends.map((f) => f.id))
    }
  }

  const handleInvite = async () => {
    if (selectedFriends.length === 0) {
      message.warning('Please select at least one friend to invite')
      return
    }

    try {
      setInviting(true)
      let successCount = 0
      let failCount = 0

      for (const friendId of selectedFriends) {
        try {
          await groupService.inviteMember(group.id, friendId)
          successCount++
        } catch (error: any) {
          failCount++
          console.error(`Failed to invite friend ${friendId}:`, error)
        }
      }

      if (successCount > 0) {
        message.success(`Successfully invited ${successCount} friend${successCount > 1 ? 's' : ''}`)
        onInviteSuccess()
        handleCancel()
      }

      if (failCount > 0) {
        message.warning(`Failed to invite ${failCount} friend${failCount > 1 ? 's' : ''}`)
      }
    } catch {
      message.error('Failed to send invitations')
    } finally {
      setInviting(false)
    }
  }

  return (
    <Modal
      title={
        <div className='flex items-center gap-2'>
          <UserAddOutlined />
          <span>Invite Friends to {group.name}</span>
        </div>
      }
      open={isModalOpen}
      onCancel={handleCancel}
      width={600}
      footer={[
        <Button key='cancel' onClick={handleCancel}>
          Cancel
        </Button>,
        <Button
          key='invite'
          type='primary'
          loading={inviting}
          disabled={selectedFriends.length === 0}
          onClick={handleInvite}
        >
          Invite {selectedFriends.length > 0 ? `(${selectedFriends.length})` : ''}
        </Button>
      ]}
    >
      <div className='space-y-4'>
        <Input
          placeholder='Search friends...'
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
        />

        {filteredFriends.length > 0 && (
          <div className='flex items-center justify-between px-2 py-1 bg-gray-50 rounded'>
            <Checkbox
              checked={selectedFriends.length === filteredFriends.length && filteredFriends.length > 0}
              indeterminate={selectedFriends.length > 0 && selectedFriends.length < filteredFriends.length}
              onChange={handleSelectAll}
            >
              Select All
            </Checkbox>
            <span className='text-gray-500 text-sm'>{selectedFriends.length} selected</span>
          </div>
        )}

        {loading ? (
          <div className='flex justify-center py-8'>
            <Spin />
          </div>
        ) : filteredFriends.length === 0 ? (
          <Empty
            description={
              friends.length === 0
                ? 'All your friends are already in this group or have pending invitations'
                : 'No friends found'
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <div className='max-h-[400px] overflow-y-auto space-y-2'>
            {filteredFriends.map((friend) => (
              <div
                key={friend.id}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedFriends.includes(friend.id)
                    ? 'bg-blue-50 border-2 border-blue-200'
                    : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                }`}
                onClick={() => handleToggleSelect(friend.id)}
              >
                <Checkbox
                  checked={selectedFriends.includes(friend.id)}
                  onClick={(e) => e.stopPropagation()}
                  onChange={() => handleToggleSelect(friend.id)}
                />
                <Avatar size={40} src={friend.avatarUrl}>
                  {friend.firstName?.[0]?.toUpperCase()}
                </Avatar>
                <div className='flex-1'>
                  <div className='font-semibold text-gray-800'>
                    {friend.firstName} {friend.lastName}
                  </div>
                  {friend.email && <div className='text-sm text-gray-500'>{friend.email}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}

export default InviteFriendsModal
