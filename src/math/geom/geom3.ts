import { Vector3Like } from '../../types'

export function intersectLineWithPlane<T extends Vector3Like>(
  line: { origin: Vector3Like, direction: Vector3Like },
  plane: { normal: Vector3Like, constant: number },
  out?: T,
): T | null {
  const { x: ox, y: oy, z: oz } = line.origin
  const { x: dx, y: dy, z: dz } = line.direction
  const { x: nx, y: ny, z: nz } = plane.normal

  // dot(plane.normal, line.direction)
  const denominator = nx * dx + ny * dy + nz * dz

  // If denominator is 0, ray is parallel to the plane
  if (Math.abs(denominator) < 1e-6)
    return null

  // dot(line.origin, plane.normal)
  const dot = ox * nx + oy * ny + oz * nz
  const t = - (dot + plane.constant) / denominator

  // Ray only:
  // if (t < 0)
  //   return null

  out ??= { x: 0, y: 0, z: 0 } as T

  // Calculate intersection point
  out.x = ox + dx * t
  out.y = oy + dy * t
  out.z = oz + dz * t

  return out
}
