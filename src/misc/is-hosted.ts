export function isHosted() {
  return typeof window !== 'undefined'
    && window.location.hostname !== 'localhost'
    && !window.location.hostname.startsWith('192.168.')
}
