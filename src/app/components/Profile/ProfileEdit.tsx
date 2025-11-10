import React, { useState } from 'react'
import { Button, Input, Select, Form, Card, message } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { UserDto } from '@/app/types/User/user.dto'
import { userService } from '@/app/services/user.service'
interface ProfileEditProps {
  refreshData: () => void
  userInfo: UserDto
  onBack?: () => void
}

const { TextArea } = Input
const { Option } = Select

const ProfileEdit: React.FC<ProfileEditProps> = ({ refreshData, userInfo, onBack }) => {
  const [profile, setProfile] = useState<any>({
    firstName: userInfo.firstName,
    lastName: userInfo.lastName,
    email: userInfo.email,
    gender: userInfo.gender,
    description: userInfo.description
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProfile((prev: any) => ({ ...prev, [name]: value }))
  }

  const handleGenderChange = (value: string) => {
    setProfile((prev: any) => ({ ...prev, gender: value }))
  }

  const handleSubmit = async () => {
    if (!profile.firstName.trim() || !profile.lastName.trim() || !profile.email.trim()) {
      message.error('Please fill in all required fields')
      return
    }

    setIsLoading(true)
    try {
      const response = await userService.updateInfo(profile)

      if (response.status === 200) {
        message.success('Profile updated successfully!')
        refreshData()
        // if (onBack) onBack()
      } else {
        message.error('Error updating profile')
      }
    } catch (error) {
      console.error(error)
      message.error('Error updating profile')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='space-y-4 max-w-3xl mx-auto py-4 rounded-lg'>
      {onBack && (
        <Button type='text' icon={<ArrowLeftOutlined />} onClick={onBack} className='text-gray-600 hover:text-gray-900'>
          Back
        </Button>
      )}

      <Card title='Edit Profile' className='shadow-md border-gray-200'>
        <Form layout='vertical' onFinish={handleSubmit}>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <Form.Item label='First Name' required>
              <Input
                name='firstName'
                value={profile.firstName}
                onChange={handleInputChange}
                placeholder='Enter your first name'
              />
            </Form.Item>

            <Form.Item label='Last Name' required>
              <Input
                name='lastName'
                value={profile.lastName}
                onChange={handleInputChange}
                placeholder='Enter your last name'
              />
            </Form.Item>
          </div>

          <Form.Item
            label='Email'
            required
            name='email'
            rules={[
              {
                type: 'email',
                message: 'Invalid email format!'
              }
            ]}
          >
            <Input
              name='email'
              type='email'
              value={profile.email}
              onChange={handleInputChange}
              placeholder='Enter your email address'
            />
          </Form.Item>

          <Form.Item label='Gender'>
            <Select value={profile.gender} onChange={handleGenderChange} placeholder='Select your gender' allowClear>
              <Option value='male'>Male</Option>
              <Option value='female'>Female</Option>
              <Option value='other'>Other</Option>
            </Select>
          </Form.Item>

          <Form.Item label='Bio'>
            <TextArea
              name='description'
              value={profile.description}
              onChange={handleInputChange}
              placeholder='Tell us about yourself'
              rows={5}
            />
          </Form.Item>

          <div className='flex justify-end gap-2 mt-4'>
            <Button type='primary' htmlType='submit' loading={isLoading}>
              Save Changes
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  )
}

export default ProfileEdit
