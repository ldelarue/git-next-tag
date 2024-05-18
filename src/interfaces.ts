export interface Logger {
  warning: Function
  info: Function
}

export interface MandatoryInputs {
  ref: string
  logger: Logger
}
