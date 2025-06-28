export const glsl_color_adjust = /* glsl */`

float contrast(float mValue, float mScale, float mMidPoint) {
	// Why clamp? If necessary, it has to be done outside of this function.
	// return clamp((mValue - mMidPoint) * mScale + mMidPoint, 0.0, 1.0);
	return (mValue - mMidPoint) * mScale + mMidPoint;
}

float contrast(float mValue, float mScale) {
	return contrast(mValue, mScale, 0.5);
}

vec3 contrast(vec3 mValue, float mScale, float mMidPoint) {
	return vec3(contrast(mValue.r, mScale, mMidPoint), contrast(mValue.g, mScale, mMidPoint), contrast(mValue.b, mScale, mMidPoint));
}

vec3 contrast(vec3 mValue, float mScale) {
	return contrast(mValue, mScale, 0.5);
}

float greyscaleFloat(vec3 color) {
	return dot(color, vec3(0.299, 0.587, 0.114));
}

vec3 greyscale(vec3 color) {
	return vec3(greyscaleFloat(color));
}

vec3 greyscale(vec3 color, float alpha) {
	return mix(color, greyscale(color), alpha);
}

`