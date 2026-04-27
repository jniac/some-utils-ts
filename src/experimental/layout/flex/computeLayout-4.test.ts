import { describe, expect, test } from 'vitest'

import { computeLayout4 } from './computeLayout-4'
import { ScalarType } from './Scalar'
import { Space } from './Space'
import { Positioning } from './types'

const testSuites = <[desc: string, fn: () => void][]>[]
function addTestSuite(fn: () => void, desc?: string) {
  testSuites.push([desc ?? fn.name, fn])
}




// Test cases:

function warningsTest() {
  const c_root = computeLayout4(new Space({
    direction: 'horizontal',
    size: 'fit-content',
    gap: '5%',
    padding: '5%',
  }))

  test('gap and padding percentage should trigger warnings', () => {
    expect(c_root.gap.warningMask).not.toBe(0)
  })
}
addTestSuite(warningsTest, 'warnings')

function nestedFitContentTest() {
  const spacing = 10
  const leafSize = [1, 3]
  const nestedCount = 10

  const root = new Space({
    size: 'fit-content',
    spacing,
  })

  let current = root
  for (let i = 0; i < nestedCount; i++) {
    const child = new Space({
      size: 'fit-content',
      spacing,
    })
    current.add(child)
    current = child
  }

  current.add({
    size: leafSize,
  })

  computeLayout4(root)

  test('nested fit-content should compute size correctly', () => {
    expect(root.rect.width).toBe(leafSize[0] + spacing * (nestedCount + 1) * 2)
    expect(root.rect.height).toBe(leafSize[1] + spacing * (nestedCount + 1) * 2)
  })
}
addTestSuite(nestedFitContentTest,
  'nested fit-content')

function circularDependencyDetectionTest() {
  const root = new Space({
    spacing: 10,
    size: 'fit-content',
  })
    .add(
      new Space({
        size: '100%',
      })
    )
  const c_root = computeLayout4(root)

  test('circular dependency should trigger warnings', () => {
    expect(c_root.treeWarningsCount()).toBe(4) // 2 (width, height) for circular dependency for each node (x2)
  })
}
addTestSuite(circularDependencyDetectionTest,
  'circular dependency detection')

function detachedNodesShouldNotContributeToSizeTest() {
  const size = 100
  const spacing = 10

  const root = new Space({
    spacing: 10,
    size: 'fit-content',
  })
    .add(
      { size: 100 },
      { size: 100, positioning: 'detached' },
      { size: 100 },
      { size: 100, positioning: 'detached' },
    )

  computeLayout4(root)
  test('detached nodes should not contribute to size', () => {
    expect(root.rect.width).toBe(size * 2 + spacing * 3)
  })
}
addTestSuite(detachedNodesShouldNotContributeToSizeTest,
  'detached nodes should not contribute to size')

function simpleLayoutTest() {
  const width = 300, height = 100, spacing = 10
  const childSizeX = 50
  const root = new Space({
    direction: 'horizontal',
    size: [width, height],
    spacing,
  })
    .add(
      { sizeX: childSizeX },
      { sizeX: '1fr' },
      { sizeX: '2fr' },
      { positioning: 'detached' },
      { sizeX: childSizeX },
    )

  computeLayout4(root)

  test('detached node with no size nor offset should have the same rect as the parent', () => {
    const detachedChild = root.find(node => node.positioning === Positioning.Detached)!
    expect(detachedChild.positioning).toBe(Positioning.Detached)
    const areEqual = detachedChild.rect.equals(root.rect)
    expect(areEqual).toBe(true)

    if (!areEqual) {
      console.log('root1:', root.rect)
      console.log('child2:', detachedChild.rect)
    }
  })

  test('fractional size should be resolved correctly', () => {
    const flowChildrenCount = root.children.length - 1
    const expectedSize1 = (width - spacing * (flowChildrenCount + 1) - childSizeX * 2) * (1 / 3)
    const expectedSize2 = (width - spacing * (flowChildrenCount + 1) - childSizeX * 2) * (2 / 3)
    const fractionChild1 = root.children.find(space => space.sizeX.type === ScalarType.Fraction && space.sizeX.value === 1)!
    const fractionChild2 = root.children.find(space => space.sizeX.type === ScalarType.Fraction && space.sizeX.value === 2)!
    expect(fractionChild1.rect.width).toBe(expectedSize1)
    expect(fractionChild2.rect.width).toBe(expectedSize2)
  })
}
addTestSuite(simpleLayoutTest, 'simple layout (position and size)')

// Test runner:

describe('computeLayout4', () => {
  for (const [desc, fn] of testSuites) {
    describe(desc, fn)
  }
  // describe('ok', () => test('ok', () => {
  //   const root = new Space().add(
  //     new Space().add(
  //       new Space(),
  //     ),
  //     new Space(),
  //     new Space().add(
  //       new Space(),
  //       new Space(),
  //     ),
  //   )
  //   expect(true).toBe(true)
  //   console.log(computeLayout4(root).toTreeWithDependenciesString())
  // }))
})
