export interface ModalProps {
  isModalOpen: boolean
  update?: boolean
  handleOk?: (data?: any) => void
  handleCancel: (e?: any) => void
  subTitle?: string
  isLoading?: boolean
  title?: string
}
