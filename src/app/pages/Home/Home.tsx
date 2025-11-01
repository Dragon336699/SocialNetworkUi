import CreatePostModal from '@/app/components/modals/CreatePostModal'
import { Avatar } from 'antd'
import { useState } from 'react'

const Home = () => {
  const [isOpenCreatePost, setIsOpenCreatePost] = useState<boolean>(false)
  return (
    <>
      <CreatePostModal isModalOpen={isOpenCreatePost} handleCancel={() => setIsOpenCreatePost(false)} />
      <div className='bg-[rgba(228,203,203,0.91)] rounded-xl p-3 m-3 shadow-sm w-full max-w-xl'>
        <div onClick={() => setIsOpenCreatePost(true)} className='flex items-center gap-3 cursor-pointer'>
          <Avatar size='large' src='https://api.dicebear.com/7.x/miniavs/svg?seed=1' />
          <div className='flex-1 bg-neutral-100 rounded-full px-4 py-1 text-neutral-600 hover:bg-neutral-200 transition'>
            What's on your mind?
          </div>
        </div>
      </div>
    </>
  )
}

export default Home
