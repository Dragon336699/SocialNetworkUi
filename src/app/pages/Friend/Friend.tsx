'use client'

import React, { useState, useMemo } from 'react'
import { Input, Empty, Tabs } from 'antd'
import { SearchOutlined, TeamOutlined, SendOutlined, UserOutlined } from '@ant-design/icons'
import { ActionType, Friend } from '@/app/types/Common'
import FriendCard from '@/app/components/Friend/FriendCard'
import RequestCard from '@/app/components/Friend/RequestCard'
import ActionConfirmModal from '@/app/common/Modals/ActionConfirmModal'

const MOCK_FRIENDS: Friend[] = [
  { id: 1, name: 'Nguyen Van A', avatar: 'https://i.pravatar.cc/150?u=1', status: 'online' },
  { id: 2, name: 'B', avatar: 'https://i.pravatar.cc/150?u=2', status: 'offline' },
  { id: 3, name: 'Pham Minh C', avatar: 'https://i.pravatar.cc/150?u=3', status: 'online' },
  { id: 4, name: 'Do Kien D', avatar: 'https://i.pravatar.cc/150?u=4', status: 'away' }
]

const MOCK_SENT_REQUESTS: (Friend & { sentAt: string })[] = [
  { id: 10, name: 'Le Van E', avatar: 'https://i.pravatar.cc/150?u=10', status: 'offline', sentAt: '2 days ago' },
  { id: 11, name: 'Hoang Thi F', avatar: 'https://i.pravatar.cc/150?u=11', status: 'online', sentAt: '5 hours ago' }
]

const MOCK_RECEIVED_REQUESTS: (Friend & { sentAt: string })[] = [
  { id: 20, name: 'Michael Jordan', avatar: 'https://i.pravatar.cc/150?u=20', status: 'online', sentAt: '10 mins ago' },
  { id: 21, name: 'Elon Musk', avatar: 'https://i.pravatar.cc/150?u=21', status: 'away', sentAt: '1 day ago' }
]

const FriendsList: React.FC = () => {
  const [friends, setFriends] = useState(MOCK_FRIENDS)
  const [sentRequests, setSentRequests] = useState(MOCK_SENT_REQUESTS)
  const [receivedRequests, setReceivedRequests] = useState(MOCK_RECEIVED_REQUESTS)

  const [searchText, setSearchText] = useState('')
  const [activeTab, setActiveTab] = useState('friends')

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null)
  const [currentAction, setCurrentAction] = useState<ActionType>('unfriend')
  const [globalLoading, setGlobalLoading] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null)

  const filteredFriends = useMemo(
    () => friends.filter((f) => f.name.toLowerCase().includes(searchText.toLowerCase())),
    [friends, searchText]
  )
  const filteredSent = useMemo(
    () => sentRequests.filter((f) => f.name.toLowerCase().includes(searchText.toLowerCase())),
    [sentRequests, searchText]
  )
  const filteredReceived = useMemo(
    () => receivedRequests.filter((f) => f.name.toLowerCase().includes(searchText.toLowerCase())),
    [receivedRequests, searchText]
  )

  const handleTabChange = (key: string) => {
    setActiveTab(key)
    setSearchText('')
  }

  const handleOpenModalAction = (type: ActionType, friend: Friend) => {
    setSelectedFriend(friend)
    setCurrentAction(type)
    setModalOpen(true)
  }

  const handleConfirmModalAction = async () => {
    if (!selectedFriend) return
    setGlobalLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 800))

    if (currentAction === 'unfriend' || currentAction === 'block') {
      setFriends((prev) => prev.filter((f) => f.id !== selectedFriend.id))
    }
    setGlobalLoading(false)
    setModalOpen(false)
    setSelectedFriend(null)
  }

  const handleRequestAction = async (id: number, type: 'accept' | 'decline' | 'cancel') => {
    setActionLoadingId(id)
    await new Promise((resolve) => setTimeout(resolve, 800)) // Fake API

    if (type === 'accept') {
      const request = receivedRequests.find((r) => r.id === id)
      if (request) {
        setFriends((prev) => [{ ...request, status: 'online' }, ...prev])
        setReceivedRequests((prev) => prev.filter((r) => r.id !== id))
      }
    } else if (type === 'decline') {
      setReceivedRequests((prev) => prev.filter((r) => r.id !== id))
    } else if (type === 'cancel') {
      setSentRequests((prev) => prev.filter((r) => r.id !== id))
    }

    setActionLoadingId(null)
  }

  const renderSearchBar = (placeholder: string) => (
    <Input
      prefix={<SearchOutlined className='text-gray-400' />}
      placeholder={placeholder}
      value={searchText}
      onChange={(e) => setSearchText(e.target.value)}
      allowClear
      className='mb-6 py-2 rounded-lg'
    />
  )

  const items = [
    {
      key: 'friends',
      label: (
        <span>
          <TeamOutlined className='mr-2' />
          Friends ({friends.length})
        </span>
      ),
      children: (
        <div className='mt-4'>
          {renderSearchBar('Search friends...')}
          {filteredFriends.length > 0 ? (
            <div className='grid grid-cols-1 gap-3'>
              {filteredFriends.map((friend) => (
                <FriendCard key={friend.id} friend={friend} onAction={handleOpenModalAction} />
              ))}
            </div>
          ) : (
            <Empty description='No friends found' className='my-10' />
          )}
        </div>
      )
    },
    {
      key: 'received',
      label: (
        <span>
          <UserOutlined className='mr-2' />
          Requests ({receivedRequests.length})
        </span>
      ),
      children: (
        <div className='mt-4'>
          {renderSearchBar('Search received requests...')}
          {filteredReceived.length > 0 ? (
            <div className='grid grid-cols-1 gap-3'>
              {filteredReceived.map((req) => (
                <RequestCard
                  key={req.id}
                  friend={req}
                  type='received'
                  onConfirm={(id) => handleRequestAction(id, 'accept')}
                  onDelete={(id) => handleRequestAction(id, 'decline')}
                  loading={actionLoadingId === req.id}
                />
              ))}
            </div>
          ) : (
            <Empty description='No new requests' className='my-10' />
          )}
        </div>
      )
    },
    {
      key: 'sent',
      label: (
        <span>
          <SendOutlined className='mr-2' />
          Sent ({sentRequests.length})
        </span>
      ),
      children: (
        <div className='mt-4'>
          {renderSearchBar('Search sent requests...')}
          {filteredSent.length > 0 ? (
            <div className='grid grid-cols-1 gap-3'>
              {filteredSent.map((req) => (
                <RequestCard
                  key={req.id}
                  friend={req}
                  type='sent'
                  onDelete={(id) => handleRequestAction(id, 'cancel')}
                  loading={actionLoadingId === req.id}
                />
              ))}
            </div>
          ) : (
            <Empty description='No sent requests found' className='my-10' />
          )}
        </div>
      )
    }
  ]

  return (
    <div className='mx-auto max-w-3xl p-4 md:p-6'>
      <div className='bg-white rounded-2xl shadow-sm border border-gray-200 p-6'>
        <h1 className='text-2xl font-bold mb-4 text-gray-800'>Friends List</h1>
        <Tabs activeKey={activeTab} onChange={handleTabChange} items={items} className='custom-tabs' />
      </div>

      <ActionConfirmModal
        open={modalOpen}
        friend={selectedFriend}
        type={currentAction}
        loading={globalLoading}
        onCancel={() => setModalOpen(false)}
        onConfirm={handleConfirmModalAction}
      />
    </div>
  )
}

export default FriendsList
