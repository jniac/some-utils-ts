import { describe, expect, test } from 'vitest'

import { computeLayout4 } from './computeLayout-4'
import { Space } from './Space'

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
  const root1 = new Space({
    direction: 'horizontal',
    size: [300, 100],
    spacing: 10,
  })
    .add(
      { sizeX: 50 },
      {},
      { positioning: 'detached' },
      { sizeX: 50 },
    )

  expect(root1.children.length).toBe(4)
  const c_root1 = computeLayout4(root1)

  test('detached node with no size nor offset should have the same rect as the parent', () => {
    const areEqual = root1.child(2)!.rect.equals(root1.rect)
    if (!areEqual) {
      console.log('root1:', root1.rect)
      console.log('child2:', root1.child(2)!.rect)
      console.log(c_root1.toTreeWithDependenciesString())
    }
    expect(areEqual).toBe(true)
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
