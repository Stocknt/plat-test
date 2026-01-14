import { Player } from "./Player.js";
import { Structure } from "./Structure.js";
import { Enemy } from "./enemies/Enemy.js";

const canvas        = document.getElementById("canvas");
const ctx           = canvas.getContext("2d");

document.addEventListener("keydown", keyDownHandler);
document.addEventListener("keyup", keyUpHandler);

let player          = new Player(ctx, canvas.clientWidth/2, canvas.clientHeight/2);

let debugging       = false;
let debug           = false;

let scene           = [
    new Structure(ctx, 200, 600, [{x:0,y:0}, {x:820,y:0}, {x:820,y:20}, {x:0,y:20}]),
    new Structure(ctx, 200, 780, [{x:0,y:0}, {x:820,y:0}, {x:820,y:20}, {x:0,y:20}]),

    new Structure(ctx, 200, 600, [{x:0,y:0}, {x:20,y:0}, {x:20,y:100}, {x:0,y:100}]),
    new Structure(ctx, 400, 700, [{x:0,y:0}, {x:20,y:0}, {x:20,y:100}, {x:0,y:100}]),
    new Structure(ctx, 600, 600, [{x:0,y:0}, {x:20,y:0}, {x:20,y:100}, {x:0,y:100}]),
    new Structure(ctx, 800, 700, [{x:0,y:0}, {x:20,y:0}, {x:20,y:100}, {x:0,y:100}]),
    new Structure(ctx, 1000, 600, [{x:0,y:0}, {x:20,y:0}, {x:20,y:100}, {x:0,y:100}]),

    new Structure(ctx, 800, 400, [{x:0,y:0}, {x:0,y:200}, {x:-100,y:200}, {x:-100,y:100}]),
    new Structure(ctx, 300, 100, [{x:0,y:0}, {x:50,y:0}, {x:50,y:500}, {x:0,y:500}]),

    new Structure(ctx, 630, 400, [{x:0,y:0}, {x:30,y:0}, {x:30,y:10}, {x:0,y:10}]),

    new Structure(ctx, 700, 200, [{x:0,y:0}, {x:200,y:0}, {x:200,y:100}, {x:0,y:100}]),

    new Enemy(ctx, 900, 400, "basic2"),
    //new Enemy(ctx, 100, 400, "basic2"),
    new Enemy(ctx, 500, 600, "basic1")
]

if(!debugging) {window.requestAnimationFrame(step)}

function step() {
    update();
    draw();
    if(!debugging) {window.requestAnimationFrame(step)}
}

function update() {
    
    const p = scene.filter(a => a.t == "p")[0];
    if(!p) {scene.push(player)};
}

function draw() {
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

    let d = player.update(scene);
    const l = scene.filter(a => a.t != "p");
    for(let obj of l) { obj.slide(d);}

    player.draw();

    const structures = scene.filter(a => a.t != "e");
    for(let obj of structures) {obj.draw()}

    const enemies = scene.filter(a => a.t == "e");
    for(let obj of enemies) {obj.update(scene); obj.draw()}
}

function keyDownHandler(e) {
    switch(e.code) {
        case "KeyW":
            player.up       = true;
            break;
        case "KeyS":
            player.down     = true;
            break;
        case "KeyA":
            player.left     = true;
            break;
        case "KeyD":
            player.right    = true;
            break;
        case "KeyI":
            if(!player.jumping && player.jumpCD >= player.jumpCDLen) {player.jump(scene)}
            player.jumping = true;
            break;
        case "KeyJ":
            if(!player.swinging && player.swingCD >= player.swingCDLen) {player.swing()}
            player.swinging = true;
            break;
        case "KeyV":
            if(!debug && debugging) {
                window.requestAnimationFrame(step);
                debug = true;
            }
            
            break;
        case "KeyB":
            if(!debugging) {
                debugging = true;
            }
            break;
    }
}
function keyUpHandler(e) {
    switch(e.code) {
        case "KeyW":
            player.up       = false;
            break;
        case "KeyS":
            player.down     = false;
            break;
        case "KeyA":
            player.left     = false;
            break;
        case "KeyD":
            player.right    = false;
            break;
        case "KeyI":
            if(player.jumping) {player.releaseJump()}
            player.jumping = false;
            break;
        case "KeyJ":
            //player.swinging = false;
            break;
        case "KeyV":
            debug = false;
            break;
        case "KeyB":
            debugging = false;
            window.requestAnimationFrame(step);
            break;
    }
}