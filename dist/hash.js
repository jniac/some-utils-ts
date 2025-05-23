const circularShiftLeft = (x) => {
    return (x << 1) | (x >>> 31);
};
/**
 * Hashing numbers through simple bitwise operations using ArrayBuffer.
 *
 * Properties:
 * - Hashes numbers as Float64
 * - `getValueAsInt32()` returns , so for one given float there is one chance over
 *   4_294_967_296 to collide with another float.
 *
 * How does it works?
 * - An 16-bytes-length ArrayBuffer is created for each new instance. That small
 *   buffer represents the internal state.
 * - The ArrayBuffer is used to convert 1 Float64 to 2 Int32 without data loss.
 * - Bitwise operations are applied over Int32 values (shift and xor)
 */
export class Hash {
    static _instance = new Hash();
    static init() {
        Hash._instance.init();
        return Hash;
    }
    static update(value) {
        Hash._instance.update(value);
        return Hash;
    }
    static updateNumbers(numbers) {
        Hash._instance.updateNumbers(numbers);
        return Hash;
    }
    static updateString(str) {
        Hash._instance.updateString(str);
        return Hash;
    }
    static getValue() {
        return Hash._instance.getValue();
    }
    static getValueAsInt32() {
        return Hash._instance.getValueAsInt32();
    }
    static getDebugString() {
        return Hash._instance.getDebugString();
    }
    static get value() {
        return Hash._instance.value;
    }
    _buffer = new ArrayBuffer(16);
    _f64 = new Float64Array(this._buffer);
    _i32 = new Int32Array(this._buffer);
    constructor() {
        this.init();
    }
    init() {
        this._i32[0] = 0b11011110101000001010000101011111;
        this._i32[1] = 0b00101101111011111101111000101000;
        return this;
    }
    update = (() => {
        // Direct access to buffers (without "this") performs 40% faster.
        const { _i32, _f64 } = this;
        return value => {
            _f64[1] = value;
            _i32[0] = circularShiftLeft(_i32[0]) ^ _i32[2];
            _i32[1] = circularShiftLeft(_i32[1]) ^ _i32[3];
            return this;
        };
    })();
    updateNumbers = (() => {
        // Direct access to buffers (without "this") performs 40% faster.
        const { _i32, _f64 } = this;
        return numbers => {
            const max = numbers.length;
            for (let i = 0; i < max; i++) {
                _f64[1] = numbers[i];
                _i32[0] = circularShiftLeft(_i32[0]) ^ _i32[2];
                _i32[1] = circularShiftLeft(_i32[1]) ^ _i32[3];
            }
            return this;
        };
    })();
    updateString = (() => {
        // Direct access to buffers (without "this") performs 40% faster.
        const { _i32, _f64 } = this;
        return str => {
            str = String(str); // Force cast.
            const max = str.length;
            for (let i = 0; i < max; i++) {
                _f64[1] = str.charCodeAt(i);
                _i32[0] = circularShiftLeft(_i32[0]) ^ _i32[2];
                _i32[1] = circularShiftLeft(_i32[1]) ^ _i32[3];
            }
            return this;
        };
    })();
    getValue() {
        return this._f64[0];
    }
    getValueAsInt32() {
        return this._i32[0] ^ this._i32[1];
    }
    getValueAsBigUint64() {
        return new BigUint64Array(this._buffer)[0];
    }
    get value() {
        return this.getValue();
    }
    getDebugString() {
        const to0b = (x) => {
            x = x | 0;
            const sign = x < 0;
            x = x & 0b01111111111111111111111111111111;
            return `${(sign ? '1' : '0')}${x.toString(2).padStart(31, '0')}`;
        };
        const [a, b, c, d] = [...this._i32].map(to0b);
        return [
            'value:',
            this.getValue(),
            'state:', a, b,
            'last "next" value:', c, d,
        ].join('\n');
    }
}
//# sourceMappingURL=hash.js.map