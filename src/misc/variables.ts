
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

  createHistory(fn: (time: number) => number) {
    const { historySize } = this.props
    // preshot: start from -1 to include the current value
    this.reset(fn(-1 / (historySize - 1)))
    for (let i = 0; i < historySize; i++) {
      const t = i / (historySize - 1)
      this.push(fn(t), 1 / (historySize - 1))
    }
    return this
  }

  get(backstep: number = 0): number {
    const { historySize } = this.props

    if (backstep < 0)
      backstep = 0

    if (backstep >= historySize)
      backstep = historySize - 1

    let i = this.state.index - 1 - backstep
    if (i < 0)
      i += historySize

    return this.historyNumber[i]
  }

  /**
   * Return a linearly interpolated sample from the variable's history.
   */
  linearSample(backstep: number): number {
    const fract = backstep - Math.floor(backstep)
    const backstep0 = Math.floor(backstep)
    const backstep1 = backstep0 + 1
    const v0 = this.get(backstep0)
    const v1 = this.get(backstep1)
    return v0 * (1 - fract) + v1 * fract
  }

  linearSamples(sampleCount = 10): number[] {
    const samples: number[] = new Array(sampleCount)
    for (let i = 0; i < sampleCount; i++) {
      const t = i / (sampleCount - 1)
      samples[i] = this.linearSample(t * (this.props.historySize - 1))
    }
    return samples
  }

  /**
   * Sample the variable's history with a Gaussian smoothing (for noise reduction).
   */
  gaussianSmoothSample(backstep: number, { stdDev = 1, sampleCount = 10, sampleHistoryWidth = .1 } = {}): number {
    const halfWidth = sampleHistoryWidth * this.props.historySize * .5
    const center = backstep
    let sum = 0
    let weightSum = 0
    for (let i = 0; i < sampleCount; i++) {
      const t = i / (sampleCount - 1)
      const delta = halfWidth * (2 * t - 1)
      const sampleBackstep = center - delta
      const value = this.linearSample(sampleBackstep)
      const weight = Math.exp(-0.5 * (delta * delta) / (stdDev * stdDev))
      sum += value * weight
      weightSum += weight
    }
    return sum / weightSum
  }

  gaussianSmoothSamples(sampleCount = 10, options?: { stdDev?: number; sampleCount?: number; sampleHistoryWidth?: number }): number[] {
    const samples: number[] = new Array(sampleCount)
    for (let i = 0; i < sampleCount; i++) {
      const t = i / (sampleCount - 1)
      samples[i] = this.gaussianSmoothSample(t * (this.props.historySize - 1), options)
    }
    return samples
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

  toSvgPathData({
    offsetX = 0,
    offsetY = 0,
    width = 100,
    height = 100,
    yRange = <'auto' | [number, number] | Readonly<[number, number]>>'auto',
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