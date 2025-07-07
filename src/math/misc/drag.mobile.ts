import {
  computePenetration,
  computeVelocity,
  dragPenetrationIntegration,
  dragPenetrationIntegrationLimit,
} from './drag'

export class DragMobile {
  /**
   * The position of the object, in units.
   */
  position = 0;

  /**
   * The velocity of the object, in units per second.
   * A value of 1 means that the object will move 1 unit every second.
   */
  velocity = 1;

  /**
   * The drag coefficient, where 0 means no drag and 1 means full drag.
   *
   * A value of 0.1 means that the velocity will be reduced by 10% every second.
   */
  drag = 0.75;

  positionOld = 0;
  velocityOld = 0;

  constructor(props?: Parameters<DragMobile['set']>[0]) {
    if (props) {
      this.set(props)
    }
  }

  set({
    position = this.position, velocity = this.velocity, drag = this.drag,
  } = {}): this {
    this.position = position
    this.velocity = velocity
    this.drag = drag
    return this
  }

  setDrag(drag: number, { timeSpan = 1 } = {}): this {
    this.drag = Math.pow(drag, timeSpan)
    return this
  }

  update(deltaTime: number) {
    if (deltaTime <= 0) return

    this.positionOld = this.position
    this.velocityOld = this.velocity

    this.position += dragPenetrationIntegration(this.velocity, 1 - this.drag, deltaTime)
    this.velocity *= Math.pow(1 - this.drag, deltaTime)
  }

  getDestination() {
    return this.position + dragPenetrationIntegrationLimit(this.velocity, 1 - this.drag)
  }

  getDragForDestination(destination: number) {
    const penetration = computePenetration(this.velocity, destination - this.position)
    return {
      drag: 1 - penetration,
      valid: penetration > 0 && penetration < 1,
    }
  }

  setDragForDestination(destination: number): this {
    const { drag } = this.getDragForDestination(destination)
    this.drag = drag
    return this
  }

  /**
   * Get the required velocity to set the destination as the limit of the current
   * movement (according to the current `drag` value).
   */
  getVelocityForDestination(destination: number) {
    return {
      velocity: computeVelocity(1 - this.drag, destination - this.position),
    }
  }

  /**
   * Will set the velocity to set the destination as the limit of the current
   * movement (according to the current `drag` value).
   */
  setVelocityForDestination(destination: number): this {
    this.velocity = this.getVelocityForDestination(destination).velocity
    return this
  }
}
