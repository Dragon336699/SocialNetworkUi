import { Modal } from 'antd'
import { CloseOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons'

interface ImageViewerModalProps {
  isOpen: boolean
  onClose: () => void
  images: string[]
  currentIndex: number
  onPrevious: () => void
  onNext: () => void
}

const ImageViewerModal = ({
  isOpen,
  onClose,
  images,
  currentIndex,
  onPrevious,
  onNext
}: ImageViewerModalProps) => {
  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width='90vw'
      style={{ top: 20, maxWidth: '1200px' }}
      closeIcon={<CloseOutlined style={{ color: 'white', fontSize: '24px' }} />}
      styles={{
        body: { padding: 0, background: 'black' },
        content: { padding: 0, background: 'black', borderRadius: 0, border: '2px solid white' }
      }}
    >
      <div className='relative bg-black' style={{ minHeight: '70vh' }}>
        <div className='flex items-center justify-center' style={{ minHeight: '70vh' }}>
          <img
            src={images[currentIndex]}
            alt={`Image ${currentIndex + 1}`}
            className='max-w-full max-h-[70vh] object-contain'
          />
        </div>

        {images.length > 1 && (
          <>
            {currentIndex > 0 && (
              <button
                onClick={onPrevious}
                className='absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full p-3 transition-all'
              >
                <LeftOutlined style={{ fontSize: '24px' }} />
              </button>
            )}

            {currentIndex < images.length - 1 && (
              <button
                onClick={onNext}
                className='absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full p-3 transition-all'
              >
                <RightOutlined style={{ fontSize: '24px' }} />
              </button>
            )}

            <div className='absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-full'>
              {currentIndex + 1} / {images.length}
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}

export default ImageViewerModal
