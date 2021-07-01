export class CustomError extends Error {
  statusCode: number
  errors: string[]

  constructor(message: string | string[], code?: number) {
    super('Bad Request')

    this.errors = Array.isArray(message) ? message : [message]
    this.statusCode = code || 400
  }
}
