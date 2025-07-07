/**
 * Return the position of an object after applying penetration (cx) integration (distance).
 * 
 * Note: 
 * - `penetration` is the coefficient of penetration into the "air", it is complemetary to drag (1 - drag).
 * - `penetration = 1` means that the object will perfectly penetrate the air without any drag.
 * - `penetration = 0` means that the object will not penetrate the air at all.
 * - velocity is the initial velocity of the object.
 */
export function dragPenetrationIntegration(
  velocity: number,
  penetration: number,
  deltaTime: number,
): number {
  return velocity * (Math.pow(penetration, deltaTime) - 1) / Math.log(penetration)
}

/**
 * Return the limit of penetration integration (distance) based on the current 
 * velocity and penetration coefficient.
 */
export function dragPenetrationIntegrationLimit(
  velocity: number,
  penetration: number,
): number {
  return -velocity / Math.log(penetration)
}

/**
 * Compute the penetration value based on the current velocity and desired limit.
 */
export function computePenetration(
  currentVelocity: number,
  desiredLimit: number,
): number {
  return Math.exp(-currentVelocity / desiredLimit)
}

/**
 * Compute the velocity required to reach a desired limit based on the current penetration.
 */
export function computeVelocity(
  currentPenetration: number,
  desiredLimit: number,
): number {
  return -desiredLimit * Math.log(currentPenetration)
}
