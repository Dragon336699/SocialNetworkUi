import { ConversationUserDto } from '../ConversationUser/conversationUser.dto'
import { MessageDto } from '../Message/messge.dto'

export interface ConversationDto {
  id: string
  type: string
  createdAt: Date
  conversationUsers: ConversationUserDto[]
  newestMessage: MessageDto | null
}
