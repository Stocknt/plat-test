import { makeRect , convertToWorld , checkPolygonsCollide } from "../../util.js";

class BasicWanderer {
    constructor(obj=null) {
        this.obj = obj;

        this.pause = false;
        this.stun = false;

        this.stunLen = 500;

        this.left_edge_ray      = makeRect(-4, this.obj.h, 1, 10);
        this.right_edge_ray     = makeRect(this.obj.w+4, this.obj.h, 1, 10);

        this.extras             = [[this.left_edge_ray, "orange"], [this.right_edge_ray, "orange"]];

        this.iframe     = false;
        this.iframeLen  = 100;
    }

    update(scene) {
        this.wander(scene);
        this.obj.checkCollisions(scene);

        this.checkEdges(scene);
        
        this.obj.velX *= this.obj.friction;
    }

    slide(d) {
        this.obj.x -= d.x;
        this.obj.y -= d.y;
    }

    wander(scene) {
        if(!this.pause && !this.stun) {this.obj.velX = this.obj.dir * this.obj.speed;}
    }

    wallHit(edge) {
        if(!this.stun) {
            this.bounce(edge);
        } 
    }

    lostEdge(edge) {
        if(!this.stun) {
            this.bounce(edge);
        }
    }

    checkEdges(scene) {
        let leftGrounded = false;
        let rightGrounded = false;
        let poly1 = convertToWorld(this.obj.x, this.obj.y, this.left_edge_ray);
        let poly2;
        let col;
        
        for(let obj of scene)  {
            poly2 = obj.getPolygon();
            col = checkPolygonsCollide(poly1, poly2);
            if(col) {
                if(obj.t == "w") {leftGrounded = true;}
            }
        }
        poly1 = convertToWorld(this.obj.x, this.obj.y, this.right_edge_ray);
        for(let obj of scene)  {
            poly2 = obj.getPolygon();
            col = checkPolygonsCollide(poly1, poly2);
            if(col) {
                if(obj.t == "w") {rightGrounded = true;}
            }
        }
        if((!leftGrounded || !rightGrounded) && !(!leftGrounded && !rightGrounded)) {
            if(!leftGrounded) {this.lostEdge(-1)}
            else if(!rightGrounded) {this.lostEdge(1)}
        }
    }

    bounce(edge) {
        this.obj.dir = edge * -1;
        this.obj.x += this.obj.dir * 5;
    }
    damage(dmg, origin) {
        if(!this.obj.iframe) {
            this.obj.hp -= dmg;
            this.obj.stunned = true;
            let dx = (this.obj.x + this.obj.w/2) - (origin.x + origin.w/2);
            let dy = (this.obj.y + this.obj.h/2) - (origin.y + origin.h/2);
            
            if(Math.abs(dy) < 15) {dx = (120 * (dx/Math.abs(dx))) - dx;}
            this.obj.velX += dx/8;
            this.obj.velY -= 3;
            setTimeout(() => {
                this.obj.stunned = false;
            }, this.obj.stunLen);
            this.obj.iframe = true;
            setTimeout(() => {
                this.obj.iframe = false;
            }, this.obj.iframeLen);
        }
    }
}

export { BasicWanderer };