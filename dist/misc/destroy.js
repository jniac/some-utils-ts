export function destroy(...destroyables) {
    for (const destroyable of destroyables.flat(2)) {
        if ('destroy' in destroyable) {
            destroyable.destroy();
        }
        else {
            destroyable();
        }
    }
}
export class DestroyableInstance {
    destroyables = [];
    collect(...values) {
        for (const value of values) {
            if (value) {
                if (Symbol.iterator in value) {
                    for (const destroyable of value) {
                        if (destroyable) {
                            this.destroyables.push(destroyable);
                        }
                    }
                }
                else {
                    this.destroyables.push(value);
                }
            }
        }
    }
    /**
     * Destroy all collected destroyables.
     *
     * NOTE: This method is bound to the instance and can be passed as a callback.
     */
    destroy = () => {
        destroy(this.destroyables);
        this.destroyables = [];
    };
}
