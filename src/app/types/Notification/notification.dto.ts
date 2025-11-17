export interface NotificationDto {
  id: string
  notificationType: string
  data: NotificationData
  navigateUrl: string
  unread: boolean
  createdAt: Date
  updatedAt: Date
}

export interface NotificationData {
  subjects: NotificationObject[]
  subjectCount: number
  content: string
  diObject: NotificationObject
  inObject: NotificationObject | null
  prObject: NotificationObject | null
  highlights: HighlightOffset[]
}

export interface NotificationObject {
  id: string
  name: string
  type: string
  imageUrl: string | null
}

export interface HighlightOffset {
  offset: number
  length: number
}
