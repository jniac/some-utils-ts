import { describe, expect, test } from 'vitest'

import { ManyToOne } from './many-to-one'

describe("ManyToOne", () => {
  test("should store and retrieve values correctly", () => {
    const map = new ManyToOne<string, number>()
    map.set("a", 1)
    map.set("b", 2)
    expect(map.get("a")).toBe(1)
    expect(map.get("b")).toBe(2)
  })

  test("should correctly store and retrieve keys (readonly mode)", () => {
    const map = new ManyToOne<string, number>(true)
    map.set("x", 10)
    map.set("y", 10)
    expect(map.getKeys(10)).toEqual(new Set(["x", "y"]))
  })

  test("should correctly store and retrieve keys (non-readonly mode)", () => {
    const map = new ManyToOne<string, number>(false)
    map.set("x", 10)
    map.set("y", 10)
    expect(map.getKeys(10)).toEqual(new Set(["x", "y"]))
  })

  test("should delete a key properly", () => {
    const map = new ManyToOne<string, number>()
    map.set("a", 1)
    expect(map.delete("a")).toBe(true)
    expect(map.get("a")).toBeUndefined()
  })

  test("should delete a value and its keys (readonly mode)", () => {
    const map = new ManyToOne<string, number>(true)
    map.set("a", 1)
    map.set("b", 1)
    expect(map.deleteValue(1)).toBe(true)
    expect(map.get("a")).toBeUndefined()
    expect(map.get("b")).toBeUndefined()
  })

  test("should delete a value and its keys (non-readonly mode)", () => {
    const map = new ManyToOne<string, number>(false)
    map.set("a", 1)
    map.set("b", 1)
    expect(map.deleteValue(1)).toBe(true)
    expect(map.get("a")).toBeUndefined()
    expect(map.get("b")).toBeUndefined()
  })

  test("should check existence of keys and values correctly", () => {
    const map = new ManyToOne<string, number>()
    map.set("x", 10)
    expect(map.has("x")).toBe(true)
    expect(map.hasValue(10)).toBe(true)
    expect(map.has("y")).toBe(false)
    expect(map.hasValue(99)).toBe(false)
  })

  test("should clear all mappings correctly", () => {
    const map = new ManyToOne<string, number>()
    map.set("a", 1)
    map.set("b", 2)
    map.clear()
    expect(map.keyCount()).toBe(0)
    expect(map.valueCount()).toBe(0)
  })
})