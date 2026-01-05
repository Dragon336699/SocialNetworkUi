import { Typography, Card, List, Avatar, Space, Empty } from 'antd'
import { StarOutlined, CrownOutlined } from '@ant-design/icons'
import { Tag } from 'antd'
import { GroupDto, GroupRole, GroupUserDto } from '@/app/types/Group/group.dto'
import { PostData } from '@/app/types/Post/Post'

const { Title, Text } = Typography

interface GroupMembersTabProps {
  group: GroupDto
}

export const GroupMembersTab = ({ group }: GroupMembersTabProps) => {
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

  const members = group.groupUsers?.filter((gu) => gu.roleName !== GroupRole.Pending && gu.roleName !== GroupRole.Inviting) || []

  return (
    <Card className='border-2 border-gray-200 rounded-lg'>
      <Title level={4} className='mb-4'>
        Members ({members.length})
      </Title>
      <div className='border-t-2 border-gray-200 mb-3'></div>
      <List
        dataSource={members}
        renderItem={(member: GroupUserDto) => (
          <List.Item>
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
                  <span className='font-semibold'>
                    {member.user
                      ? `${member.user.firstName || ''} ${member.user.lastName || ''}`.trim() || 'Unknown User'
                      : 'Unknown User'}
                  </span>
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
        )}
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
