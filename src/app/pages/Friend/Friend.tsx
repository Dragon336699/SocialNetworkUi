import React, { useState, useMemo, useEffect } from 'react'
import { Input, Empty, Tabs, Spin, message } from 'antd'
import { SearchOutlined, TeamOutlined, SendOutlined, UserOutlined } from '@ant-design/icons'
import { ActionType, Friend } from '@/app/types/Common'
import FriendCard from '@/app/components/Friend/FriendCard'
import RequestCard from '@/app/components/Friend/RequestCard'
import ActionConfirmModal from '@/app/common/Modals/ActionConfirmModal'
import { relationService } from '@/app/services/relation.service'
import { UserDto } from '@/app/types/User/user.dto'
import { FriendRequestStatus } from '@/app/types/UserRelation/userRelation'

const defaultAvatar = 'src/app/assests/icons/image-avatar.svg'
const FriendsList: React.FC = () => {
  const [friends, setFriends] = useState<(Friend & { userName: string })[]>([])
  const [sentRequests, setSentRequests] = useState<(Friend & { sentAt: string; userName: string })[]>([])
  const [receivedRequests, setReceivedRequests] = useState<(Friend & { sentAt: string; userName: string })[]>([])

  const [searchText, setSearchText] = useState('')
  const [activeTab, setActiveTab] = useState('friends')
  const [loading, setLoading] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null)
  const [currentAction, setCurrentAction] = useState<ActionType>('unfriend')
  const [globalLoading, setGlobalLoading] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null)

  const fetchFriends = async () => {
    setLoading(true)
    try {
      const { data, status } = await relationService.getFriendsList(1, 100)
      console.log('🚀 ~ fetchFriends ~ data:', data)
      if (status === 200 && data) {
        const list = (data.data as any).data

        const mappedFriends = list.map((user: UserDto) => ({
          id: user.id,
          name: `${user.lastName} ${user.firstName}`,
          avatar: user.avatarUrl || defaultAvatar,
          status: user.status,
          userName: user.userName
        }))
        setFriends(mappedFriends)
      }
    } catch (error) {
      console.error('Failed to fetch friends', error)
      message.error('Không thể tải danh sách bạn bè')
    } finally {
      setLoading(false)
    }
  }

  const fetchReceivedRequests = async () => {
    setLoading(true)
    try {
      const { data, status } = await relationService.getFriendRequestsReceived(1, 100)
      if (status === 200 && data) {
        const list = (data.data as any).data

        const mappedReceived = list.map((user: any) => ({
          id: user.sender.id,
          name: `${user.sender.lastName} ${user.sender.firstName}`,
          avatar: user.sender.avatarUrl || defaultAvatar,
          status: user.sender.status,
          userName: user.sender.userName,
          sentAt: user.createdAt
        }))
        setReceivedRequests(mappedReceived)
      }
    } catch (error) {
      console.error('Failed to fetch received requests', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSentRequests = async () => {
    setLoading(true)
    try {
      const { data, status } = await relationService.getFriendRequestsSent(1, 100)
      if (status === 200 && data) {
        const list = (data.data as any).data

        const mappedSent = list.map((user: any) => ({
          id: user.receiver.id,
          name: `${user.receiver?.lastName} ${user.receiver?.firstName}`,
          avatar: user.receiver?.avatarUrl || defaultAvatar,
          status: user.receiver?.isOnline ? 'online' : 'offline',
          userName: user.receiver?.userName,
          sentAt: user.createdAt
        }))
        setSentRequests(mappedSent)
      }
    } catch (error) {
      console.error('Failed to fetch sent requests', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFriends()
    fetchReceivedRequests()
    fetchSentRequests()
  }, [])

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

    try {
      const res = await relationService.removeFriend(String(selectedFriend.id))
      if (res.status === 200) {
        message.success('Unfriend success!')
        fetchFriends()
      }
    } catch {
      message.error('Unfriend failed')
    } finally {
      setGlobalLoading(false)
      setModalOpen(false)
      setSelectedFriend(null)
    }
  }

  const handleRequestAction = async (targetUserId: string, type: 'accept' | 'decline' | 'cancel') => {
    setActionLoadingId(Number(targetUserId))
    try {
      let response

      if (type === 'accept') {
        response = await relationService.respondFriendRequest(targetUserId, FriendRequestStatus.Accepted)
      } else if (type === 'decline') {
        response = await relationService.respondFriendRequest(targetUserId, FriendRequestStatus.Rejected)
      } else if (type === 'cancel') {
        response = await relationService.cancelFriendRequest(targetUserId)
      }

      if (response && response.status === 200) {
        if (type === 'accept') {
          fetchReceivedRequests()
          fetchFriends()
          message.success('Friend request accepted')
        } else if (type === 'decline') {
          fetchReceivedRequests()
          message.success('Request declined')
        } else if (type === 'cancel') {
          fetchSentRequests()
          message.success('Request cancelled')
        }
      } else {
        message.error(response?.data?.message || 'Action failed')
      }
    } catch (error) {
      console.error(error)
      message.error('An error occurred')
    } finally {
      setActionLoadingId(null)
    }
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

  const renderTabContent = (data: any[], type: 'friends' | 'received' | 'sent') => {
    if (loading) {
      return (
        <div className='flex justify-center py-10'>
          <Spin size='large' />
        </div>
      )
    }

    const isEmpty = data.length === 0

    return (
      <div className='mt-4'>
        {renderSearchBar(`Search ${type}...`)}
        {!isEmpty ? (
          <div className='grid grid-cols-1 gap-3'>
            {type === 'friends' &&
              data.map((friend) => <FriendCard key={friend.id} friend={friend} onAction={handleOpenModalAction} />)}
            {type === 'received' &&
              data.map((req) => (
                <RequestCard
                  key={req.id}
                  friend={req}
                  type='received'
                  onConfirm={(id) => handleRequestAction(String(id), 'accept')}
                  onDelete={(id) => handleRequestAction(String(id), 'decline')}
                  loading={actionLoadingId === req.id}
                />
              ))}
            {type === 'sent' &&
              data.map((req) => (
                <RequestCard
                  key={req.id}
                  friend={req}
                  type='sent'
                  onDelete={(id) => handleRequestAction(String(id), 'cancel')}
                  loading={actionLoadingId === req.id}
                />
              ))}
          </div>
        ) : (
          <Empty description={`No ${type} found`} className='my-10' />
        )}
      </div>
    )
  }

  const items = [
    {
      key: 'friends',
      label: (
        <span>
          <TeamOutlined className='mr-2' />
          Friends ({friends.length})
        </span>
      ),
      children: renderTabContent(filteredFriends, 'friends')
    },
    {
      key: 'received',
      label: (
        <span>
          <UserOutlined className='mr-2' />
          Requests ({receivedRequests.length})
        </span>
      ),
      children: renderTabContent(filteredReceived, 'received')
    },
    {
      key: 'sent',
      label: (
        <span>
          <SendOutlined className='mr-2' />
          Sent ({sentRequests.length})
        </span>
      ),
      children: renderTabContent(filteredSent, 'sent')
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
