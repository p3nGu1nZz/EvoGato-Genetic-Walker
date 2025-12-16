import Matter from 'matter-js';
import { CatEntity, shadeColor } from './physicsFactory';

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
    // Center the camera on the focus cat
    if (focusCat) {
        // 1. Scale around the origin (0,0)
        ctx.scale(zoom, zoom);
        
        // 2. Translate so cat is in middle of screen
        // screen_x = (world_x + translate_x) * zoom
        // We want screen_x = width/2
        // width/2 = (cat_x + translate_x) * zoom
        // translate_x = (width / (2 * zoom)) - cat_x
        
        const camX = (width / (2 * zoom)) - focusCat.entity.torsoFront.position.x;
        // Keep Y roughly centered but offset so ground is visible
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
        const color = cat.entity.torsoFront.render.fillStyle as string;

        cat.entity.tail.forEach((seg: Matter.Body) => drawBody(ctx, seg, color, finalAlpha));
        cat.entity.legs.forEach((leg: any) => {
             drawBody(ctx, leg.upper, (leg.upper.render.fillStyle as string), finalAlpha);
             drawBody(ctx, leg.lower, (leg.lower.render.fillStyle as string), finalAlpha);
        });

        drawBody(ctx, cat.entity.torsoBack, color, finalAlpha);
        drawBody(ctx, cat.entity.torsoFront, color, finalAlpha);
        drawBody(ctx, cat.entity.head, color, finalAlpha);

        // Draw Ears
        const head = cat.entity.head;
        const earColor = shadeColor(color, -20);
        ctx.fillStyle = earColor;
        ctx.globalAlpha = finalAlpha;
        
        const headR = 18 * 0.7; 
        const earH = 12;
        const angle = head.angle;
        
        const drawEar = (angleOffset: number) => {
             ctx.beginPath();
             const cx = head.position.x;
             const cy = head.position.y;
             const baseAngle = angle - Math.PI/2 + angleOffset;
             const bx = cx + Math.cos(baseAngle) * headR;
             const by = cy + Math.sin(baseAngle) * headR;
             const tipAngle = angle - Math.PI/2 + angleOffset * 1.2;
             const tx = cx + Math.cos(tipAngle) * (headR + earH);
             const ty = cy + Math.sin(tipAngle) * (headR + earH);
             const baseAngle2 = angle - Math.PI/2 + angleOffset + (angleOffset > 0 ? 0.3 : -0.3);
             const b2x = cx + Math.cos(baseAngle2) * headR;
             const b2y = cy + Math.sin(baseAngle2) * headR;
             ctx.moveTo(bx, by);
             ctx.lineTo(tx, ty);
             ctx.lineTo(b2x, b2y);
             ctx.fill();
        };

        drawEar(-0.6);
        drawEar(0.6);

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
            // CHANGED: Use cat ID instead of "Leader"
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