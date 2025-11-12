
const defaultProps = {
  name: 'unnamed',
  initialValue: 0,
  historySize: 100,
  derivativeCount: 0,
}

export class Float32Variable {
  readonly props: typeof defaultProps
  readonly historyNumber: Float32Array

  state = {
    index: 0,
    count: 1,
  }

  derivative: Float32Variable | null = null
  antiderivative: Float32Variable | null = null

  get name() { return this.props.name }

  /**
   * The total number of values pushed into the variable (which may exceed historySize).
   */
  get count() { return this.state.count }

  /**
   * The actual number of stored history entries, capped by historySize.
   */
  get actualCount() { return Math.min(this.state.count, this.props.historySize) }

  constructor(userProps?: Partial<typeof defaultProps>, antiderivative?: Float32Variable) {
    let name = userProps?.name
      ?? (antiderivative?.props.name && `${antiderivative.props.name}'`)
      ?? 'unnamed'

    this.props = {
      ...defaultProps,
      ...userProps,
      name,
    }

    if (this.props.historySize < 1)
      throw new Error('historySize must be at least 1')

    this.historyNumber = new Float32Array(this.props.historySize)
    this.reset(this.props.initialValue)

    if (this.props.derivativeCount > 0) {
      this.derivative = new Float32Variable({
        historySize: this.props.historySize,
        derivativeCount: this.props.derivativeCount - 1,
      }, this)
    }
  }

  reset(value: number): this {
    this.state.index = 0
    this.state.count = 1
    this.historyNumber.fill(value)
    this.derivative?.reset(0)
    return this
  }

  /**
   * Push a new value into the variable's history.
   * @param value The new value to push.
   * @param deltaTime The time difference since the last value (used for derivative calculation).
   * @returns 
   */
  push(value: number, deltaTime = 1): this {
    if (deltaTime <= 0) {
      console.warn('deltaTime must be positive. Ignoring push.')
      return this
    }

    const { historySize } = this.props
    const { index } = this.state

    this.historyNumber[index] = value
    this.state.index = (index + 1) % historySize
    this.state.count++

    this.derivative?.push((value - this.get(1)) / deltaTime, deltaTime)

    return this
  }

  get(backstep: number = 0): number {
    const { historySize } = this.props
    const { index, count } = this.state
    if (backstep > count)
      backstep = count

    let i = index - 1 - backstep
    while (i < 0)
      i += historySize

    return this.historyNumber[i]
  }

  *history(historyCount = this.props.historySize, { wrapMode = <'end' | 'repeat'>'end' } = {}): Generator<number> {
    const { historySize } = this.props
    const { count } = this.state
    historyCount = Math.min(historyCount, historySize)
    for (let i = 0; i < historyCount; i++) {
      if (i >= count && wrapMode === 'end')
        break

      yield this.get(i)
    }
  }

  historyInfo(historyCount = this.props.historySize, { wrapMode = <'end' | 'repeat'>'end' } = {}) {
    let min = Infinity
    let max = -Infinity
    let sum = 0
    let actualCount = 0

    for (const value of this.history(historyCount, { wrapMode })) {
      actualCount++
      sum += value
      if (value < min)
        min = value
      if (value > max)
        max = value
    }

    return {
      actualCount,
      min,
      max,
      sum,
      average: sum / actualCount,
    }
  }

  toSvgPath({
    offsetX = 0,
    offsetY = 0,
    width = 100,
    height = 100,
    yRange = <'auto' | [number, number]>'auto',
  } = {}): string {
    const [minY, maxY] = (() => {
      if (yRange === 'auto') {
        const info = this.historyInfo()
        return [info.min, info.max]
      }
      return yRange
    })()

    const deltaY = maxY - minY

    if (deltaY === 0)
      return ''

    const { historySize } = this.props
    const { count } = this.state
    const totalPoints = Math.min(historySize, count)

    if (totalPoints < 2)
      return ''

    const fmt = (v: number) => v.toFixed(2).replace(/\.?0+$/, '')
    const points: string[] = []
    for (let i = 0; i < totalPoints; i++) {
      const t = i / (totalPoints - 1)
      const yValue = this.get(totalPoints - 1 - i)
      const yNorm = (yValue - minY) / (maxY - minY)
      const px = offsetX + t * width
      const py = offsetY + (1 - yNorm) * height
      const cmd = i === 0 ? 'M' : 'L'
      if (isNaN(py) || !isFinite(py))
        debugger
      points.push(`${cmd}${fmt(px)},${fmt(py)}`)
    }
    return points.join(' ')
  }
}