import { GroupDto } from './group.dto'

export interface CreateGroupResponse {
  groupId?: string
  message: string
}

export interface GetAllGroupsResponse {
  message: string
  groups: GroupDto[]
  totalCount: number
}

export interface GetGroupByIdResponse {
  message: string
  group?: GroupDto
}

export interface UpdateGroupResponse {
  message: string
  group?: GroupDto
}

export interface DeleteGroupResponse {
  message: string
}

export interface JoinGroupResponse {
  message: string
}

export interface LeaveGroupResponse {
  message: string
}
