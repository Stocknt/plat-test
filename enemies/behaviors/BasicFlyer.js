import { 
    makeRect ,
    makeRay, 
    convertToLocal , 
    checkPolygonsCollide , 
    translateRay , 
    getWallEdges , 
    checkLinesIntersect ,
    distance ,
    aStar ,

} from "../../util.js";

class BasicFlyer {
    constructor(obj=null) {
        this.obj = obj;

        const cx = this.obj.x + this.obj.w/2;
        const cy = this.obj.y + this.obj.h/2;

        this.hovering = false;

        this.rangeField = {w: 100, h: 100};
        
        this.target = {x: cx, y: cy};
        this.range = {x: cx - 50, y: cy - 50, w: this.rangeField.w, h: this.rangeField.h};
        this.extras = [
            [makeRect(this.target.x-this.obj.x-5, this.target.y-this.obj.y-5, 10, 10), "blue"],
            [makeRect(this.range.x, this.range.y, this.range.w, this.range.h), "blue"],
        ];

        this.scene = null;

        //Last Player Position
        this.lastPlayerPos = {x: 0, y: 0};

        this.hunting = false;

        this.paused = false;
        this.attacking = false;

        this.debug = false;

        this.route = {x:100, y:100};

        this.sceneEdges = null;

        this.mvelX = 0;
        this.mvelY = 0;

        //Debug
        this.outRay = null;
        this.vangle = {x:0,y:0};
    }

    update(scene) {
        //Store the last scene for other functions that need it
        this.scene = scene;
        this.sceneEdges = getWallEdges(this.scene)
        this.navigate();

        if(this.route && this.hunting) {this.target = this.route}

        this.extras = [];
        
        //Add wandering target and range to extras.  //Debug
        if(!this.hunting) {
            this.extras.push([makeRect(this.target.x-this.obj.x-5, this.target.y-this.obj.y-5, 10, 10), "blue"]);
            this.extras.push([makeRect(this.range.x-this.obj.x, this.range.y-this.obj.y, this.range.w, this.range.h), "blue"]);
        }

        //Add Route to extras. // Debug
        if(this.route) {this.extras.push([makeRect(this.route.x - this.obj.x - 5, this.route.y - this.obj.y - 5, 10, 10), "green"]);}
        
        // direction to target
        const cx = this.obj.x + this.obj.w / 2;
        const cy = this.obj.y + this.obj.h / 2;
        let dx = this.target.x - cx;
        let dy = this.target.y - cy;
        let angle = Math.atan2(dy, dx);
        angle = {x: Math.cos(angle), y: Math.sin(angle)}

        // steer toward target
        let steer = 0.1;
        let vdx = angle.x - this.vangle.x;
        let vdy = angle.y - this.vangle.y;
        this.vangle.x += vdx * steer;
        this.vangle.y += vdy * steer;

        if (!this.paused && !this.debug) {
            let speedMult = this.hunting ? 4 : 1;

            this.obj.velX += this.vangle.x * this.obj.speed * speedMult;
            this.obj.velY += this.vangle.y * this.obj.speed * speedMult;
        }

        // debug velocity rays
        this.extras.push([makeRay(this.obj.w/2, this.obj.h/2, angle.x * 40 + 5, angle.y * 40 + 5), "red"]);
        this.extras.push([makeRay(this.obj.w/2, this.obj.h/2, this.vangle.x * 40 + 5, this.vangle.y * 40 + 5), "orange"]);
        
        //If not hovering or hunting, then hover
        if(Math.hypot(dx, dy) < 20 && !this.hovering && !this.hunting) {
            this.hover();
        }

        //Update direction
        if(!this.hovering) {
            if(this.target.x < cx) {this.obj.dir = -1}
            if(this.target.x > cx) {this.obj.dir = 1}
        }

        //Apply Friction
        this.obj.velX *= this.obj.friction;
        this.obj.velY *= this.obj.friction;

        //Check Collisions
        this.obj.checkCollisions(scene);
        this.checkPlayer();
    }

    //Move in relation to player to keep player centered on the screen
    slide(d) {
        this.obj.x -= d.x;
        this.obj.y -= d.y;

        this.target.x -= d.x;
        this.target.y -= d.y;

        this.range.x -= d.x;
        this.range.y -= d.y;
    }

    wander() {
        this.hunting = false;
        let valid = false;
        while (!valid) {
            let minx = this.range.x;
            let miny = this.range.y;
            let maxx = minx + this.range.w;
            let maxy = miny + this.range.h;

            let rx = minx + Math.random() * (maxx - minx);
            let ry = miny + Math.random() * (maxy - miny);

            const cx = this.obj.x + this.obj.w/2;
            const cy = this.obj.y + this.obj.h/2;


            let poly1 = makeRect(rx-15, ry-10, 30, 20);
            let poly2;
            let col;
            let hitWall = false;
            for(let obj of this.scene) {
                poly2 = obj.getPolygon();
                col = checkPolygonsCollide(poly1, poly2);
                if(col) {
                    if(obj.t == "w") {
                        hitWall = true;
                    }
                }
            }
            if(!hitWall) {
                valid = true;
                this.target = {x: rx, y: ry};
            }


            //Check valid target


            valid = true;
        }
    }
    checkPlayer() {
        const p = this.scene.filter(a => a.t == "p")[0];
        if(p) {
            let pc = p.getCenter();
            let ec = this.obj.getCenter();

            let dx = pc.x - ec.x;
            let dy = pc.y - ec.y;

            let dist = Math.hypot(dx, dy);

            if(dist < 300 || this.hunting) {
                this.hunting = true;
                this.target = {x: pc.x, y: pc.y}
                this.obj.speed = this.obj.base_speed;
                
            }
            if(dist < 100) {
                this.obj.speed = this.obj.base_speed *2;
            }
            if(dist < 20) {
                this.attack();
            }
        }
    }
    hover() {
        this.hovering = true;
        setTimeout(() => {
            this.hovering = false;
            this.wander();
        }, Math.random() * 100 + 600)
    }
    wallHit() {

    }
    newField() {
        let cx = this.obj.x + this.obj.w/2;
        let cy = this.obj.y + this.obj.h/2;
        this.range.x = cx - this.rangeField.w/2;
        this.range.y = cy - this.rangeField.h/2;    
    }

    damage(dmg, origin) {
        this.obj.hp -= dmg;
        let cx = this.obj.x + this.obj.w/2;
        let cy = this.obj.y + this.obj.h/2;

        const ox = (origin.x + origin.w/2);
        const oy = (origin.y + origin.h/2);

        let dx = cx - ox;
        let dy = cy - oy;

        const angle = Math.atan2(dy, dx);
        this.obj.velX += Math.cos(angle) * 10;
        this.obj.velY += Math.sin(angle) * 10;

        if(!this.hunting) {
            setTimeout(() => {
                this.newField();
                this.wander();
            }, 500);
        }
    }
    navigate() {
        this.route = null;
        
        let pc = this.scene.filter(a => a.t == "p")[0];
        let t = pc.getCenter();
        let c = this.obj.getCenter();

        //Cast first test ray towards player
        let obstructed = false;
        let test = makeRay(c.x, c.y, t.x, t.y, 10);
        this.outRay = {x: t.x, y: t.y}
        for(let obj of this.scene){
            let col = checkPolygonsCollide(test, obj.getPolygon());
            if(col && obj.t == "w") {
                obstructed = true;
                break;
            }
        }

        if(!obstructed) {
            this.route = {x: t.x, y: t.y}
            return;
        } else if(this.hunting) {
            //A* function
            this.route = aStar(c, t, this.scene, this.obj.ctx, this.obj.w, this.obj.w);
            if(this.route == "wander") {
                this.newField();
                this.wander();
            }
        }

        
        
    }



    attack() {
        this.paused = true;
        setTimeout(() => {
            this.paused = false;
        }, 500);
    }
}

export { BasicFlyer };