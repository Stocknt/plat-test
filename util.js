function drawPolygon(ctx, poly, col) {
    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = col;
    ctx.beginPath();
    ctx.moveTo(poly[0].x, poly[0].y);
    for(let point of poly) {
        ctx.lineTo(point.x, point.y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
}

function checkPolygonsCollide(polyA, polyB) {
    let overlap = Infinity;
    let smallestAxis = null;

    const axes = [...getAxes(polyA), ...getAxes(polyB)];

    const centroidA = getCentroid(polyA);
    const centroidB = getCentroid(polyB);

    for (let axis of axes) {
        // Project polygons onto the axis
        let projA = projectPolygon(polyA, axis);
        let projB = projectPolygon(polyB, axis);

        // Check if projections overlap
        if (!projectionsOverlap(projA, projB)) {
            return false; // Separating axis found → no collision
        }

        // Calculate overlap along this axis
        const o = getOverlap(projA, projB);
        if (o < overlap) {
            overlap = o;

            const d = { x: centroidB.x - centroidA.x, y: centroidB.y - centroidA.y };
            smallestAxis = (dot(d, axis) < 0) ? { x: axis.x, y: axis.y } : { x: -axis.x, y: -axis.y };
        }
    }

    // Return MTV (minimum translation vector)
    return { x: smallestAxis.x * overlap, y: smallestAxis.y * overlap, axis: smallestAxis, origin: centroidB};
}


function getOverlap(projA, projB) {
    return Math.min(projA.max - projB.min, projB.max - projA.min);
}

function getCentroid(poly) {
    let x = 0, y = 0;
    for (let p of poly) { x += p.x; y += p.y; }
    return { x: x / poly.length, y: y / poly.length };
}

function dot(a, b) {
    return a.x * b.x + a.y * b.y;
}

function subtract(a, b) {
    return { x: a.x - b.x, y: a.y - b.y };
}

function convertToWorld(_x, _y, _polygon) {
    let newPolygon = [];
    
    for(let point of _polygon) {
        newPolygon.push( {x: _x + point.x, y: _y + point.y});
    }
    
    return newPolygon;
}

function convertToLocal(_x, _y, _polygon) {
    let newPolygon = [];
    
    for(let point of _polygon) {
        newPolygon.push({x: point.x, y: point.y});
    }
    return newPolygon;
}

function getAxes(poly) {
    let axes = [];
    for(let i = 0; i < poly.length; i ++) {
        let p1 = poly[i];
        let p2 = poly[(i + 1) % poly.length];

        let edge = subtract(p1, p2);

        let normal = {x: -edge.y, y: edge.x};
        
        let length = Math.sqrt(normal.x * normal.x + normal.y * normal.y);
        normal.x /= length;
        normal.y /= length;

        axes.push(normal);
    }
    
    return axes;
}

function projectPolygon(poly, axis) {
    let min = dot(poly[0], axis);
    let max = min;

    for(let i = 0; i < poly.length; i++) {
        let p = dot(poly[i], axis);
        if(p < min) {min = p};
        if(p > max) {max = p};
    }

    return {min: min, max: max};
}

function projectionsOverlap(a, b) {
    return !(a.max < b.min || a.min > b.max);
}

function reflectPolygonHor(x, poly) {
    let newPoly = [];
    for(let i of poly) {
        newPoly.push({x:x + (x - i.x),y: i.y})
    }
    return newPoly;
}

function reflectPolygonVer(y, poly) {
    let newPoly = [];
    for(let i of poly) {
        newPoly.push({x: i.x, y: y + (y - i.y)})
    }
    return newPoly;
}

function makeRect(x, y, w, h) {
    return [
        {x: x, y: y},
        {x: x+w, y: y},
        {x: x+w, y: y+h},
        {x: x, y: y+h},
    ];
}

function makeRay(x1, y1, x2, y2, t=1) {
    return [
        {x: x1, y: y1},
        {x: x2, y: y2},
        {x: x2, y: y2 + t},
        {x: x1, y: y1 + t}
    ];
}

function translateRay(ray, x, y) {
    return [
        {x: ray[0].x - x, y: ray[0].y - y},
        {x: ray[1].x - x, y: ray[1].y - y},
        {x: ray[2].x - x, y: ray[2].y - y},
        {x: ray[3].x - x, y: ray[3].y - y}
    ];
}

function getWallEdges(scene) {
    let edges = [];
    let walls = scene.filter(a => a.t == "w");
    for(let obj of walls) {
        for(let p = 0; p < obj.body_hitbox.length; p ++) {
            let p1 = obj.body_hitbox[p];
            let p2 = obj.body_hitbox[(p + 1) % (obj.body_hitbox.length)];
            let edge = [{x: p1.x + obj.x, y: p1.y + obj.y}, {x: p2.x + obj.x, y: p2.y + obj.y}];
            edges.push(edge);
        }
    }
    return edges;
}

function checkLinesIntersect(line1, line2) {
    let x1 = line1[0].x;
    let y1 = line1[0].y;
    let x2 = line1[1].x;
    let y2 = line1[1].y;

    let x3 = line2[0].x;
    let y3 = line2[0].y;
    let x4 = line2[1].x;
    let y4 = line2[1].y;
    
    // Check if none of the lines are of length 0
    if ((x1 === x2 && y1 === y2) || (x3 === x4 && y3 === y4)) {
        return false
    }
            
    let denominator = ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1))

    // Lines are parallel
    if (denominator === 0) {
        return false
    }

    let ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator
    let ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator

    // is the intersection along the segments
    if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
        return false
    }

    // Return a object with the x and y coordinates of the intersection
    return {x:x1 + ua * (x2 - x1), y:y1 + ua * (y2 - y1)};
}

function aStar(s, goal, scene, ctx, w, h) {
    let g = {
        x: Math.round(goal.x),
        y: Math.round(goal.y)
    }
    let open = [];
    let closed = new Set();

    let start = {
        x: s.x //- (s.x % 37.5),
        ,y: s.y// - (s.y % 37.5)
    }

    let dirs = [
        {x: 0, y: -1},
        {x: 1, y: -1},
        {x: 1, y: 0},
        {x: 1, y: 1},
        {x: 0, y: 1},
        {x: -1, y: 1},
        {x: -1, y: 0},
        {x: -1, y: -1},
    ];

    let hcost = distance(start, g);
    open.push( {
        x: start.x,
        y: start.y,
        g: 0,
        h: hcost,
        f: hcost,
        parent: null
    });

    let finalNode = null;

    let step = {x: (w+5), y: (h+5), s: 1.5};
    let r = 0;
    while(open.length > 0) {
        r ++;
        // open.sort((a, b) => a.h - b.h);
        open.sort((a, b) => (a.h) - (b.h));
        let current = open.shift();
        //step.s = current.h/200;
        let key = nodeKey(current.x, current.y, step);
        if(closed.has(key)) {continue}
        closed.add(key);

        //drawPoint(ctx, current, "red");
        let d = distance({x: current.x, y: current.y}, g)
        if(d < Math.hypot(step.x*step.s, step.y*step.s)) {
            finalNode = current;
            break;
        }

        // let ray = makeRay(current.x, current.y, g.x, g.y, 10);
        // let openPath = true;
        // for(let obj of scene) {
        //     if(obj.t == "w") {
        //         let wall = obj.getPolygon();
        //         let col = false;
        //         if(checkBoxes(ray, wall)) {col = checkPolygonsCollide(ray, wall);}
        //         if(col) {
        //             openPath = false;
        //             break;
        //         }
        //     }
        // }
        //if(openPath) {finalNode = current; break;}

        for(let d of dirs) {
            let n = {
                x: current.x + (d.x * step.x * step.s),
                y: current.y + (d.y * step.y * step.s)
            }

            let blocked = false;
            let t = makeRay(current.x, current.y, n.x, n.y, 10);
            for(let obj of scene) {
                if(obj.t == "w") {
                    let w = obj.getPolygon();
                    let col1 = false;
                    if(checkBoxes(w, t)){col1 = checkPolygonsCollide(t, w)}
                    if(col1) {blocked = true;}
                }
            }
            if(blocked) {continue;}
            
            let nKey = nodeKey(n.x, n.y, step);

            for(let o of open) {
                if(o.x == n.x && o.y == n.y) {
                    continue;
                }
            }

            let h = closed.has(nKey);
            let b = isBlocked(n.x, n.y, scene, step);
            if(h) {//drawPoint(ctx, n, "red"); 
                continue};
            if(b) {continue}
            
            let gcost = current.g + Math.hypot((d.x * step.x * step.s), (d.y * step.y * step.s))
            let hcost = distance(n, g);

            open.push({
                x: n.x,
                y: n.y,
                g: gcost,
                h: hcost,
                f: gcost + hcost,
                parent: current
            });
            //drawPoint(ctx, n, "green");
        }

        if(open.length > 300) {
            return "wander";
        }
    }
    if(!finalNode) {
        return null;
    }

    let path = [];
    let n = finalNode;
    while(n) {
        path.push({x: n.x, y: n.y});
        n = n.parent;
    }
    path.reverse();

    if(path.length > 1) {
        return path[1];
    } else {
        return path[0];
    }

}

function nodeKey(x, y, s) {
    return `${Math.round(x/s.x)},${Math.round(y/s.y)}`;
}

function distance(a, b) {
    return Math.hypot(b.x - a.x, b.y - a.y);
}

function isBlocked(x, y, scene, s) {
    let point = makeRect(x-(s.x/2), y-(s.y/2), s.x/s.s, s.y/s.s);
    for(let obj of scene) {
        if(obj.t == "w") {
            let wall = obj.getPolygon();
            let col = false;
            if(checkBoxes(point, wall)) {col = checkPolygonsCollide(point, wall);}
            if(col) {
                return col;
            }
        }
    }
    return false;
}

function drawPoint(ctx, p, col) {
    drawPolygon(ctx, makeRect(p.x-5, p.y-5, 10, 10), col);
}

function checkBoxes(box1, box2) {
    // Box 1 bounds
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    for (const p of box1) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
    }

    // Box 2 bounds
    let minX2 = Infinity, maxX2 = -Infinity;
    let minY2 = Infinity, maxY2 = -Infinity;

    for (const p of box2) {
        if (p.x < minX2) minX2 = p.x;
        if (p.x > maxX2) maxX2 = p.x;
        if (p.y < minY2) minY2 = p.y;
        if (p.y > maxY2) maxY2 = p.y;
    }

    // AABB overlap test
    return (
        maxX >= minX2 &&
        minX <= maxX2 &&
        maxY >= minY2 &&
        minY <= maxY2
    );
}


export { 
    drawPolygon , 
    convertToWorld , 
    convertToLocal, 
    checkPolygonsCollide , 
    reflectPolygonHor , 
    reflectPolygonVer , 
    makeRect , 
    makeRay , 
    translateRay , 
    getWallEdges , 
    checkLinesIntersect ,
    distance , 
    aStar , 
    checkBoxes 
};