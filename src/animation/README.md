# Animation

## Core concept

2 main usage :

### 1. Dynamic
Animation instances are created at any moment, once they are complete, they are 
automatically destroyed.

- `target` helps to automatically cancel / destroy previously created animations.
- `prerun` helps to initiate state when a delay is set (otherwise we have to wait
the delay before the first update may occur).

### 2. Stored
Animation instances are created but kept in memory for further usage. They won't
be automatically 

- `prerun` & `target` are generally useless (multiple animation may target one same
object)
- `set()`, `play()`, `pause()` are useful to control the animation instances.
