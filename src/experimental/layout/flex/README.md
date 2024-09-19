# some-utilz/layout/flex

`some-utilz/layout/flex` is a naive yet robust flex layout system.

It does NOT implement the [official W3C specs](https://www.w3.org/TR/css-flexbox-1/).

It's intended to be used in creative coding projects where you need to create
complex layouts with relative and absolute sizes, paddings and gaps.

## Features:
- Horizontal and vertical directions
- Absolute and relative sizes
  - Absolute: fixed size in pixels
  - Relative: size based on the parent size
  - Special relative sizes that take the two parent sizes into account: opposite, smaller, larger
- Padding and gaps
- Part unit for relative sizes
- Layout computation (from root to children)
- Tree structure
  - add
  - remove
  - get (with index path)
  - find (with predicate)
- Declarative syntax for sizes, paddings and gaps

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
const root = new Space(Direction.Horizontal)
  .setOffset(100, 100)
  .setSize(600, 400)
  .setPadding(10)
  .setGap(10)

// Creates 2 vertical spaces with 25% width and 100% height
root.add(new Space(Direction.Vertical).setSize('.25rel', '1rel').setSpacing(10).setUserData({ color: '#f00' }))
root.add(new Space(Direction.Vertical).setSize('.25rel', '1rel').setSpacing(10).setUserData({ color: '#f00' }))
root.add(new Space(Direction.Vertical).setSize('.25rel', '1rel').setSpacing(10).setUserData({ color: '#f00' }))

// Creates 3 spaces into the first vertical space, with 1prt, 2prt and 3prt height
// where prt is a special unit that means "part" of the remaining space
for (let i = 0; i < 3; i++) {
  root.getChild(0)!
    .add(new Space().setSize(`1rel`, `${i + 1}prt`).setSpacing(10))
}

const ctx = canvas.getContext('2d')
for (const space of root.allDescendants()) {
  ctx.strokeStyle = space.userData.color ?? '#fff'
  ctx.strokeRect(...space.rect)
}
```