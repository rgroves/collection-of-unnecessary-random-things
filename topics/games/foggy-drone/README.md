# FoggyDrone

This is an add-on/hack for [FOGGY.Golf](https://foggy.golf/) ([created by Reactvts](https://reactvts.com/)) which allows you to deploy a "simulated Drone" with Fog-Peeking Hole Detection and Lasing Capabilities For Foggy Golfers.

This was a project inspired by poking around the source and having the thought, "hey, I noticed this game exposes certain elements of the game state locally (primarily the location of the hole); let's see if I can use that to create a hint for where the hole is located." Given that, there's a good chance that it may no longer work in the future, if the state that exposes the hole's location becomes unavailable. Until then, I'll try to keep this updated. Enjoy!

Copy & Paste [this code](foggy-drone.js) into your DevTools Console Window (😅 "What, me worry?")

A new button will be added to the club options section: 👁️

- 1st click activates drone and performs a Level 3 Scan which lases a wide area hint
- 2nd click activates drone and performs a Level 2 Scan which lases a narrow area hint
- 3rd click activates drone and performs a Level 1 Scan which lases the exact location of hole

The drone does not reveal any tree, water, bunker obstacles (because that would suck all the fun out of it... you know, instead of just sucking a little fun out of it).

Happy Golfing!
