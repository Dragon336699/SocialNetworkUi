import { GroupDto, GroupUserDto, GroupInvitationDto } from './group.dto'

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

export interface ApproveJoinRequestResponse {
  message: string
  groupUser?: GroupUserDto
}

export interface RejectJoinRequestResponse {
  message: string
}

export interface CancelJoinRequestResponse {
  message: string
}

export interface GetPendingJoinRequestsResponse {
  message: string
  pendingRequests: GroupUserDto[]
  totalCount: number
}

export interface SearchMyGroupsResponse {
  message: string
  groups: GroupDto[]
  totalCount: number
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

export interface InviteMemberResponse {
  message: string
}

export interface AcceptGroupInviteResponse {
  message: string
  group?: GroupDto
}

export interface RejectGroupInviteResponse {
  message: string
}

export interface GetMyGroupInvitationsResponse {
  message: string
  invitations: GroupInvitationDto[]
  totalCount: number
}

export interface BanMemberResponse {
  message: string
  success: boolean
}

export interface UnbanMemberResponse {
  message: string
  success: boolean
}

export interface GetBannedMembersResponse {
  message: string
  bannedMembers: GroupUserDto[]
  totalCount: number
}
