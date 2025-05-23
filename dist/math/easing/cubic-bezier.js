const cubic01 = (x2, x3, t) => {
    const ti = 1 - t;
    const t2 = t * t;
    return (+3 * ti * ti * t * x2
        + 3 * ti * t2 * x3
        + t2 * t);
};
const cubic01SearchT = (x2, x3, x, iterations = 6, precision = 0.0001, lowerT = 0, upperT = 1, lowerX = 0, upperX = 1) => {
    if (x <= precision) {
        return 0;
    }
    if (x >= 1 - precision) {
        return 1;
    }
    let diffX = 0, currentX = 0, currentT = 0;
    for (let i = 0; i < iterations; i++) {
        currentT = (lowerT + upperT) / 2;
        currentX = cubic01(x2, x3, currentT);
        diffX = x - currentX;
        if (Math.abs(diffX) <= precision) {
            return currentT;
        }
        if (diffX < 0) {
            upperT = currentT;
            upperX = currentX;
        }
        else {
            lowerT = currentT;
            lowerX = currentX;
        }
    }
    // return the final linear interpolation between lower and upper bounds
    return lowerT + (upperT - lowerT) * (x - lowerX) / (upperX - lowerX);
};
const solveCubicEase = (x1, y1, x2, y2, x, iterations, precision) => {
    const t = cubic01SearchT(x1, x2, x, iterations, precision);
    const y = cubic01(y1, y2, t);
    return y;
};
export { cubic01SearchT, solveCubicEase };
//# sourceMappingURL=cubic-bezier.js.map