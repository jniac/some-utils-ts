import { StringMatcher } from './types'

export function applyStringMatcher(str: string, matcher: StringMatcher) {
  if (matcher === '*') {
    return true
  }
  if (typeof matcher === 'string') {
    return matcher === str
  }
  if (matcher instanceof RegExp) {
    return matcher.test(str)
  }
  if (typeof matcher === 'function') {
    return matcher(str)
  }
  return false
}
