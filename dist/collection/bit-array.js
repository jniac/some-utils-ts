const bitsPerInt = 32;
/**
 * A class that represents a bit array.
 * It uses an ArrayBuffer to store the bits in a compact form.
 */
export class BitArray {
    #buffer;
    #view;
    get length() {
        return this.#view.length * bitsPerInt;
    }
    constructor(count) {
        if (count < 0 || !Number.isInteger(count)) {
            throw new Error('BitArray size must be a non-negative integer');
        }
        const intCount = Math.ceil(count / bitsPerInt);
        this.#buffer = new ArrayBuffer(intCount * 4);
        this.#view = new Int32Array(this.#buffer);
    }
    get(index) {
        if (index < 0 || index >= this.length) {
            throw new RangeError(`Index out of bounds: ${index}`);
        }
        const wordIndex = index >>> 5; // index / 32
        const bitOffset = index & 31; // index % 32
        return (this.#view[wordIndex] & (1 << bitOffset)) !== 0;
    }
    set(index, value) {
        if (index < 0 || index >= this.length) {
            throw new RangeError(`Index out of bounds: ${index}`);
        }
        const wordIndex = index >>> 5;
        const bitOffset = index & 31;
        const mask = 1 << bitOffset;
        if (value) {
            this.#view[wordIndex] |= mask; // set bit
        }
        else {
            this.#view[wordIndex] &= ~mask; // clear bit
        }
    }
    clear() {
        this.#view.fill(0);
    }
}
//# sourceMappingURL=bit-array.js.map