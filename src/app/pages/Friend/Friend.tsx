'use client'

import React, { useState, useMemo } from 'react'
import { Input, Empty, Tabs } from 'antd'
import { SearchOutlined, TeamOutlined } from '@ant-design/icons'
import { ActionType, Friend } from '@/app/types/Common'
import FriendCard from '@/app/components/Friend/FriendCard'
import ActionConfirmModal from '@/app/common/Modals/ActionConfirmModal'

const MOCK_FRIENDS: Friend[] = [
  { id: 1, name: 'Nguyen Van A', avatar: 'https://i.pravatar.cc/150?u=1', status: 'online' },
  { id: 2, name: 'Tran Thi B', avatar: 'https://i.pravatar.cc/150?u=2', status: 'offline' },
  { id: 3, name: 'Pham Minh C', avatar: 'https://i.pravatar.cc/150?u=3', status: 'online' },
  { id: 4, name: 'Do Kien D', avatar: 'https://i.pravatar.cc/150?u=4', status: 'away' }
]

const FriendsList: React.FC = () => {
  const [friends, setFriends] = useState<Friend[]>(MOCK_FRIENDS)
  const [searchText, setSearchText] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null)
  const [currentAction, setCurrentAction] = useState<ActionType>('unfriend')
  const [loading, setLoading] = useState(false)

  const filteredFriends = useMemo(() => {
    return friends.filter((f) => f.name.toLowerCase().includes(searchText.toLowerCase()))
  }, [friends, searchText])

  const handleOpenAction = (type: ActionType, friend: Friend) => {
    setSelectedFriend(friend)
    setCurrentAction(type)
    setModalOpen(true)
  }

  const handleConfirmAction = async () => {
    if (!selectedFriend) return

    setLoading(true)

    await new Promise((resolve) => setTimeout(resolve, 1000))

    console.log(`✅ Executed: ${currentAction} on ${selectedFriend.name}`)

    if (currentAction === 'unfriend' || currentAction === 'block') {
      setFriends((prev) => prev.filter((f) => f.id !== selectedFriend.id))
    }

    setLoading(false)
    setModalOpen(false)
    setSelectedFriend(null)
  }

  const renderFriendList = () => (
    <div className='mt-4'>
      <Input
        prefix={<SearchOutlined className='text-gray-400' />}
        placeholder='Search friends...'
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        allowClear
        className='mb-6 py-2 rounded-lg'
      />

      {filteredFriends.length > 0 ? (
        <div className='grid grid-cols-1 gap-3'>
          {filteredFriends.map((friend) => (
            <FriendCard key={friend.id} friend={friend} onAction={handleOpenAction} />
          ))}
        </div>
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='No matching friends found' className='my-10' />
      )}
    </div>
  )

  const items = [
    {
      key: 'friends',
      label: (
        <span className='flex items-center gap-2 px-2'>
          <TeamOutlined />
          Friends ({friends.length})
        </span>
      ),
      children: renderFriendList()
    },
    {
      key: 'requests',
      label: 'Friend Requests (0)',
      children: <Empty description='No new requests' className='my-10' />
    }
  ]

  return (
    <div className='mx-auto max-w-3xl p-4 md:p-6'>
      <div className='bg-white rounded-2xl shadow-sm border border-gray-200 p-6'>
        <h1 className='text-2xl font-bold mb-4 text-gray-800'>Friends List</h1>

        <Tabs defaultActiveKey='friends' items={items} className='custom-tabs' />
      </div>

      <ActionConfirmModal
        open={modalOpen}
        friend={selectedFriend}
        type={currentAction}
        loading={loading}
        onCancel={() => setModalOpen(false)}
        onConfirm={handleConfirmAction}
      />
    </div>
  )
}

export default FriendsList
