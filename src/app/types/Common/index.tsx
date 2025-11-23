export interface ModalProps {
  isModalOpen: boolean
  update?: boolean
  handleOk?: (data?: any) => void
  handleCancel: (e?: any) => void
  subTitle?: string
  isLoading?: boolean
  title?: string
  onCreatePostSuccess?: () => void
}

export type FriendStatus = 'online' | 'offline' | 'away'

export interface Friend {
  id: number
  name: string
  avatar: string
  status: FriendStatus
}

export type ActionType = 'unfriend' | 'unfollow' | 'block'
