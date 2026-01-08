import React, { useState, useMemo, useEffect } from 'react'
import { Input, Empty, Tabs, message, Avatar, Button, Typography } from 'antd'
import {
  SearchOutlined,
  TeamOutlined,
  SendOutlined,
  UserOutlined,
  UserAddOutlined,
  CheckOutlined
} from '@ant-design/icons'
import { ActionType } from '@/app/types/Common'
import FriendCard from '@/app/components/Friend/FriendCard'
import RequestCard from '@/app/components/Friend/RequestCard'
import ActionConfirmModal from '@/app/common/Modals/ActionConfirmModal'
import { relationService } from '@/app/services/relation.service'
import { ResponseHasData } from '@/app/types/Base/Responses/ResponseHasData'
import { UserDto } from '@/app/types/User/user.dto'
import { SentFriendRequestData, SuggestUsers } from '@/app/types/UserRelation/userRelation'
import { DEFAULT_AVATAR_URL } from '@/app/common/Assests/CommonVariable'

const { Title, Text } = Typography

const FriendsList: React.FC = () => {
  const [friends, setFriends] = useState<UserDto[]>([])
  const [requestedSuggestIds, setRequestedSuggestIds] = useState<string[]>([])
  const [sentRequests, setSentRequests] = useState<SentFriendRequestData[]>([])
  const [receivedRequests, setReceivedRequests] = useState<SentFriendRequestData[]>([])
  const [suggestUser, setSuggestUsers] = useState<SuggestUsers[]>([])

  const [searchText, setSearchText] = useState('')
  const [activeTab, setActiveTab] = useState('friends')

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedFriend, setSelectedFriend] = useState<UserDto | null>(null)
  const [currentAction, setCurrentAction] = useState<ActionType>('unfriend')
  const [globalLoading, setGlobalLoading] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  const filteredFriends = useMemo(
    () =>
      friends.filter((f: UserDto) => (f.firstName + ' ' + f.lastName).toLowerCase().includes(searchText.toLowerCase())),
    [friends, searchText]
  )
  const filteredSent = useMemo(
    () =>
      sentRequests.filter((f) =>
        (f.receiver?.firstName + ' ' + f.receiver?.lastName).toLowerCase().includes(searchText.toLowerCase())
      ),
    [sentRequests, searchText]
  )
  const filteredReceived = useMemo(
    () =>
      receivedRequests.filter((f) =>
        (f.sender?.firstName + ' ' + f.sender?.lastName).toLowerCase().includes(searchText.toLowerCase())
      ),
    [receivedRequests, searchText]
  )

  const handleTabChange = (key: string) => {
    setActiveTab(key)
    setSearchText('')
  }

  const handleOpenModalAction = (type: ActionType, friend: UserDto) => {
    setSelectedFriend(friend)
    setCurrentAction(type)
    setModalOpen(true)
  }

  const handleConfirmModalAction = async () => {
    if (!selectedFriend) return
    setGlobalLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 800))

    try {
      if (currentAction === 'unfriend') {
        await relationService.unFriend(selectedFriend.id)
        message.success('Unfriended successfully')
        getFriends()
      } else if (currentAction === 'block') {
        await relationService.blockUser(selectedFriend.id)
        message.success('User blocked successfully')
        getFriends()
        getSuggestFriends()
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Action failed'
      message.error(errorMessage)
    } finally {
      setGlobalLoading(false)
      setModalOpen(false)
      setSelectedFriend(null)
    }
  }

  const getFriends = async () => {
    try {
      const res = await relationService.getFriendsList()
      if (res.status === 200) {
        const resData = res.data as ResponseHasData<UserDto[]>
        setFriends(resData.data as UserDto[])
      } else {
        message.error('Error while getting friend list')
      }
    } catch (e) {
      console.log('Error get list follower: ', e)
    }
  }

  const approveFriendRequest = async (senderId: string) => {
    try {
      setActionLoadingId(senderId)
      const res = await relationService.approveFriendRequest(senderId)
      if (res.status === 200) {
        message.success('Friend request approved')
        getFriendRequestsReceived()
        getFriends()
      }
    } finally {
      setActionLoadingId(null)
    }
  }

  const declineFriendRequest = async (senderId: string) => {
    try {
      setActionLoadingId(senderId)
      const res = await relationService.declineFriendRequest(senderId)
      if (res.status === 200) {
        message.success('Friend request declined')
        getFriendRequestsReceived()
      }
    } finally {
      setActionLoadingId(null)
    }
  }

  const cancelFriendRequest = async (receiverId: string) => {
    try {
      setActionLoadingId(receiverId)
      const res = await relationService.cancelFriendRequest(receiverId)
      if (res.status === 200) {
        message.success('Request canceled')
        getFriendRequestsSent()
      }
    } finally {
      setActionLoadingId(null)
    }
  }

  const getFriendRequestsReceived = async () => {
    try {
      const res = await relationService.getFriendRequestsReceived()
      if (res.status === 200) setReceivedRequests((res.data as any).data)
    } catch (e) {
      console.error(e)
    }
  }

  const getFriendRequestsSent = async () => {
    try {
      const res = await relationService.getFriendRequestsSent()
      if (res.status === 200) setSentRequests((res.data as any).data)
    } catch (e) {
      console.error(e)
    }
  }

  const getSuggestFriends = async () => {
    try {
      const res = await relationService.getSuggestFriends()
      if (res.status === 200) setSuggestUsers((res.data as any).data)
    } catch (e) {
      console.error(e)
    }
  }

  const handleAddFriend = async (userId: string) => {
    const res = await relationService.addFriend(userId)
    if (res.status === 200) {
      message.success('Friend request sent')
      setRequestedSuggestIds((prev) => [...prev, userId])
    }
  }

  useEffect(() => {
    getFriendRequestsReceived()
    getFriends()
    getFriendRequestsSent()
    getSuggestFriends()
  }, [])

  const renderSearchBar = (placeholder: string) => (
    <Input
      prefix={<SearchOutlined className='text-gray-400' />}
      placeholder={placeholder}
      value={searchText}
      onChange={(e) => setSearchText(e.target.value)}
      allowClear
      className='mb-4 py-2 rounded-full bg-[#F0F2F5] border-none'
    />
  )

  const tabItems = [
    {
      key: 'friends',
      label: (
        <span>
          <TeamOutlined className='mr-2' />
          Friends ({friends.length})
        </span>
      ),
      children: (
        <div className='mt-2'>
          {renderSearchBar('Search friends...')}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {filteredFriends.length > 0 ? (
              filteredFriends.map((friend: any) => (
                <FriendCard key={friend.id} friend={friend} onAction={handleOpenModalAction} />
              ))
            ) : (
              <Empty description='No friends found' />
            )}
          </div>
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
        <div className='mt-2'>
          {renderSearchBar('Search received requests...')}
          <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
            {filteredReceived.map((req) => (
              <RequestCard
                key={req.senderId}
                request={req}
                type='received'
                onConfirm={() => approveFriendRequest(req.senderId)}
                onDelete={() => declineFriendRequest(req.senderId)}
                loading={actionLoadingId === req.senderId}
              />
            ))}
          </div>
          {filteredReceived.length === 0 && <Empty description='No requests' />}
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
        <div className='mt-2'>
          {renderSearchBar('Search sent requests...')}
          <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
            {filteredSent.map((req) => (
              <RequestCard
                key={req.receiverId}
                request={req}
                type='sent'
                onDelete={() => cancelFriendRequest(req.receiverId)}
                loading={actionLoadingId === req.receiverId}
              />
            ))}
          </div>
          {filteredSent.length === 0 && <Empty description='No sent requests' />}
        </div>
      )
    }
  ]

  return (
    <div className='min-h-screen bg-[#F0F2F5] pt-6'>
      <div className='max-w-[1200px] mx-auto px-4 flex justify-center gap-8'>
        <div className='w-full max-w-[800px]'>
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <Title level={3} className='mb-4'>
              Friends List
            </Title>
            <Tabs activeKey={activeTab} onChange={handleTabChange} items={tabItems} className='custom-tabs' />
          </div>
        </div>

        <div className='hidden xl:block w-[320px] sticky top-20'>
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-4'>
            <div className='flex justify-between items-center mb-4 px-2'>
              <Text className='font-semibold text-[#65676B] text-[17px]'>Suggestions</Text>
            </div>
            <div className='space-y-4'>
              {suggestUser.map((req) => {
                const isRequested = requestedSuggestIds.includes(req.user.id)
                return (
                  <div key={req.user.id} className='flex items-center justify-between group px-2'>
                    <div className='flex gap-3 items-center overflow-hidden'>
                      <Avatar size={40} src={req.user.avatarUrl || DEFAULT_AVATAR_URL} />
                      <div className='overflow-hidden'>
                        <h4 className='font-semibold text-[15px] truncate m-0'>
                          {req.user.lastName + ' ' + req.user.firstName}
                        </h4>
                        <Text type='secondary' className='text-[12px]'>
                          {req.mutualFriendCount} mutual friends
                        </Text>
                      </div>
                    </div>
                    <Button
                      type={isRequested ? 'default' : 'primary'}
                      shape='circle'
                      icon={isRequested ? <CheckOutlined /> : <UserAddOutlined />}
                      disabled={isRequested}
                      onClick={() => handleAddFriend(req.user.id)}
                      className={isRequested ? 'bg-green-50 text-green-600' : ''}
                    />
                  </div>
                )
              })}
              {suggestUser.length === 0 && <Empty description='No suggestions' image={Empty.PRESENTED_IMAGE_SIMPLE} />}
            </div>
          </div>
        </div>
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
