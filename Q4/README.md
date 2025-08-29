# Insect Boid Swarm

This is my best effort at implementing a flying insect boid system. This is not something I had ever tried before. In fact, I was aware of boid swarms in a fairly general way prior to this exercise.

## 3D Modeling
I used the [Three.js](https://threejs.org/) library for 3D modeling. To be best of my knowledge, I've never done any 3D modeling before. Three.js is well documented and apparently has a pretty active community - it was easy to find documentation on just about any issue I encountered.

One issue I did encounter: according to the documentation, Vector3 should support simple vector arithmetic directly, so you should be able to write something like `v1 + v2` instead of `v1.add(v2)` or etc. I was never able to get that to work. Whenever I tried it, the resulting value was not a useable Vector3 instance. Vector3 has all the neccessary functions to support the math I needed to do, so this was more of an annoyance and a head-scratcher. I don't really understand why that never worked for me.

When it came to implementing the 3D model, I borrowed agressively from [this](https://threejs.org/examples/#webgl_buffergeometry_drawrange) example. Ultimately I jestisoned a great deal of the example code, but it helped a lot to have it all laid out from the beginning. There are a few drawbacks to this design. Most notably, *all* particles are instantiated, whether they're visible or not. Only visible particles are updated, but the position and velocity of boids that have been shown and then hidden again are not cleared.

## Boid Stuff
I read several overviews of boid systems, but I drew most directly from [this](https://vergenet.net/~conrad/boids/pseudocode.html) write-up by Conrad Parker. I read enough other stuff to know there's nothing particularly unique to this approach. As near as I can tell, pretty much everyone does this more or less the same way, with more or fewer imbellishments. I believe there are a couple of error's in Parker's math, but the approach is straight-forward.

To make the swarm more insect-specific, I relied on (this)[https://gamma.cs.unc.edu/BSwarm/Bswarm.pdf] 2015 paper that was the result of joint research at the University of North Carolina and Zhejiang University. I must confess that my engagement with the paper was somewhat superficial. I implemented a noise function and a pursuit function (two of the behaviors described in the paper) but my noise function, in particular, isn't very sophisticated, and I'm concerned that my pursuit function doesn't work the way I wanted it to (although it *does* work - it's responsible for the swarm's tendency to drift down to and land on the 'ground').