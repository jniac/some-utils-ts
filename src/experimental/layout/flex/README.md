# some-utils-ts/layout/flex

`some-utils-ts/layout/flex` is a naive yet robust flex layout system.

It does NOT implement the [official W3C specs](https://www.w3.org/TR/css-flexbox-1/).

It's intended to be used in creative coding projects where you need to create
complex layouts with relative and absolute sizes, paddings and gaps.

## Features:

- Horizontal and vertical directions

- Absolute, relative and "fraction" sizes

  - Absolute: fixed size in pixels
  - Relative:
    - Size based on the parent size (same direction)
    - Special relative sizes that take the two parent sizes into account: opposite, smaller, larger
  - "Fraction":

- "Positioning":

  - "Flow": the classical layout, based on the properties of the current siblings
  - "Detached": for independant space (equivalent to "position: absolute" in css)

- Spacing: padding, gap and margin

  - padding: inner white space of the current "space"
  - gaps: white space between 2 consecutives "space"
  - margin: extra definition for white space around a "space" (margins "collapse" with existing white space (gap or padding))

- Alignment:

  - alignChildren: commands how the children should be aligned
  - alignSelf: commands how the current space

- Layout computation (from root to children)

- Tree structure

  - add
  - remove
  - get (with index path)
  - find (with predicate)

- Declarative syntax (`space.set({ size: ['100%', '25%'] })`)

## Exclusive features:

- Extra size (extraSizeX, extraSizeY)  
  It's motion design friendly feature. You can animate the size of a space
  based on its current size. It's useful for creating animations where a space
  could grow or shrink. The whole layout will be affected by this change
  accordingly to the space's direction and alignment.

## Roadmap:

- Min and max sizes
- Shrinking options?

Naive implementation of a flex layout system. Naive but robust. Useful for
creating simple layouts with relative and absolute sizes, paddings and gaps
that could be easily computed, animated and rendered.

## Usage:

```ts
const root = new Space({
  direction: Direction.Horizontal,
  offset: [100, 100],
  size: [600, 400],
  padding: 10,
  gap: 10,
})

// Creates 2 vertical spaces with 25% width and 100% height
root.add(
  new Space({
    direction: Direction.Vertical,
    size: ['.25rel', '1rel'],
    spacing: 10,
    userData: { color: '#f00' },
  }),
  new Space({
    direction: Direction.Vertical,
    size: ['.25rel', '1rel'],
    spacing: 10,
    userData: { color: '#f00' },
  }),
  new Space({
    direction: Direction.Vertical,
    size: ['.25rel', '1rel'],
    spacing: 10,
    userData: { color: '#f00' },
  })
)

// Creates 3 spaces into the first vertical space, with 1fr, 2fr and 3fr height
// where fr is a special unit that means "fraction" of the remaining space
for (let i = 0; i < 3; i++) {
  root.get(0)!.add(
    new Space({
      sizeY: `${i + 1}fr`,
      spacing: 10,
    })
  )
}

root.computeLayout()

const pixelRatio = window.devicePixelRatio
canvas.width = 800 * pixelRatio
canvas.height = 600 * pixelRatio
canvas.style.width = '800px'
canvas.style.height = '600px'

const ctx = canvas.getContext('2d')!
for (const space of root.allDescendants()) {
  ctx.lineWidth = pixelRatio * 2
  ctx.strokeStyle = space.userData.color ?? '#fff'
  ctx.strokeRect(...space.rect.tupple(pixelRatio))
}
```
