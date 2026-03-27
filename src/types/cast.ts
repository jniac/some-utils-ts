export function cast<T>(value: any, constructor: new (...args: any[]) => T): T | null {
  return value instanceof constructor ? value : null
}

export function castOrThrow<T>(value: any, constructor: new (...args: any[]) => T): T {
  if (value instanceof constructor) {
    return value
  }
  throw new Error(`Value ${value} is not an instance of ${constructor.name}`)
}

export function tryCast<T>(value: any, constructor: new (...args: any[]) => T, callback: (casted: T) => void) {
  if (value instanceof constructor) {
    callback(value)
  }
}
