import * as parkmiller from './algorithm/parkmiller-c-iso.js';
function createRandomUtils() {
    let random = Math.random;
    let doResetRandom = () => { };
    function _new(...args) {
        return createRandomUtils().setRandom(...args);
    }
    function setRandom(...args) {
        const [newRandom, seed = 0] = args;
        if (newRandom === 'parkmiller') {
            let state = parkmiller.init(seed);
            random = () => {
                state = parkmiller.next(state);
                return parkmiller.map(state);
            };
            doResetRandom = (seed) => {
                state = parkmiller.init(seed);
            };
        }
        else {
            if (newRandom !== undefined && typeof newRandom !== 'function')
                throw new Error('Invalid random function');
            random = newRandom ?? Math.random;
            doResetRandom = () => { };
        }
        doResetRandom(seed);
        return instance;
    }
    function seed(seed) {
        doResetRandom(seed === 'reset' ? 0 : seed ?? 0);
        return instance;
    }
    function number(...args) {
        if (args.length === 0)
            return random();
        if (args.length === 1)
            return random() * args[0];
        if (args.length === 2)
            return random() * (args[1] - args[0]) + args[0];
        throw new Error('Invalid arguments');
    }
    function int(...args) {
        if (args.length === 1)
            return Math.floor(random() * args[0]);
        if (args.length === 2)
            return Math.floor(random() * (args[1] - args[0])) + args[0];
        throw new Error('Invalid arguments');
    }
    function hexColor() {
        const randomColor = Math.floor(random() * 0xffffff);
        return `#${randomColor.toString(16).padStart(6, '0')}`;
    }
    function pickIndex(weights) {
        if (weights.length === 0)
            throw new Error('Weights array is empty');
        const totalWeight = weights.reduce((acc, weight) => acc + weight, 0);
        const randomValue = random() * totalWeight;
        let cumulativeWeight = 0;
        for (let i = 0; i < weights.length; i++) {
            cumulativeWeight += weights[i];
            if (randomValue < cumulativeWeight)
                return i;
        }
        return weights.length - 1;
    }
    function pick(array, weights) {
        if (array.length === 0)
            throw new Error('Array is empty');
        if (weights) {
            const index = pickIndex(weights);
            return array[index];
        }
        const index = Math.floor(random() * array.length);
        return array[index];
    }
    const instance = {
        new: _new,
        setRandom,
        seed,
        get random() {
            return random;
        },
        number,
        int,
        hexColor,
        pickIndex,
        pick,
    };
    return instance;
}
/**
 * Agnostic random utility module.
 *
 * RandomUtils is an agnostic utility module wrapped around a random function
 * (Math.random by default) that helps to use random numbers in common situations
 * (like generating random numbers in a range, picking an item in a list with weight
 * considerations, etc.)
 *
 * Why?
 * - Because we want a solution that can use any random function, not just Math.random,
 *   neither we want to be tied to a specific implementation.
 * - Instead of using a specific random function, the module focuses on the
 *   sometimes complex logic and painful details of using random numbers in a
 *   consistent way.
 */
export const RandomUtils = createRandomUtils();
//# sourceMappingURL=random-utils.js.map