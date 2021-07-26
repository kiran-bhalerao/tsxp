import { Auth } from '@tsxp/core'

export type USER_TYPES = 'USER' | 'ADMIN'
class AuthExtender extends Auth.extender<USER_TYPES> {
  // default is req.user.userType
  // if you wanna change, change here like the below method
  // userTypeResolver(req: Request) {
  //  return req.user.role
  // }
}

export const AdminOnly = new AuthExtender({ role: 'ADMIN' }).createDecorator()
export const UserOnly = new AuthExtender({ role: 'USER' }).createDecorator()
