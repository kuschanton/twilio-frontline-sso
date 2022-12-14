export class LateInit<T> {
  private value: T | null = null
  private readonly errorSupplier = () => new Error('Accessing late init value before it was initialized')

  constructor(errorSupplier?: () => Error) {
    if (errorSupplier) {
      this.errorSupplier = errorSupplier
    }
  }

  public set(t: T) {
    if (!this.value) {
      this.value = t
    } else {
      throw new Error('Reinitializing late init value')
    }
  }

  public get(): T {
    if (this.value) {
      return this.value
    } else {
      throw this.errorSupplier()
    }
  }
}

export function lateInitOf<T>(value: T): LateInit<T> {
  let result = new LateInit<T>()
  result.set(value)
  return result
}