import { CustomError } from '@tsxp/core'

type IFormError = { field: string; error: string }
export class FormError extends CustomError.extender<IFormError> {}
