import { enemyRegistry } from "./enemyRegistry.js";

import { drawPolygon, convertToWorld , checkPolygonsCollide , makeRect } from "../util.js";

class Enemy {
    constructor(ctx, x, y, type) {
        this.ctx                = ctx;
        this.x                  = x;
        this.y                  = y;

        this.t                  = 'e';

        this.data               = enemyRegistry[type];

        this.w                  = this.data.w;
        this.h                  = this.data.h;
        this.dir                = 1;

        this.hp                 = this.data.hp;
        
        this.base_speed         = this.data.speed;
        this.speed              = this.base_speed;
        this.sight              = this.data.sight;
        this.friction           = this.data.friction;
        this.gravity            = this.data.gravity;
        this.ai                 = new this.data.ai(this);

        this.body_hitbox        = this.data.hitbox;

        this.velX               = 0;
        this.velY               = 0;

        this.dir_ray            = [{x:this.w/2,y:this.h/2},{x:this.w +20,y:this.h/2}];

        this.id                 = Math.random().toFixed(3);
    }

    update(bounds) {
        this.x += this.velX;
        this.y += this.velY;

        this.velX += this.gravity.x;
        this.velY += this.gravity.y;

        this.dir_ray[1].x = this.w/2 + ((this.w/2 + 20) *this.dir);

        this.ai.update(bounds);
    }
    
    draw() {
        drawPolygon(this.ctx, this.getPolygon(), "red");
        for(let i of this.ai.extras) {
            drawPolygon(this.ctx, convertToWorld(this.x, this.y, i[0]), i[1]);
        }

        drawPolygon(this.ctx, convertToWorld(this.x, this.y, this.dir_ray), "green");
    }

    getPolygon() {
        return convertToWorld(this.x, this.y, this.body_hitbox);
    }

    checkCollisions(bounds) {
        let poly1 = this.getPolygon();
        let poly2;
        let col;
        for(let obj of bounds)  {
            poly2 = obj.getPolygon();
            col = checkPolygonsCollide(poly1, poly2);
            if(col) {
                if(obj.t == "w") {
                    this.x += col.x;
                    this.y += col.y;

                    this.velX += col.x;
                    this.velY += col.y;

                    if(Math.abs(col.axis.x) > 0 ){
                        let edge = col.origin.x - (this.x + this.w);
                        edge /= Math.abs(edge);
                        this.ai.wallHit(edge);
                    }
                }
            }
        }
    }
    getCenter() {
        return {x: this.x + this.w/2, y: this.y + this.h/2};
    }

    slide(d) {
        this.ai.slide(d);
    }
}

export { Enemy };