import Matter from 'matter-js';

// Configuration for the Cat Body
const CAT_SCALE = 0.7; 
const TORSO_WIDTH = 40 * CAT_SCALE; // Split into two parts
const TORSO_HEIGHT = 35 * CAT_SCALE;
const LEG_WIDTH = 15 * CAT_SCALE; 
const UPPER_LEG_LENGTH = 40 * CAT_SCALE;
const LOWER_LEG_LENGTH = 40 * CAT_SCALE;
const HEAD_RADIUS = 18 * CAT_SCALE;
const TAIL_SEGMENT_WIDTH = 15 * CAT_SCALE;
const TAIL_SEGMENT_HEIGHT = 8 * CAT_SCALE;

// Collision Categories
const CATEGORY_TERRAIN = 0x0001;
const CATEGORY_CAT = 0x0002;

interface Leg {
  upper: Matter.Body;
  lower: Matter.Body;
  jointHip: Matter.Constraint;
  jointKnee: Matter.Constraint;
}

export interface CatEntity {
  id: string;
  composite: Matter.Composite;
  torsoFront: Matter.Body;
  torsoBack: Matter.Body;
  spine: Matter.Constraint;
  head: Matter.Body;
  legs: Leg[];
  tail: Matter.Body[];
  joints: Matter.Constraint[];
  palette: {
      body: string;
      legDark: string;
      tail: string;
      ear: string;
  };
}

export const createTerrain = (startX: number, length: number): Matter.Body[] => {
  const bodies: Matter.Body[] = [];
  
  // Starting platform
  bodies.push(Matter.Bodies.rectangle(startX + 200, 600, 600, 100, { 
    isStatic: true,
    render: { fillStyle: '#334155' },
    friction: 1.0,
    chamfer: { radius: 10 },
    collisionFilter: { category: CATEGORY_TERRAIN }
  }));

  let currentX = startX + 450;
  let currentY = 600;

  const GROUND_THICKNESS = 100;

  for (let i = 0; i < length; i++) {
    const segmentLength = 150 + Math.random() * 100;
    const angle = (Math.random() - 0.5) * 0.5;

    const nextX = currentX + Math.cos(angle) * segmentLength;
    let nextY = currentY + Math.sin(angle) * segmentLength;

    if (nextY < 350) nextY = 350;
    if (nextY > 750) nextY = 750;

    const dx = nextX - currentX;
    const dy = nextY - currentY;
    const fixedAngle = Math.atan2(dy, dx);
    const fixedLength = Math.sqrt(dx * dx + dy * dy);

    const midX = (currentX + nextX) / 2;
    const midY = (currentY + nextY) / 2;

    const segment = Matter.Bodies.rectangle(midX, midY, fixedLength, GROUND_THICKNESS, {
      isStatic: true,
      angle: fixedAngle,
      friction: 1.0,
      render: { fillStyle: i % 2 === 0 ? '#475569' : '#334155' },
      chamfer: { radius: 10 },
      collisionFilter: { category: CATEGORY_TERRAIN }
    });

    const joint = Matter.Bodies.circle(currentX, currentY, GROUND_THICKNESS / 2, {
        isStatic: true,
        render: { fillStyle: '#334155' },
        collisionFilter: { category: CATEGORY_TERRAIN }
    });

    bodies.push(segment);
    bodies.push(joint);

    currentX = nextX;
    currentY = nextY;
  }

  bodies.push(Matter.Bodies.circle(currentX, currentY, GROUND_THICKNESS / 2, {
        isStatic: true,
        render: { fillStyle: '#334155' },
        collisionFilter: { category: CATEGORY_TERRAIN }
  }));

  bodies.push(Matter.Bodies.rectangle(currentX + 50, 500, 50, 1000, { 
      isStatic: true, 
      render: { fillStyle: '#1e293b' },
      collisionFilter: { category: CATEGORY_TERRAIN }
  }));

  return bodies;
};

export const createCat = (x: number, y: number, id: string, color: string): CatEntity => {
  const group = Matter.Body.nextGroup(true); 
  
  const catFilter = { 
    group: group, 
    category: CATEGORY_CAT, 
    mask: CATEGORY_TERRAIN 
  };

  // Pre-calculate Palette
  const palette = {
      body: color,
      legDark: shadeColor(color, -40),
      tail: shadeColor(color, -10),
      ear: shadeColor(color, -20)
  };

  const torsoFront = Matter.Bodies.rectangle(x + 20, y, TORSO_WIDTH, TORSO_HEIGHT, {
    collisionFilter: catFilter,
    density: 0.002,
    friction: 0.5,
    chamfer: { radius: 5 },
    render: { fillStyle: color }
  });

  const torsoBack = Matter.Bodies.rectangle(x - 20, y, TORSO_WIDTH, TORSO_HEIGHT, {
    collisionFilter: catFilter,
    density: 0.002,
    friction: 0.5,
    chamfer: { radius: 5 },
    render: { fillStyle: color }
  });

  const spineJoint = Matter.Constraint.create({
      bodyA: torsoBack,
      bodyB: torsoFront,
      pointA: { x: TORSO_WIDTH/2, y: 0 },
      pointB: { x: -TORSO_WIDTH/2, y: 0 },
      stiffness: 0.6,
      damping: 0.1,
      length: 5,
      render: { visible: true, strokeStyle: '#00000044', lineWidth: 4 }
  });

  const head = Matter.Bodies.circle(x + 40 + HEAD_RADIUS, y - 10, HEAD_RADIUS, {
      collisionFilter: catFilter,
      density: 0.001,
      render: { fillStyle: color }
  });

  const headJoint = Matter.Constraint.create({
      bodyA: torsoFront,
      bodyB: head,
      pointA: { x: TORSO_WIDTH/2, y: -10 },
      pointB: { x: -HEAD_RADIUS/2, y: 0 },
      stiffness: 0.9,
      length: 0,
      render: { visible: false }
  });

  const tailSegments: Matter.Body[] = [];
  const tailConstraints: Matter.Constraint[] = [];
  let previousBody = torsoBack;
  
  for (let i = 0; i < 5; i++) {
      const tailX = x - 40 - (i + 1) * TAIL_SEGMENT_WIDTH;
      const segment = Matter.Bodies.rectangle(tailX, y, TAIL_SEGMENT_WIDTH, TAIL_SEGMENT_HEIGHT, {
          collisionFilter: catFilter,
          density: 0.001,
          friction: 0.1,
          chamfer: { radius: 2 },
          render: { fillStyle: palette.tail }
      });

      const constraint = Matter.Constraint.create({
          bodyA: previousBody,
          bodyB: segment,
          pointA: i === 0 ? { x: -TORSO_WIDTH/2, y: 0 } : { x: -TAIL_SEGMENT_WIDTH/2, y: 0 },
          pointB: { x: TAIL_SEGMENT_WIDTH/2, y: 0 },
          stiffness: 0.3,
          damping: 0.1,
          length: 2,
          render: { visible: false }
      });

      tailSegments.push(segment);
      tailConstraints.push(constraint);
      previousBody = segment;
  }

  const legs: Leg[] = [];
  const motorJoints: Matter.Constraint[] = [];

  const legConfigs = [
    { name: 'FR', body: torsoFront, xOffset: 0, z: 'front' },
    { name: 'FL', body: torsoFront, xOffset: 0, z: 'back' },
    { name: 'BR', body: torsoBack, xOffset: 0, z: 'front' },
    { name: 'BL', body: torsoBack, xOffset: 0, z: 'back' },
  ];

  legConfigs.forEach(conf => {
    const isFrontVisual = conf.z === 'front';
    const legColor = isFrontVisual ? palette.body : palette.legDark; 

    const startX = conf.body.position.x + conf.xOffset;
    const startY = conf.body.position.y + 10;

    const upperLeg = Matter.Bodies.rectangle(startX, startY + 20, LEG_WIDTH, UPPER_LEG_LENGTH, {
      collisionFilter: catFilter,
      friction: 0.6,
      density: 0.002,
      chamfer: { radius: 4 },
      render: { fillStyle: legColor }
    });

    const lowerLeg = Matter.Bodies.rectangle(startX, startY + 20 + UPPER_LEG_LENGTH, LEG_WIDTH, LOWER_LEG_LENGTH, {
      collisionFilter: catFilter,
      friction: 1.0, 
      frictionStatic: 1.0, 
      restitution: 0, 
      density: 0.005, 
      chamfer: { radius: 4 },
      render: { fillStyle: legColor }
    });

    const hipJoint = Matter.Constraint.create({
      bodyA: conf.body,
      bodyB: upperLeg,
      pointA: { x: conf.xOffset, y: TORSO_HEIGHT/3 },
      pointB: { x: 0, y: -UPPER_LEG_LENGTH / 2 },
      stiffness: 0.7,
      damping: 0.1,
      length: 0,
      render: { visible: true, lineWidth: 3, strokeStyle: isFrontVisual ? '#00000044' : '#00000022' }
    });

    const kneeJoint = Matter.Constraint.create({
      bodyA: upperLeg,
      bodyB: lowerLeg,
      pointA: { x: 0, y: UPPER_LEG_LENGTH / 2 },
      pointB: { x: 0, y: -LOWER_LEG_LENGTH / 2 },
      stiffness: 0.7,
      damping: 0.1,
      length: 0,
      render: { visible: true, lineWidth: 3, strokeStyle: isFrontVisual ? '#00000044' : '#00000022' }
    });

    legs.push({ upper: upperLeg, lower: lowerLeg, jointHip: hipJoint, jointKnee: kneeJoint });
    motorJoints.push(hipJoint, kneeJoint);
  });

  const parts = [torsoFront, torsoBack, head, ...tailSegments, ...legs.flatMap(l => [l.upper, l.lower])];
  const constraints = [spineJoint, headJoint, ...tailConstraints, ...motorJoints];

  const composite = Matter.Composite.create();
  Matter.Composite.add(composite, parts);
  Matter.Composite.add(composite, constraints);

  return {
    id,
    composite,
    torsoFront,
    torsoBack,
    spine: spineJoint,
    head,
    legs,
    tail: tailSegments,
    joints: [spineJoint, ...motorJoints],
    palette
  };
};

export function shadeColor(color: string, percent: number) {
    let R = parseInt(color.substring(1,3),16);
    let G = parseInt(color.substring(3,5),16);
    let B = parseInt(color.substring(5,7),16);

    R = Math.floor(R * (100 + percent) / 100);
    G = Math.floor(G * (100 + percent) / 100);
    B = Math.floor(B * (100 + percent) / 100);

    R = (R<255)?R:255;  
    G = (G<255)?G:255;  
    B = (B<255)?B:255;  

    const RR = ((R.toString(16).length===1)?"0"+R.toString(16):R.toString(16));
    const GG = ((G.toString(16).length===1)?"0"+G.toString(16):G.toString(16));
    const BB = ((B.toString(16).length===1)?"0"+B.toString(16):B.toString(16));

    return "#"+RR+GG+BB;
}