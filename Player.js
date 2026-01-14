import { 
    drawPolygon ,
    convertToWorld , 
    checkPolygonsCollide , 
    reflectPolygonHor , 
    reflectPolygonVer ,
    checkBoxes , 
    makeRect ,
} from "./util.js";

class Player {
    constructor(_ctx, _x, _y) {
        //Basic
        this.ctx            = _ctx;
        this.x              = _x;
        this.y              = _y;
        this.w              = 20;
        this.h              = 40;
        this.t              = "p";

        this.speed          = 1.1;
        this.velX           = 0;
        this.velY           = 0;
        this.velYMax        = 15; //Terminal Velocity

        this.friction       = 0.7;
        //List of points for polygon
        //In order (offset X, offset Y, width, height);
        this.body_hitbox    = [{x:0,y:0}, {x:20,y:0}, {x:20,y:40}, {x:0,y:40}];

        //Used to keep track of what is being inputed by user and used to know how to move the player, either -1, 0, 1
        this.up             = false;
        this.down           = false;
        this.left           = false;
        this.right          = false;

        //Jump Vars
        this.jumpHeight     = 0;
        this.jumpHeightMax  = 12;
        this.jumps          = 0;
        this.jumpsMax       = 2;
        this.jumping        = false;

        this.jumpCD         = 0;
        this.jumpCDLen      = 8;

        //Ray to check if grounded
        this.jump_ray       = [{x:5,y:40},{x:15,y:40},{x:15,y:45},{x:5,y:45}];
        this.grounded       = false;

        // Directions and direction debug rays
        this.hor_dir        = 1;
        this.ver_dir        = 0;
        this.hor_dir_ray    = [{x:10,y:20},{x:40,y:20}]; // Debug
        this.ver_dir_ray    = [{x:10,y:20},{x:10,y:20}]; // Debug

        this.wall_hitbox    = [{x:18,y:10},{x:22,y:10},{x:22,y:30},{x:18,y:30}]; // Debug

        //Attacking Vars and Hitboxes
        this.swinging       = false;
        this.swingCDLen     = 25; // Debug
        this.swingAnimLen   = 10; // Debug
        this.swingCD        = this.swingCDLen;
        this.swingAnimCD    = 0;
        this.alreadyHit     = [];  //List of Enemies already hit by single attack so to prevent multiple hits
        
        this.hor_atk_hitbox = [{x:15,y:-30},{x:70,y:-20},{x:100,y:-5},{x:110,y:25},{x:80,y:40},{x:20,y:45}];
        this.ver_atk_hitbox = [{x:-20,y:30},{x:-13,y:-60},{x:10,y:-80},{x:33,y:-60},{x:40,y:30}];
        this.atk_hitbox     = this.hor_atk_hitbox;

        //Gravity
        this.base_gravity   = {x: 0, y: .5};
        this.gravity        = this.base_gravity;

        //Invincibility
        this.iframe         = false;
        this.iframeLen      = 800;
    }

    draw() {
        const hitbox = this.getPolygon();
        const jumpray = convertToWorld(this.x, this.y, this.jump_ray);
        const dirrayHor = convertToWorld(this.x, this.y, this.hor_dir_ray);
        const dirrayVer = convertToWorld(this.x, this.y, this.ver_dir_ray);
        const wallHitbox = convertToWorld(this.x, this.y, this.wall_hitbox);
        drawPolygon(this.ctx, hitbox, "red");
        drawPolygon(this.ctx, jumpray, "orange");
        drawPolygon(this.ctx, dirrayHor, "green");
        drawPolygon(this.ctx, dirrayVer, "blue");
        drawPolygon(this.ctx, wallHitbox, "orange");

        if(this.swinging && this.swingAnimCD <= this.swingAnimLen) {
            const atkhitbox = convertToWorld(this.x, this.y, this.atk_hitbox);
            drawPolygon(this.ctx, atkhitbox, "red");
        }
    }

    update(scene) {
        let lastPos = {x: this.x, y: this.y};
        
        if(this.left)   {
            this.velX += -1 * this.speed;
            if(this.hor_dir != -1) {
                this.hor_dir_ray = reflectPolygonHor(10, this.hor_dir_ray);
                this.wall_hitbox = reflectPolygonHor(10, this.wall_hitbox);
            }
            this.hor_dir = -1;
        }
        if(this.right)  {
            this.velX += 1 * this.speed;
            if(this.hor_dir != 1) {
                this.hor_dir_ray = reflectPolygonHor(10, this.hor_dir_ray);
                this.wall_hitbox = reflectPolygonHor(10, this.wall_hitbox);
            }
            this.hor_dir = 1;
        }
        if(this.up)     {
            this.ver_dir = 1;
            this.ver_dir_ray[1] = {x:10,y:-10};
        }
        if(this.down)     {
            this.ver_dir = -1;
            this.ver_dir_ray[1] = {x:10,y:50};
        }
        if(!this.up && !this.down) {
            this.ver_dir = 0;
            this.ver_dir_ray[1] = {x:10,y:20};
        }

        //Cooldowns
        this.swingCD ++;
        this.swingAnimCD ++;
        this.jumpCD ++;
        if(this.swingCD >= this.swingCDLen) {this.swinging = false}

        this.x += this.velX;
        this.y += this.velY;
        this.velX *= this.friction;

        //Make sure in air jumps aren't the same as grounded jumps
        if(this.jumps == 0 && !this.grounded) {this.jumps ++}

        //Terminal Velocity Check
        if(this.velY < this.velYMax) {this.velY += this.gravity.y;}
        else {this.velY = this.velYMax}

        //Check Collisions in the scene
        this.grounded = false;
        let p1;
        let p2;
        let col;
        for(let obj of scene) {
            //Check Object Collisions with player
            p1 = this.getPolygon();
            p2 = obj.getPolygon();
            col = checkPolygonsCollide(p1, p2)
            if(col) {
                switch(obj.t) {
                    case "w":
                        this.x += col.x;
                        this.y += col.y;
                        this.velX += col.x;
                        this.velY += col.y;
                        break;
                    case "s":
                        //Nothing Yet
                        break;
                    case "e":
                        if(!this.iframe) {
                            this.velX = 0;
                            this.velY = 0;
                            this.gravity = {x: 0, y: 0}
                            this.iframe = true;
                            setTimeout(() => {
                                console.log(col.origin);
                                let dx = (this.x + this.w/2) - col.origin.x;
                                let dy = (this.y + this.h/2) - col.origin.y;
                                console.log(dx, dy);
                                if(dx) {this.velX = dx/Math.abs(dx) * 25;}
                                if(dy) {this.velY = dy/Math.abs(dy) * 5;}
                                this.gravity = this.base_gravity;
                                console.log("3", this.x, this.y, this.velX, this.velY);
                            }, 100);
                            setTimeout(() => {
                                this.iframe = false;
                            }, this.iframeLen);
                        }
                        break;
                }
            }

            //Check Wall Slide Collision to slow down on Walls
            p1 = convertToWorld(this.x, this.y, this.wall_hitbox);
            col = checkPolygonsCollide(p1, p2);
            if(col && obj.t == "w") {
                this.velY *= 0.9;
            }

            //Check if Player is grounded using Jump Ray
            p1 = convertToWorld(this.x, this.y, this.jump_ray);
            col = checkPolygonsCollide(p1, p2)
            if(col && obj.t == "w") {
                this.jumps = 0;
                this.grounded = true;
            }

            //Check if Player's attack hit any enemies;
            if(this.swingAnimCD < this.swingAnimLen && this.swinging) {
                p1 = convertToWorld(this.x, this.y, this.atk_hitbox);
                col = checkPolygonsCollide(p1, p2)
                if(col && obj.t == "e") {
                    let hit = false;
                    for(let i of this.alreadyHit) {
                        if(i == obj.id) {hit = true;}
                    }
                    if(!hit) {
                        this.alreadyHit.push(obj.id);
                        obj.ai.damage(10, this);
                        //Check and Execute Pogo
                        if(this.ver_dir == -1) {
                            this.velY *= .6;
                            setTimeout(() => {
                                this.velY = -8;
                                this.jumps = 0;
                            }, 50);
                        //Else then do horizontal knockback
                        } else if(this.ver_dir == 0) {
                            this.velX -= this.hor_dir * 2;
                        }
                    }
                }
            }
        }

        //Get Player difference move all other objects in scene relative to Player
        let dPos = {x: this.x - lastPos.x, y: this.y - lastPos.y};
        this.x = lastPos.x;
        this.y = lastPos.y;
        return dPos;
    }


    // WIP >>>>>>>>>>>>>>>>>>>>>>>>>>>>
    jump(scene) {
        //Check for Wall Hop
        if(!this.grounded) {
            let p = convertToWorld(this.x, this.y, this.wall_hitbox);
            //this.extras.push(p[0].x)
            for(let obj of scene) {
                if(obj.t == "w") {
                    let w = obj.getPolygon();
                    let col = false;
                    col = checkPolygonsCollide(p, w);
                    if(col) {
                        this.jumps = 0;
                        this.velX = (-this.hor_dir/Math.abs(this.hor_dir)) * 20;
                        this.velY = -10;
                        this.jumping = true;
                    }
                }
            }
        }

        // Regular jump
        if(this.jumps < this.jumpsMax && !this.jumping) {
            let timeout = 0;
            if(this.jumps > 0) {
                timeout = 100;
                this.velY *= 0.6;
            }
            setTimeout(() => {
                this.velY = -13;
                this.jumps++;
            }, timeout);
        } 
        this.jumpCD = 0;
    }
    // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

    //If jump button released
    releaseJump() {
        if(this.velY < 0) {
            this.velY *= 0.2;
            this.jumping = false;
        }
    }

    swing() {
        this.alreadyHit = [];
        if(this.ver_dir != 0) {
            this.atk_hitbox = this.ver_atk_hitbox;
            if(this.ver_dir == -1 && !this.grounded) {
                this.atk_hitbox = reflectPolygonVer(20, this.atk_hitbox);
            }
            else if(this.ver_dir == -1) {return}
        } else {
            this.atk_hitbox = this.hor_atk_hitbox;
            if(this.hor_dir == -1) {this.atk_hitbox = reflectPolygonHor(10, this.atk_hitbox)}
        
        }
        this.swingCD = 0;
        this.swingAnimCD = 0;
    }

    getPolygon() {
        return convertToWorld(this.x, this.y, this.body_hitbox);
    }

    getCenter() {
        return {x: this.x + this.w/2, y: this.y + this.h/2};
    }
}

export { Player };