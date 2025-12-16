import Matter from 'matter-js';
import { CatEntity } from './physicsFactory';

interface RenderContext {
    ctx: CanvasRenderingContext2D;
    width: number;
    height: number;
    engine: Matter.Engine;
    terrain: Matter.Body[];
    cats: any[]; 
    selectedCatId: string | null;
    zoom: number;
}

export const renderScene = ({ ctx, width, height, engine, terrain, cats, selectedCatId, zoom }: RenderContext) => {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    if (cats.length === 0) return;

    let bestCat = cats[0];
    let maxX = -Infinity;
    cats.forEach(c => {
        if (c.entity.torsoFront.position.x > maxX) {
            maxX = c.entity.torsoFront.position.x;
            bestCat = c;
        }
    });

    const focusCat = selectedCatId 
        ? cats.find(c => c.entity.id === selectedCatId) || bestCat 
        : bestCat;

    ctx.save();
    
    // Camera Transform
    if (focusCat) {
        ctx.scale(zoom, zoom);
        const camX = (width / (2 * zoom)) - focusCat.entity.torsoFront.position.x;
        const camY = (height / (2 * zoom)) - 450; 
        ctx.translate(camX, camY);
    }

    // Render Terrain
    ctx.fillStyle = '#334155';
    terrain.forEach(block => {
        ctx.beginPath();
        const v = block.vertices;
        ctx.moveTo(v[0].x, v[0].y);
        for(let j=1; j<v.length; j++) ctx.lineTo(v[j].x, v[j].y);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#475569';
        ctx.stroke();
    });

    // Render Cats
    const sortedCats = [...cats].sort((a,b) => {
        if (a === focusCat) return 1;
        return -1;
    });

    sortedCats.forEach(cat => {
        const isSelected = cat === focusCat;
        const alpha = isSelected ? 1 : (selectedCatId ? 0.2 : 0.5);
        const finalAlpha = alpha; 
        const palette = cat.entity.palette;

        cat.entity.tail.forEach((seg: Matter.Body) => drawBody(ctx, seg, palette.tail, finalAlpha));
        
        // Draw Legs (Back Visuals first)
        cat.entity.legs.forEach((leg: any, idx: number) => {
             // 1 and 3 are 'back' in visual depth (FL, BL in creation order: FR, FL, BR, BL)
             // Creation: FR(0), FL(1), BR(2), BL(3)
             // Config z: front, back, front, back
             if (idx % 2 !== 0) {
                 drawBody(ctx, leg.upper, palette.legDark, finalAlpha);
                 drawBody(ctx, leg.lower, palette.legDark, finalAlpha);
             }
        });

        drawBody(ctx, cat.entity.torsoBack, palette.body, finalAlpha);
        drawBody(ctx, cat.entity.torsoFront, palette.body, finalAlpha);
        
        // Draw Legs (Front Visuals)
        cat.entity.legs.forEach((leg: any, idx: number) => {
             if (idx % 2 === 0) {
                 drawBody(ctx, leg.upper, palette.body, finalAlpha);
                 drawBody(ctx, leg.lower, palette.body, finalAlpha);
             }
        });

        // Head and Eyes
        const head = cat.entity.head;
        
        // Draw Head Body
        ctx.beginPath();
        const v = head.vertices;
        ctx.moveTo(v[0].x, v[0].y);
        for(let k=1; k<v.length; k++) ctx.lineTo(v[k].x, v[k].y);
        ctx.closePath();
        ctx.fillStyle = palette.body;
        ctx.globalAlpha = finalAlpha;
        ctx.fill();

        // Draw Ears
        const headR = 12.6; // approx 18 * 0.7
        const angle = head.angle;
        
        const drawEar = (angleOffset: number) => {
             ctx.beginPath();
             const cx = head.position.x;
             const cy = head.position.y;
             const baseAngle = angle - Math.PI/2 + angleOffset;
             const bx = cx + Math.cos(baseAngle) * headR;
             const by = cy + Math.sin(baseAngle) * headR;
             const tipAngle = angle - Math.PI/2 + angleOffset * 1.2;
             const tx = cx + Math.cos(tipAngle) * (headR + 12);
             const ty = cy + Math.sin(tipAngle) * (headR + 12);
             const baseAngle2 = angle - Math.PI/2 + angleOffset + (angleOffset > 0 ? 0.3 : -0.3);
             const b2x = cx + Math.cos(baseAngle2) * headR;
             const b2y = cy + Math.sin(baseAngle2) * headR;
             ctx.moveTo(bx, by);
             ctx.lineTo(tx, ty);
             ctx.lineTo(b2x, b2y);
             ctx.fillStyle = palette.ear;
             ctx.fill();
        };

        drawEar(-0.6);
        drawEar(0.6);

        // Draw Eyes
        const drawEye = (yOffsetFactor: number) => {
            const eyeR = 3; 
            const pupilR = 1;
            
            // Calc eye position based on head orientation
            // "Forward" is Angle 0 (Right)
            const cx = head.position.x;
            const cy = head.position.y;
            
            const ux = Math.cos(angle);
            const uy = Math.sin(angle);
            const vx = -Math.sin(angle);
            const vy = Math.cos(angle);
            
            const forwardOffset = 6;
            const sideOffset = yOffsetFactor * 4;

            const ex = cx + ux * forwardOffset + vx * sideOffset;
            const ey = cy + uy * forwardOffset + vy * sideOffset;

            ctx.beginPath();
            ctx.arc(ex, ey, eyeR, 0, Math.PI*2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();

            const px = ex + ux * 1.5;
            const py = ey + uy * 1.5;

            ctx.beginPath();
            ctx.arc(px, py, pupilR, 0, Math.PI*2);
            ctx.fillStyle = '#000000';
            ctx.fill();
        };

        drawEye(-0.8);
        drawEye(0.8);

        if (isSelected) {
            ctx.strokeStyle = selectedCatId ? '#fbbf24' : '#fbbf24'; 
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.arc(cat.entity.torsoFront.position.x, cat.entity.torsoFront.position.y, 60, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
            
            ctx.fillStyle = 'white';
            ctx.font = '12px monospace';
            const label = cat.entity.id.toUpperCase(); 
            ctx.fillText(label, cat.entity.torsoFront.position.x - 20, cat.entity.torsoFront.position.y - 60);
        }
    });

    ctx.restore();
};

const drawBody = (ctx: CanvasRenderingContext2D, body: Matter.Body, color: string, alpha: number) => {
    ctx.beginPath();
    const v = body.vertices;
    ctx.moveTo(v[0].x, v[0].y);
    for(let k=1; k<v.length; k++) ctx.lineTo(v[k].x, v[k].y);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha;
    ctx.fill();
};