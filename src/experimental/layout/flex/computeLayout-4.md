# computeLayout4()

## Status
computeLayout4() is very robust and flexible

## Features

### Aspect
- Spaces can have an `aspect` property which defines a preferred aspect ratio.
- There are 2 kind of "aspect" nodes:
  - "aspect-auto" nodes are nodes that only have an aspect ratio constraint (no size constraint).  
    They will be sized as large as possible while respecting their aspect ratio and the available space. Overflow should not occurs on aspect-auto nodes.
  - "aspect-with-size" nodes are nodes that have both an aspect ratio constraint and a size constraint.  
    They wait first to their constrained size to be computed, then they adjust their size to respect their aspect ratio. Overflow can occurs on aspect-with-size.