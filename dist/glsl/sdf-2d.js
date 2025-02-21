export const glsl_sdf2d = /* glsl */ `

  // Inigo Quilez
  // https://iquilezles.org/articles/distfunctions2d/

  // Circle - exact   (https://www.shadertoy.com/view/3ltSW2)
  float sdCircle( vec2 p, float r )
  {
    return length(p) - r;
  }

  // Rounded Box - exact   (https://www.shadertoy.com/view/4llXD7 and https://www.youtube.com/watch?v=s5NGeUV2EyU)
  float sdRoundedBox( in vec2 p, in vec2 b, in vec4 r )
  {
    r.xy = (p.x>0.0)?r.xy : r.zw;
    r.x  = (p.y>0.0)?r.x  : r.y;
    vec2 q = abs(p)-b+r.x;
    return min(max(q.x,q.y),0.0) + length(max(q,0.0)) - r.x;
  }

  // Box - exact   (https://www.youtube.com/watch?v=62-pRVZuS5c)
  float sdBox( in vec2 p, in vec2 b )
  {
    vec2 d = abs(p)-b;
    return length(max(d,0.0)) + min(max(d.x,d.y),0.0);
  }

  // Segment - exact   (https://www.shadertoy.com/view/3tdSDj and https://www.youtube.com/watch?v=PMltMdi1Wzg)
  float sdSegment( in vec2 p, in vec2 a, in vec2 b )
  {
    vec2 pa = p-a, ba = b-a;
    float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
    return length( pa - ba*h );
  }

  // Arc - exact   (https://www.shadertoy.com/view/wl23RK)
  float sdArc( in vec2 p, in vec2 sc, in float ra, float rb )
  {
    // sc is the sin/cos of the arc's aperture
    p.x = abs(p.x);
    return ((sc.y*p.x>sc.x*p.y) ? length(p-sc*ra) : 
                                  abs(length(p)-ra)) - rb;
  }

  float opRound( in float d, in float r )
  {
    return d - r;
  }

  float opOnion( in float d, in float r )
  {
    return abs(d) - r;
  }
`;
