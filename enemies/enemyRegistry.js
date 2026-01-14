import { BasicWanderer } from "./behaviors/BasicWanderer.js";
import { BasicFlyer } from "./behaviors/BasicFlyer.js";

const enemyRegistry = {
    "basic1" : {
        hp: 100,
        speed: 1.5,
        w: 30,
        h: 20,
        hitbox: [{x:0,y:0},{x:30,y:0},{x:30,y:20},{x:0,y:20},],
        sight: 0,
        friction: 0.7,
        gravity: {x: 0, y: 0.5},
        stun: 500,
        ai: BasicWanderer
    },

    "basic2" : {
        hp: 80,
        speed: 0.01,
        w: 20,
        h: 10,
        hitbox: [{x:0,y:0},{x:20,y:0},{x:20,y:10},{x:0,y:10}],
        sight: 0,
        friction: 0.95,
        gravity: {x: 0, y: 0},
        stun: 100,
        ai: BasicFlyer
    }
}

export { enemyRegistry };