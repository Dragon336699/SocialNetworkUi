import React, { useState, useEffect, useRef } from 'react'
import { Input, Spin, Avatar, Empty, message } from 'antd'
import { SearchOutlined, CloseOutlined, UserOutlined, TeamOutlined } from '@ant-design/icons'
import { searchService } from '@/app/services/search.service'
import { SearchType, SearchResultDto, SearchHistoryDto } from '@/app/types/Search/SearchType'
import { useNavigate } from 'react-router-dom'
import { groupService } from '@/app/services/group.service'
import { GroupRole } from '@/app/types/Group/group.dto'
import { userService } from '@/app/services/user.service'
import { interactionService } from '@/app/services/interaction.service'

interface SearchComponentProps {
  show: boolean
  onClose: () => void
}

const SearchComponent: React.FC<SearchComponentProps> = ({ show, onClose }) => {
  const [searchValue, setSearchValue] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResultDto | null>(null)
  const [searchHistory, setSearchHistory] = useState<SearchHistoryDto[]>([])
  const [myGroupIds, setMyGroupIds] = useState<string[]>([])
  const [currentUserId, setCurrentUserId] = useState<string>('')

  const debounceRef = useRef<NodeJS.Timeout>()
  const inputRef = useRef<any>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (show) {
      loadSearchHistory()
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    } else {
      setSearchValue('')
      setSearchResults(null)
    }
  }, [show])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (show) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [show, onClose])

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await userService.getUserInfoByToken()
        if (response.status === 200 && response.data && 'id' in response.data) {
          setCurrentUserId(response.data.id)
        }
      } catch (error) {
        console.error('Error fetching current user:', error)
      }
    }
    fetchCurrentUser()
  }, [])

  useEffect(() => {
    const fetchMyGroups = async () => {
      try {
        const response = await groupService.getMyGroups(0, 100)
        const approvedGroupIds = (response.groups || [])
          .filter((group) => {
            const userStatus = group.groupUsers?.find((gu) => gu.userId === currentUserId)
            return userStatus && userStatus.roleName !== GroupRole.Pending
          })
          .map((group) => group.id)
        setMyGroupIds(approvedGroupIds)
      } catch (error) {
        console.error('Error fetching my groups:', error)
      }
    }

    if (currentUserId) {
      fetchMyGroups()
    }
  }, [currentUserId])

  const loadSearchHistory = async () => {
    try {
      const response = await searchService.getRecentSearches(10)
      setSearchHistory(response.data || [])
    } catch (error) {
      console.error('Error loading search history:', error)
    }
  }

  const handleSearchPreview = async (keyword: string) => {
    if (!keyword.trim()) {
      setSearchResults(null)
      return
    }

    setIsSearching(true)
    try {
      const response = await searchService.search(keyword, SearchType.All, 0, 10, false)
      setSearchResults(response.results || null)
    } catch (error) {
      console.error('Error searching:', error)
    } finally {
      setIsSearching(false)
    }
  }

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (searchValue.trim()) {
      debounceRef.current = setTimeout(() => {
        handleSearchPreview(searchValue)
      }, 500)
    } else {
      setSearchResults(null)
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [searchValue])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value)
  }

  const handleSearchSubmit = async () => {
    if (searchValue.trim()) {
      try {
        await searchService.saveSearchHistory(searchValue.trim(), undefined, undefined)
        await loadSearchHistory()
      } catch (error) {
        console.error('Error saving search history:', error)
      }

      navigate(`/search?q=${encodeURIComponent(searchValue.trim())}`)
      onClose()
      setSearchValue('')
      setSearchResults(null)
    }
  }

  const handleDeleteHistory = async (historyId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await searchService.deleteSearchHistory(historyId)
      setSearchHistory((prev) => prev.filter((item) => item.id !== historyId))
      message.success('History cleared.')
    } catch (error) {
      console.error('Error deleting history:', error)
      message.error('Unable to clear history.')
    }
  }

  const handleClearAllHistory = async () => {
    try {
      await searchService.clearAllSearchHistory()
      setSearchHistory([])
      message.success('All history has been cleared.')
    } catch (error) {
      console.error('Error clearing history:', error)
      message.error('Unable to clear history.')
    }
  }

  const handleHistoryClick = (history: SearchHistoryDto) => {
    if (history.navigateUrl) {
      navigate(history.navigateUrl)
    } else if (history.content) {
      navigate(`/search?q=${encodeURIComponent(history.content)}`)
    }
    onClose()
    setSearchValue('')
    setSearchResults(null)
  }

  const handleResultClick = async (type: 'user' | 'group', item: any) => {
    try {
      if (type === 'user') {
        await searchService.saveSearchHistory(item.userName, item.avatarUrl || undefined, `/profile/${item.userName}`)
      } else if (type === 'group') {
        const isJoined = myGroupIds.includes(item.id)
        const navigateUrl = isJoined ? `/groups/${item.id}` : `/group/${item.id}`
        await searchService.saveSearchHistory(item.name, item.imageUrl || undefined, navigateUrl)
      }

      await loadSearchHistory()
    } catch (error) {
      console.error('Error saving search history:', error)
    }

    if (type === 'user') {
      interactionService.searchUser(item.id)
      navigate(`/profile/${item.userName}`)
    } else if (type === 'group') {
      const isJoined = myGroupIds.includes(item.id)
      if (isJoined) {
        navigate(`/groups/${item.id}`)
      } else {
        navigate(`/group/${item.id}`)
      }
    }
    onClose()
    setSearchValue('')
  }

  const handleClearInput = () => {
    setSearchValue('')
    setSearchResults(null)
    setTimeout(() => {
      inputRef.current?.focus()
    }, 0)
  }

  const renderContent = () => {
    if (searchValue.trim() && searchResults) {
      const { users, groups } = searchResults
      const hasResults = (users && users.length > 0) || (groups && groups.length > 0)

      if (!hasResults) {
        return (
          <div className='flex items-center justify-center py-8'>
            <Empty description='No search results found.' image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </div>
        )
      }

      return (
        <div className='overflow-y-auto max-h-[400px]'>
          {/* Users */}
          {users &&
            users.map((user) => (
              <div
                key={user.id}
                className='flex items-center px-3 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors'
                onClick={() => handleResultClick('user', user)}
              >
                <Avatar src={user.avatarUrl} size={36} icon={<UserOutlined />} className='border-2 border-gray-200' />
                <div className='ml-3 flex-1 min-w-0'>
                  <div className='font-semibold text-gray-900 text-sm truncate'>{user.userName}</div>
                  <div className='text-xs text-gray-500 truncate'>{user.firstName}</div>
                </div>
              </div>
            ))}

          {/* Groups */}
          {groups &&
            groups.map((group) => (
              <div
                key={group.id}
                className='flex items-center px-3 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors'
                onClick={() => handleResultClick('group', group)}
              >
                <Avatar src={group.imageUrl} size={36} icon={<TeamOutlined />} className='border-2 border-gray-200' />
                <div className='ml-3 flex-1 min-w-0'>
                  <div className='font-semibold text-gray-900 text-sm truncate'>{group.name}</div>
                  <div className='text-xs text-gray-500 truncate'>{group.isPublic ? 'Public' : 'Private'} Group</div>
                </div>
              </div>
            ))}
        </div>
      )
    }

    return (
      <div>
        <div className='flex items-center justify-between px-3 py-2.5 border-b border-gray-100'>
          <h3 className='text-sm font-bold text-gray-900'>Recent</h3>
          {searchHistory.length > 0 && (
            <button
              onClick={handleClearAllHistory}
              className='text-xs text-blue-600 hover:text-blue-700 font-semibold transition-colors'
            >
              Clear all
            </button>
          )}
        </div>

        {searchHistory.length === 0 ? (
          <div className='flex items-center justify-center py-8'>
            <Empty description='No recent searches.' image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </div>
        ) : (
          <div className='overflow-y-auto max-h-[400px]'>
            {searchHistory.map((history) => (
              <div
                key={history.id}
                className='flex items-center px-3 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors group'
                onClick={() => handleHistoryClick(history)}
              >
                <div className='flex items-center flex-1 min-w-0'>
                  {history.imageUrl ? (
                    <Avatar
                      src={history.imageUrl}
                      size={36}
                      icon={history.navigateUrl?.includes('/profile') ? <UserOutlined /> : <TeamOutlined />}
                      className='border-2 border-gray-200'
                    />
                  ) : (
                    <div className='w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center'>
                      <SearchOutlined className='text-gray-500 text-base' />
                    </div>
                  )}
                  <div className='ml-3 flex-1 min-w-0'>
                    <div className='text-sm font-semibold text-gray-900 truncate'>{history.content}</div>
                  </div>
                </div>
                <button
                  onClick={(e) => handleDeleteHistory(history.id, e)}
                  className='ml-2 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100'
                >
                  <CloseOutlined className='text-sm' />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (!show) return null

  return (
    <div
      ref={dropdownRef}
      className='absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 animate-in fade-in slide-in-from-top-2 duration-200'
      style={{
        maxWidth: '600px',
        margin: '0 auto'
      }}
    >
      <div className='p-3 border-b border-gray-100'>
        <Input
          ref={inputRef}
          placeholder='Search on Fricon'
          value={searchValue}
          onChange={handleInputChange}
          onPressEnter={handleSearchSubmit}
          prefix={<SearchOutlined className='text-gray-400' />}
          suffix={
            isSearching ? (
              <Spin size='small' />
            ) : searchValue ? (
              <CloseOutlined
                className='text-gray-400 cursor-pointer hover:text-gray-600 transition-colors'
                onClick={handleClearInput}
              />
            ) : null
          }
          className='rounded-lg border-gray-200'
          size='large'
        />
      </div>

      <div>{renderContent()}</div>
    </div>
  )
}

export default SearchComponent
