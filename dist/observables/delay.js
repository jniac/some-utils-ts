const map = new Map();
let time = 0;
function update(newTime) {
    time = newTime;
    for (const [obs, { execTime, callback }] of map.entries()) {
        if (execTime < time) {
            map.delete(obs);
            callback();
        }
    }
}
if ('requestAnimationFrame' in globalThis && typeof globalThis.requestAnimationFrame === 'function') {
    const frame = (ms) => {
        globalThis.requestAnimationFrame(frame);
        const time = ms / 1e3;
        update(time);
    };
    globalThis.requestAnimationFrame(frame);
}
else {
    const interval = 1000 / 60;
    const start = Date.now();
    globalThis.setInterval(() => {
        const time = (Date.now() - start) / 1e3;
        update(time);
    }, interval);
}
function withDelay(obs, delay, callback) {
    const delaySeconds = typeof delay === 'number'
        ? delay
        : delay.endsWith('ms')
            ? Number.parseFloat(delay.slice(0, -2)) / 1e3
            : Number.parseFloat(delay.slice(0, -1));
    const execTime = time + delaySeconds;
    map.set(obs, { execTime, callback });
}
function clearDelay(obs) {
    map.delete(obs);
}
export { clearDelay, withDelay };
