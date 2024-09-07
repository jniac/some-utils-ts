
export type PaddingParams = {
  all?: number
  vertical?: number
  horizontal?: number
  top?: number
  bottom?: number
  right?: number
  left?: number
}
  | [top: number, right: number, bottom: number, left: number]
  // | [number, number, number] ???
  | [vertical: number, horizontal: number]
  | [number]
  | number

export class Padding {
  static ensure(object: PaddingParams) {
    return (object instanceof Padding ? object : new Padding(object))
  }

  top = 0
  right = 0
  bottom = 0
  left = 0

  constructor(params: PaddingParams = {}) {
    this.set(params)
  }

  *[Symbol.iterator](): Generator<number> {
    yield this.top
    yield this.right
    yield this.bottom
    yield this.left
  }

  setTRBL(top: number, right: number, bottom: number, left: number): this {
    this.top = top
    this.right = right
    this.bottom = bottom
    this.left = left
    return this
  }

  set(params: PaddingParams = {}) {
    if (Array.isArray(params)) {
      if (params.length === 1) {
        const [all] = params
        this.top = all
        this.right = all
        this.bottom = all
        this.left = all
      } else if (params.length === 2) {
        const [vertical, horizontal] = params
        this.top = vertical
        this.right = horizontal
        this.bottom = vertical
        this.left = horizontal
      } else if (params.length === 4) {
        const [top, right, bottom, left] = params
        this.top = top
        this.right = right
        this.bottom = bottom
        this.left = left
      }
    } else
      if (typeof params === 'number') {
        this.top = params
        this.right = params
        this.bottom = params
        this.left = params
      } else {
        const {
          all = 0,
          vertical = all,
          horizontal = all,
          top = vertical,
          bottom = vertical,
          left = horizontal,
          right = horizontal,
        } = params
        this.top = top
        this.right = right
        this.bottom = bottom
        this.left = left
      }
  }

  isHomogeneous() {
    return (
      this.top === this.right &&
      this.top === this.bottom &&
      this.top === this.left
    )
  }

  get horizontal() {
    return (this.left + this.right) / 2
  }

  get vertical() {
    return (this.top + this.bottom) / 2
  }

  get all() {
    return this.isHomogeneous() ? this.top : (this.top + this.right + this.bottom + this.left) / 4
  }

  get totalHorizontal() {
    return this.left + this.right
  }

  get totalVertical() {
    return this.top + this.bottom
  }

  toCSS({ scalar = 1 } = {}) {
    return `${this.top * scalar}px ${this.right * scalar}px ${this.bottom * scalar}px ${this.left * scalar}px`
  }

  toStyle(filter: string = 'padding all', { scalar = 1 } = {}) {
    const tokens = filter.split(' ')
    const padding = tokens.includes('margin') === false
    const all = tokens.includes('all')
    const horizontal = all || tokens.includes('horizontal')
    const vertical = all || tokens.includes('vertical')
    const top = vertical || tokens.includes('top')
    const bottom = vertical || tokens.includes('bottom')
    const left = horizontal || tokens.includes('left')
    const right = horizontal || tokens.includes('right')

    const baseKey = padding ? 'padding' : 'margin'
    const props = [] as [string, string][]
    if (top) props.push([baseKey + 'Top', `${this.top * scalar}px`])
    if (right) props.push([baseKey + 'Right', `${this.right * scalar}px`])
    if (bottom) props.push([baseKey + 'Bottom', `${this.bottom * scalar}px`])
    if (left) props.push([baseKey + 'Left', `${this.left * scalar}px`])

    return Object.fromEntries(props) as ({
      paddingTop: string
      paddingRight: string
      paddingBottom: string
      paddingLeft: string
    } | {
      marginTop: string
      marginRight: string
      marginBottom: string
      marginLeft: string
    })
  }
}
