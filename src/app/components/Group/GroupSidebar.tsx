import { Typography, Button } from 'antd'
import { GlobalOutlined, LockOutlined, UserOutlined, FileTextOutlined } from '@ant-design/icons'
import { GroupDto } from '@/app/types/Group/group.dto'
import { PostData } from '@/app/types/Post/Post'

const { Title, Text } = Typography

interface GroupSidebarProps {
  group: GroupDto
  posts: PostData[]
  onViewAllPhotos: () => void
  onImageClick: (images: string[], index: number) => void
}

const GroupSidebar = ({ group, posts, onViewAllPhotos, onImageClick }: GroupSidebarProps) => {
  const getAllImages = () => {
    const allImages: string[] = []
    posts.forEach((post) => {
      if (post.postImages && post.postImages.length > 0) {
        post.postImages.forEach((img) => {
          if (img.imageUrl) {
            allImages.push(img.imageUrl)
          }
        })
      }
    })
    return allImages
  }

  const renderImageLayout = (imagesToShow: string[], allImages: string[], displayCount: number) => {
    if (displayCount === 1) {
      return (
        <div className='grid grid-cols-1 gap-3 mb-3'>
          <div
            className='rounded-lg overflow-hidden border-2 border-gray-200 cursor-pointer hover:opacity-80 transition-opacity h-[200px]'
            onClick={() => onImageClick(allImages, 0)}
          >
            <img src={imagesToShow[0]} alt='Media 1' className='w-full h-full object-cover' />
          </div>
        </div>
      )
    } else if (displayCount === 2) {
      return (
        <div className='grid grid-cols-1 gap-3 mb-3'>
          {imagesToShow.map((imageUrl, index) => (
            <div
              key={index}
              className='rounded-lg overflow-hidden border-2 border-gray-200 cursor-pointer hover:opacity-80 transition-opacity h-[140px]'
              onClick={() => onImageClick(allImages, index)}
            >
              <img src={imageUrl} alt={`Media ${index + 1}`} className='w-full h-full object-cover' />
            </div>
          ))}
        </div>
      )
    } else if (displayCount === 3) {
      return (
        <div className='grid grid-cols-1 gap-3 mb-3'>
          {imagesToShow.map((imageUrl, index) => (
            <div
              key={index}
              className='rounded-lg overflow-hidden border-2 border-gray-200 cursor-pointer hover:opacity-80 transition-opacity h-[140px]'
              onClick={() => onImageClick(allImages, index)}
            >
              <img src={imageUrl} alt={`Media ${index + 1}`} className='w-full h-full object-cover' />
            </div>
          ))}
        </div>
      )
    } else if (displayCount === 4) {
      return (
        <div className='space-y-3 mb-3'>
          <div className='grid grid-cols-2 gap-3'>
            {imagesToShow.slice(0, 2).map((imageUrl, index) => (
              <div
                key={index}
                className='rounded-lg overflow-hidden border-2 border-gray-200 cursor-pointer hover:opacity-80 transition-opacity aspect-[4/3]'
                onClick={() => onImageClick(allImages, index)}
              >
                <img src={imageUrl} alt={`Media ${index + 1}`} className='w-full h-full object-cover' />
              </div>
            ))}
          </div>
          <div className='grid grid-cols-1 gap-3'>
            {imagesToShow.slice(2, 4).map((imageUrl, index) => (
              <div
                key={index + 2}
                className='rounded-lg overflow-hidden border-2 border-gray-200 cursor-pointer hover:opacity-80 transition-opacity h-[140px]'
                onClick={() => onImageClick(allImages, index + 2)}
              >
                <img src={imageUrl} alt={`Media ${index + 3}`} className='w-full h-full object-cover' />
              </div>
            ))}
          </div>
        </div>
      )
    } else if (displayCount === 5) {
      return (
        <div className='space-y-3 mb-3'>
          <div className='grid grid-cols-2 gap-3'>
            {imagesToShow.slice(0, 2).map((imageUrl, index) => (
              <div
                key={index}
                className='rounded-lg overflow-hidden border-2 border-gray-200 cursor-pointer hover:opacity-80 transition-opacity aspect-[4/3]'
                onClick={() => onImageClick(allImages, index)}
              >
                <img src={imageUrl} alt={`Media ${index + 1}`} className='w-full h-full object-cover' />
              </div>
            ))}
          </div>
          <div className='grid grid-cols-2 gap-3'>
            {imagesToShow.slice(2, 4).map((imageUrl, index) => (
              <div
                key={index + 2}
                className='rounded-lg overflow-hidden border-2 border-gray-200 cursor-pointer hover:opacity-80 transition-opacity aspect-[4/3]'
                onClick={() => onImageClick(allImages, index + 2)}
              >
                <img src={imageUrl} alt={`Media ${index + 3}`} className='w-full h-full object-cover' />
              </div>
            ))}
          </div>
          <div className='grid grid-cols-1 gap-3'>
            <div
              className='rounded-lg overflow-hidden border-2 border-gray-200 cursor-pointer hover:opacity-80 transition-opacity h-[140px]'
              onClick={() => onImageClick(allImages, 4)}
            >
              <img src={imagesToShow[4]} alt='Media 5' className='w-full h-full object-cover' />
            </div>
          </div>
        </div>
      )
    } else {
      return (
        <div className='grid grid-cols-2 gap-3 mb-5'>
          {imagesToShow.map((imageUrl, index) => (
            <div
              key={index}
              className='rounded-lg overflow-hidden border-2 border-gray-200 cursor-pointer hover:opacity-80 transition-opacity aspect-[4/3]'
              onClick={() => onImageClick(allImages, index)}
            >
              <img src={imageUrl} alt={`Media ${index + 1}`} className='w-full h-full object-cover' />
            </div>
          ))}
        </div>
      )
    }
  }

  const renderPhotosSection = () => {
    const allImages = getAllImages()

    if (allImages.length === 0) {
      return (
        <div className='text-center py-4'>
          <Text type='secondary' className='text-sm'>
            No photos yet
          </Text>
        </div>
      )
    }

    const displayCount = Math.min(allImages.length, 6)
    const imagesToShow = allImages.slice(0, displayCount)

    return (
      <>
        {renderImageLayout(imagesToShow, allImages, displayCount)}
        {allImages.length > 6 && (
          <Button
            size='middle'
            block
            className='font-medium rounded-lg hover:bg-gray-100 text-gray-500 border-gray-300'
            onClick={onViewAllPhotos}
          >
            See all photos
          </Button>
        )}
      </>
    )
  }

  return (
    <div className='w-80 flex-shrink-0'>
      <div className='sticky top-6 space-y-4'>
        {/* About Section */}
        <div className='bg-white rounded-lg p-4 shadow-sm border-2 border-gray-200'>
          <Title level={5} className='mb-3'>
            About
          </Title>
          <div className='space-y-3'>
            <div>
              <Text className='text-gray-700 text-sm'>{group.description}</Text>
            </div>

            <div className='border-t-2 border-gray-200 pt-3 space-y-2'>
              <div className='flex items-center gap-2'>
                {group.isPublic ? <GlobalOutlined className='text-black' /> : <LockOutlined className='text-black' />}
                <Text className='text-sm font-medium'>{group.isPublic ? 'Public group' : 'Private group'}</Text>
              </div>

              <div className='flex items-center gap-2'>
                <UserOutlined className='text-black' />
                <Text className='text-sm'>
                  <span className='font-semibold'>{group.memberCount}</span> members
                </Text>
              </div>

              <div className='flex items-center gap-2'>
                <FileTextOutlined className='text-black' />
                <Text className='text-sm'>
                  <span className='font-semibold'>{group.postCount}</span> posts
                </Text>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Photos Section */}
        <div className='bg-white rounded-lg shadow-sm border-2 border-gray-200 p-4'>
          <div className='flex items-center justify-between mb-3'>
            <Title level={5} className='mb-0'>
              Recent Photos
            </Title>
          </div>
          <div className='border-t-2 border-gray-200 mb-3'></div>
          {renderPhotosSection()}
        </div>
      </div>
    </div>
  )
}

export default GroupSidebar
