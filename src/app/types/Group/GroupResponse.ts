import { GroupDto, GroupUserDto } from './group.dto'

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
export interface PromoteToAdminResponse {
  message: string
  groupUser?: GroupUserDto
}

export interface DemoteAdminResponse {
  message: string
  groupUser?: GroupUserDto
}

export interface KickMemberResponse {
  message: string
  success: boolean
}