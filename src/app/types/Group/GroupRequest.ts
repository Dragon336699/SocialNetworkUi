export interface CreateGroupRequest {
  name: string
  description: string
  isPublic: boolean
  image?: File
}
export interface UpdateGroupRequest {
  name?: string
  description?: string
  isPublic?: boolean
  newImage?: File
  removeImage?: boolean
}
export interface PromoteToAdminRequest {
  targetUserId: string
}

export interface DemoteAdminRequest {
  targetUserId: string
}