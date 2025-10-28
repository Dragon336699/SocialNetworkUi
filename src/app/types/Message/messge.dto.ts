import { MessageAttachment } from '../MessageAttachment/messageAttachment.dto'
import { UserDto } from '../User/user.dto'

export interface MessageDto {
  id: string
  content: string
  status: string
  createdAt: Date
  updatedAt: Date
  senderId: string
  sender: UserDto
  repliedMessageId: string | null
  repliedMessage: MessageDto | null
  messageAttachments: MessageAttachment[]
}
