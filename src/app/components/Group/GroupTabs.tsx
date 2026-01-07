import { Typography, Card, List, Avatar, Space, Empty, Dropdown, message, Popconfirm } from 'antd'
import { StarOutlined, CrownOutlined, MoreOutlined, StopOutlined, UserDeleteOutlined } from '@ant-design/icons'
import { Tag } from 'antd'
import { GroupDto, GroupRole, GroupUserDto } from '@/app/types/Group/group.dto'
import { PostData } from '@/app/types/Post/Post'
import { groupService } from '@/app/services/group.service'
import { useState } from 'react'

const { Title, Text } = Typography

interface GroupMembersTabProps {
  group: GroupDto
  currentUserId: string
  onMembersUpdated: () => void
}

export const GroupMembersTab = ({ group, currentUserId, onMembersUpdated }: GroupMembersTabProps) => {
  const [loadingUserId, setLoadingUserId] = useState<string>('')
  const [openDropdownUserId, setOpenDropdownUserId] = useState<string | null>(null)

  const currentUserRole = group.groupUsers?.find((gu) => gu.userId === currentUserId)?.roleName || ''
  const isSuperAdmin = currentUserRole === GroupRole.SuperAdministrator
  const isAdmin = currentUserRole === GroupRole.Administrator

  const renderRoleTag = (roleName: string) => {
    if (roleName === GroupRole.SuperAdministrator) {
      return (
        <Tag color='gold' icon={<StarOutlined />}>
          Owner
        </Tag>
      )
    }
    if (roleName === GroupRole.Administrator) {
      return (
        <Tag color='blue' icon={<CrownOutlined />}>
          Admin
        </Tag>
      )
    }
    return null
  }

  const canManageMember = (member: GroupUserDto) => {
    const isSelf = member.userId === currentUserId
    const isMemberSuperAdmin = member.roleName === GroupRole.SuperAdministrator
    const isMemberAdmin = member.roleName === GroupRole.Administrator

    if (isSelf) return false
    if (isMemberSuperAdmin) return false
    if (isSuperAdmin && (isMemberAdmin || member.roleName === GroupRole.User)) {
      return true
    }
    if (isAdmin && member.roleName === GroupRole.User) {
      return true
    }
    return false
  }

  const handleBan = async (targetUserId: string, memberName: string) => {
    try {
      setLoadingUserId(targetUserId)
      await groupService.banMember(group.id, targetUserId)
      message.success(`Successfully banned ${memberName}!`)
      onMembersUpdated()
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Unable to ban member'
      message.error(errorMessage)
    } finally {
      setLoadingUserId('')
      setOpenDropdownUserId(null)
    }
  }

  const handleKick = async (targetUserId: string, memberName: string) => {
    try {
      setLoadingUserId(targetUserId)
      await groupService.kickMember(group.id, targetUserId)
      message.success(`Successfully kicked ${memberName} from the group!`)
      onMembersUpdated()
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Unable to kick member'
      message.error(errorMessage)
    } finally {
      setLoadingUserId('')
      setOpenDropdownUserId(null)
    }
  }

  const members =
    group.groupUsers?.filter(
      (gu) =>
        gu.roleName !== GroupRole.Pending && gu.roleName !== GroupRole.Inviting && gu.roleName !== GroupRole.Banned
    ) || []

  return (
    <Card className='border-2 border-gray-200 rounded-lg'>
      <Title level={4} className='mb-4'>
        Members ({members.length})
      </Title>
      <div className='border-t-2 border-gray-200 mb-3'></div>
      <List
        dataSource={members}
        renderItem={(member: GroupUserDto) => {
          const memberName = member.user
            ? `${member.user.firstName || ''} ${member.user.lastName || ''}`.trim() || 'Unknown User'
            : 'Unknown User'

          const showActions = canManageMember(member)

          return (
            <List.Item
              actions={
                showActions
                  ? [
                      <Dropdown
                        key='actions'
                        open={openDropdownUserId === member.userId}
                        onOpenChange={(open) => setOpenDropdownUserId(open ? member.userId : null)}
                        trigger={['click']}
                        placement='bottomRight'
                        dropdownRender={() => (
                          <div className='bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px]'>
                            <Popconfirm
                              title='Ban Member'
                              description={
                                <div className='flex flex-col gap-1'>
                                  <span>Ban {memberName}?</span>
                                  <span className='text-xs text-gray-500'>
                                    They will be removed and cannot rejoin until unbanned.
                                  </span>
                                </div>
                              }
                              onConfirm={() => handleBan(member.userId, memberName)}
                              okText='Ban'
                              cancelText='Cancel'
                              okButtonProps={{ danger: true }}
                              placement='left'
                            >
                              <button
                                className='w-full flex items-center px-4 py-2 hover:bg-red-50 text-left border-0 bg-transparent group'
                                disabled={loadingUserId === member.userId}
                              >
                                <StopOutlined className='text-base mr-2 text-red-500' />
                                <span className='text-sm font-medium text-red-500 group-hover:text-red-700'>
                                  Ban Member
                                </span>
                              </button>
                            </Popconfirm>

                            <Popconfirm
                              title='Kick Member'
                              description={
                                <div className='flex flex-col gap-1'>
                                  <span>Kick {memberName}?</span>
                                  <span className='text-xs text-gray-500'>
                                    They will be removed from the group but can request to rejoin.
                                  </span>
                                </div>
                              }
                              onConfirm={() => handleKick(member.userId, memberName)}
                              okText='Kick'
                              cancelText='Cancel'
                              okButtonProps={{ danger: true }}
                              placement='left'
                            >
                              <button
                                className='w-full flex items-center px-4 py-2 hover:bg-orange-50 text-left border-0 bg-transparent group'
                                disabled={loadingUserId === member.userId}
                              >
                                <UserDeleteOutlined className='text-base mr-2 text-orange-500' />
                                <span className='text-sm font-medium text-orange-500 group-hover:text-orange-700'>
                                  Kick Member
                                </span>
                              </button>
                            </Popconfirm>
                          </div>
                        )}
                      >
                        <button
                          className='flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors border border-gray-300'
                          disabled={loadingUserId === member.userId}
                        >
                          {loadingUserId === member.userId ? (
                            <div className='w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin'></div>
                          ) : (
                            <MoreOutlined className='text-gray-600' />
                          )}
                        </button>
                      </Dropdown>
                    ]
                  : undefined
              }
            >
              <List.Item.Meta
                avatar={
                  <div className='border-2 border-gray-200 rounded-full'>
                    <Avatar size={48} src={member.user?.avatarUrl}>
                      {member.user?.firstName?.[0]?.toUpperCase() || 'U'}
                    </Avatar>
                  </div>
                }
                title={
                  <Space>
                    <span className='font-semibold'>{memberName}</span>
                    {renderRoleTag(member.roleName)}
                  </Space>
                }
                description={
                  <Text type='secondary' className='text-sm'>
                    Joined{' '}
                    {new Date(member.joinedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </Text>
                }
              />
            </List.Item>
          )
        }}
      />
    </Card>
  )
}

interface GroupPhotosTabProps {
  posts: PostData[]
  onImageClick: (images: string[], index: number) => void
}

export const GroupPhotosTab = ({ posts, onImageClick }: GroupPhotosTabProps) => {
  const allImages: Array<{ url: string; postId: string; postContent: string }> = []
  posts.forEach((post) => {
    if (post.postImages && post.postImages.length > 0) {
      post.postImages.forEach((img) => {
        if (img.imageUrl) {
          allImages.push({
            url: img.imageUrl,
            postId: post.id,
            postContent: post.content
          })
        }
      })
    }
  })

  return (
    <Card className='border-2 border-gray-200 rounded-lg'>
      <Title level={4} className='mb-4'>
        All Photos
      </Title>
      <div className='border-t-2 border-gray-200 mb-3'></div>
      {allImages.length > 0 ? (
        <div className='grid grid-cols-3 gap-3'>
          {allImages.map((image, index) => (
            <div
              key={index}
              className='aspect-square rounded-lg overflow-hidden border-2 border-gray-200 cursor-pointer hover:opacity-80 transition-opacity hover:shadow-lg'
              title={image.postContent.substring(0, 50)}
              onClick={() =>
                onImageClick(
                  allImages.map((img) => img.url),
                  index
                )
              }
            >
              <img src={image.url} alt={`Photo ${index + 1}`} className='w-full h-full object-cover' />
            </div>
          ))}
        </div>
      ) : (
        <Empty description='No photos yet' image={Empty.PRESENTED_IMAGE_SIMPLE} className='py-8' />
      )}
    </Card>
  )
}
