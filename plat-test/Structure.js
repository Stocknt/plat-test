import { drawPolygon , convertToWorld } from "./util";    

class Structure {
    constructor(_ctx, _x, _y, _points) {
        this.ctx           = _ctx;
        this.x             = _x;
        this.y             = _y;

        this.t             = "w";

        this.body_hitbox   = _points;

    }

    draw() {
        const polygon = this.getPolygon();
        drawPolygon(this.ctx, polygon, "gray");
    }

    getPolygon() {
        return convertToWorld(this.x, this.y, this.body_hitbox);
    }

    slide(d) {
        this.x -= d.x;
        this.y -= d.y;
    }
}

export { Structure };