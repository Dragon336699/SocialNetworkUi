import { Modal, Form, Input, Select, message, Button } from 'antd'
import { useState, useEffect, useRef, ChangeEvent } from 'react'
import { PictureOutlined, SmileOutlined, CloseOutlined } from '@ant-design/icons'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { groupService } from '@/app/services/group.service'
import { GroupDto } from '@/app/types/Group/group.dto'
import { UpdateGroupRequest } from '@/app/types/Group/GroupRequest'

interface EditGroupModalProps {
  isModalOpen: boolean
  handleCancel: () => void
  onEditGroupSuccess: (updatedGroup: GroupDto) => void
  group: GroupDto
}

const EditGroupModal = ({ isModalOpen, handleCancel, onEditGroupSuccess, group }: EditGroupModalProps) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewImage, setPreviewImage] = useState<string>('')
  const [removeImage, setRemoveImage] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const emojiWrapperRef = useRef<HTMLDivElement>(null)
  const descriptionRef = useRef<any>(null)

  useEffect(() => {
    if (isModalOpen && group) {
      form.setFieldsValue({
        name: group.name,
        description: group.description,
        isPublic: group.isPublic
      })
      setPreviewImage(group.imageUrl || '')
      setImageFile(null)
      setRemoveImage(false)
      setShowEmojiPicker(false)
    }
  }, [isModalOpen, group, form])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiWrapperRef.current && !emojiWrapperRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false)
      }
    }
    if (showEmojiPicker) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showEmojiPicker])

  const handleEmojiSelect = (emojiData: any) => {
    const emoji = emojiData.native
    const textarea = descriptionRef.current?.resizableTextArea?.textArea
    const currentValue = form.getFieldValue('description') || ''

    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newText = currentValue.slice(0, start) + emoji + currentValue.slice(end)
    form.setFieldValue('description', newText)

    requestAnimationFrame(() => {
      textarea.focus()
      textarea.selectionStart = textarea.selectionEnd = start + emoji.length
    })
  }

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    const file = e.target.files[0]
    setImageFile(file)
    setRemoveImage(false)

    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setPreviewImage('')
    setRemoveImage(true)
  }

  const handleEditGroup = async (values: Omit<UpdateGroupRequest, 'newImage' | 'removeImage'>) => {
    try {
      setLoading(true)
      const request: UpdateGroupRequest = {
        ...values,
        newImage: imageFile || undefined,
        removeImage: removeImage
      }
      const response = await groupService.updateGroup(group.id, request)
      if (response.group) {
        message.success('Group updated successfully!')
        onEditGroupSuccess(response.group)
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Unable to update group'
      message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleModalCancel = () => {
    form.resetFields()
    setImageFile(null)
    setPreviewImage('')
    setRemoveImage(false)
    setShowEmojiPicker(false)
    handleCancel()
  }

  return (
    <Modal
      title={
        <div className='flex justify-between items-center border-b-2 border-gray-200 pb-3 mb-4'>
          <span className='text-lg font-semibold'>Edit Group</span>
          <Button
            icon={<CloseOutlined />}
            onClick={handleModalCancel}
            className='border border-gray-300 bg-gray-100 hover:bg-gray-200 rounded'
          />
        </div>
      }
      open={isModalOpen}
      onCancel={handleModalCancel}
      footer={null}
      width={600}
      closable={false}
      centered={false}
      maskClosable={false}
      style={{ 
        borderRadius: '8px', 
        overflow: 'visible',
        padding: 0,
        top: 50
      }}
      styles={{
        content: { 
          padding: 0,
          border: '2px solid #E5E7EB',
          borderRadius: '8px',
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
          overflow: 'visible'
        },
        body: { 
          padding: '0 24px 24px 24px',
          overflow: 'visible'
        },
        header: {
          padding: '16px 24px 0 24px',
          marginBottom: 0
        }
      }}
    >
      <Form form={form} layout='vertical' onFinish={handleEditGroup}>
        <Form.Item
          label={<span className='font-semibold'>Group Name</span>}
          name='name'
          rules={[
            { required: true, message: 'Please enter group name!' },
            { min: 3, message: 'Group name must be at least 3 characters!' },
            { max: 100, message: 'Group name must not exceed 100 characters!' }
          ]}
        >
          <Input placeholder='Enter group name' size='large' className='border-gray-300' />
        </Form.Item>

        <Form.Item
          label={<span className='font-semibold'>Description</span>}
          name='description'
          rules={[
            { required: true, message: 'Please enter group description!' },
            { min: 10, message: 'Description must be at least 10 characters!' },
            { max: 500, message: 'Description must not exceed 500 characters!' }
          ]}
        >
          <Input.TextArea
            ref={descriptionRef}
            placeholder='Describe your group...'
            rows={4}
            showCount
            maxLength={500}
            className='border-gray-300'
          />
        </Form.Item>

        <Form.Item
          label={<span className='font-semibold'>Privacy</span>}
          name='isPublic'
          rules={[{ required: true, message: 'Please select privacy setting!' }]}
          tooltip='Public groups can be discovered and joined by anyone. Private groups are invite-only.'
        >
          <Select size='large' placeholder='Select privacy setting' className='border-gray-300'>
            <Select.Option value={true}>Public</Select.Option>
            <Select.Option value={false}>Private</Select.Option>
          </Select>
        </Form.Item>

        {previewImage && !removeImage && (
          <Form.Item label={<span className='font-semibold'>Group Image</span>}>
            <div className='relative w-full'>
              <img
                src={previewImage}
                alt='Preview'
                className='w-full h-auto object-cover rounded-lg border-2 border-gray-200'
              />
              <button
                onClick={handleRemoveImage}
                className='absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold hover:bg-opacity-75 transition-all'
                type='button'
              >
                ×
              </button>
            </div>
          </Form.Item>
        )}

        {removeImage && (
          <div className='mb-4 p-3 bg-red-50 rounded-lg border border-red-200'>
            <span className='text-sm text-red-600 font-medium'>⚠️ Image will be deleted when saving changes</span>
          </div>
        )}
      </Form>

      <div className='border-t-2 border-gray-200 pt-4 mt-4'>
        <div className='flex justify-between items-center'>
          <div className='flex items-center gap-3'>
            <button
              type='button'
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className='rounded-full border border-gray-300 bg-gray-100 hover:bg-gray-200 transition-colors h-10 flex items-center px-3 gap-2 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed'
            >
              <PictureOutlined />
              <span>{imageFile ? 'Change Image' : previewImage && !removeImage ? 'Change Image' : 'Select Image'}</span>
            </button>
            
            <div ref={emojiWrapperRef} className='relative inline-block'>
              <button
                type='button'
                onClick={() => setShowEmojiPicker((prev) => !prev)}
                disabled={loading}
                className='rounded-full border border-gray-300 bg-gray-100 hover:bg-gray-200 transition-colors h-10 w-10 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed'
              >
                <SmileOutlined />
              </button>
              {showEmojiPicker && (
                <div className='absolute bottom-full left-0 mb-2 z-[9999] h-96 overflow-hidden shadow-lg bg-white rounded-lg'>
                  <Picker
                    data={data}
                    onEmojiSelect={handleEmojiSelect}
                    previewPosition='none'
                    theme='light'
                    navPosition='top'
                    perLine={8}
                    emojiSize={22}
                  />
                </div>
              )}
            </div>
          </div>
          
          <button
            type='button'
            onClick={() => form.submit()}
            disabled={loading}
            className={`
              rounded-full px-6 h-10 flex items-center justify-center transition-colors font-semibold
              ${loading ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 cursor-pointer text-white'}
            `}
          >
            {loading ? (
              <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>

      <input type='file' accept='image/*' className='hidden' ref={fileInputRef} onChange={handleImageChange} />
    </Modal>
  )
}

export default EditGroupModal