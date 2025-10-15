import { MessageAttachment } from '../MessageAttachment/messageAttachment.dto'

export interface MessageDto {
  id: string
  content: string
  status: string
  createdAt: Date
  updatedAt: Date
  senderId: string
  receiverId: string
  messageAttachments: MessageAttachment[]
}
