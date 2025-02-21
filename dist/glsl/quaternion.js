export const glsl_quaternion = /* glsl */ `

// From the excellent following:
// https://www.geeks3d.com/20141201/how-to-rotate-a-vertex-by-a-quaternion-in-glsl/

vec4 qConj(vec4 q) { 
  return vec4(-q.x, -q.y, -q.z, q.w); 
}

vec4 qFromAxisAngle(vec3 axis, float angle) { 
  vec4 qr;
  float half_angle = (angle * 0.5);
  qr.x = axis.x * sin(half_angle);
  qr.y = axis.y * sin(half_angle);
  qr.z = axis.z * sin(half_angle);
  qr.w = cos(half_angle);
  return qr;
}

vec4 qMult(vec4 q1, vec4 q2) { 
  vec4 qr;
  qr.x = (q1.w * q2.x) + (q1.x * q2.w) + (q1.y * q2.z) - (q1.z * q2.y);
  qr.y = (q1.w * q2.y) - (q1.x * q2.z) + (q1.y * q2.w) + (q1.z * q2.x);
  qr.z = (q1.w * q2.z) + (q1.x * q2.y) - (q1.y * q2.x) + (q1.z * q2.w);
  qr.w = (q1.w * q2.w) - (q1.x * q2.x) - (q1.y * q2.y) - (q1.z * q2.z);
  return qr;
}

vec3 qTransform(vec3 v, vec4 q) {
  return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);
}

// vec3 rotateByAxisAngle(vec3 v, vec3 axis, float angle) { 
//   vec4 qr = qFromAxisAngle(axis, angle);
//   vec4 qr_conj = qConj(qr);
//   vec4 q_pos = vec4(v.x, v.y, v.z, 0.0);
  
//   vec4 q_tmp = qMult(qr, q_pos);
//   qr = qMult(q_tmp, qr_conj);
  
//   return vec3(qr.x, qr.y, qr.z);
// }

vec3 rotateByAxisAngle(vec3 v, vec3 axis, float angle) { 
  vec4 q = qFromAxisAngle(axis, angle);
  return qTransform(v, q);
}

vec3 rotateByAxisAngleAroundPoint(vec3 v, vec3 axis, float angle, vec3 point) {
  return rotateByAxisAngle(v - point, axis, angle) + point;
}
`;
