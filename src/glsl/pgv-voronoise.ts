/**
 * From https://thebookofshaders.com/12
 */
export const glsl_pgv_voronoise = /* glsl */`
vec2 random2( vec2 p ) {
    return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);
}

vec2 pgv_voronoise(vec2 p) {
    float m_dist = 10.;  // minimum distance
    vec2 m_point;        // minimum point

    vec2 i_st = floor(p.xy);
    vec2 f_st = fract(p.xy);
    
    for (int j=-1; j<=1; j++ ) {
        for (int i=-1; i<=1; i++ ) {
            vec2 neighbor = vec2(float(i),float(j));
            vec2 point = random2(i_st + neighbor);
            //point = 0.5 + 0.5*sin(u_time + 6.2831*point);
            vec2 diff = neighbor + point - f_st;
            float dist = length(diff);

            if( dist < m_dist ) {
                m_dist = dist;
                m_point = point;
            }
        }
    }
 	return vec2(dot(m_point,vec2(.3,.6)), m_dist);  
}
`