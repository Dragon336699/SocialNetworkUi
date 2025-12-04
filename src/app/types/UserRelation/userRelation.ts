import { UserDto } from '../User/user.dto'

export interface RelationData {
  message: string
  data: {
    data: UserDto[]
    pageNumber: number
    pageSize: number
    totalRecords: number
    totalPages: number
  }
}
