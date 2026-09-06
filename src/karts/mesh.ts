import * as THREE from "three";
import type { KartDef } from "../types";

function paintMat(color: string): THREE.MeshStandardMaterial {
  const c = new THREE.Color(color);
  return new THREE.MeshStandardMaterial({
    color: c,
    roughness: 0.22,
    metalness: 0.55,
    emissive: c.clone().multiplyScalar(0.04),
    emissiveIntensity: 0.35,
  });
}

function rubber(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0x0b0b0d,
    roughness: 0.92,
    metalness: 0.04,
  });
}

function steel(hex = 0xb8c0ca): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: hex,
    roughness: 0.28,
    metalness: 0.88,
  });
}

function carbon(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0x12151a,
    roughness: 0.48,
    metalness: 0.4,
  });
}

function glass(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0x0a1822,
    transparent: true,
    opacity: 0.72,
    roughness: 0.05,
    metalness: 0.9,
  });
}

function makeWheel(width: number, radius: number): THREE.Group {
  const g = new THREE.Group();
  const tire = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, width, 24), rubber());
  tire.rotation.z = Math.PI / 2;
  // sidewall ridge
  const wall = new THREE.Mesh(
    new THREE.TorusGeometry(radius * 0.92, width * 0.22, 8, 24),
    new THREE.MeshStandardMaterial({ color: 0x151518, roughness: 0.85, metalness: 0.05 }),
  );
  wall.rotation.y = Math.PI / 2;
  const rim = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.55, radius * 0.55, width * 0.55, 16),
    steel(0xcfd6de),
  );
  rim.rotation.z = Math.PI / 2;
  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.18, radius * 0.18, width * 0.7, 10),
    steel(0x2a3038),
  );
  hub.rotation.z = Math.PI / 2;
  for (let i = 0; i < 6; i++) {
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.035, radius * 0.78, width * 0.12), steel(0xaeb6c0));
    spoke.rotation.z = Math.PI / 2;
    spoke.rotation.x = (i / 6) * Math.PI;
    g.add(spoke);
  }
  g.add(tire, wall, rim, hub);
  g.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return g;
}

function addWheels(root: THREE.Group, wide: boolean): void {
  const rF = wide ? 0.34 : 0.32;
  const rR = wide ? 0.38 : 0.36;
  const wF = wide ? 0.26 : 0.22;
  const wR = wide ? 0.36 : 0.3;
  const xF = wide ? 0.7 : 0.62;
  const xR = wide ? 0.78 : 0.7;
  const zF = 0.95;
  const zR = -0.92;
  const specs: Array<[number, number, number, number]> = [
    [-xF, zF, wF, rF],
    [xF, zF, wF, rF],
    [-xR, zR, wR, rR],
    [xR, zR, wR, rR],
  ];
  for (const [x, z, w, r] of specs) {
    const wheel = makeWheel(w, r);
    wheel.position.set(x, r, z);
    wheel.name = z > 0 ? "wheelF" : "wheelR";
    root.add(wheel);
  }
}

/**
 * Realistic rental / club racing kart silhouette — open cockpit,
 * sidepods, nose cone, rear bumper, engine, full-face helmet.
 * Still low-poly for phones, but not a toy brick.
 */
export function createKartMesh(def: KartDef): THREE.Group {
  const root = new THREE.Group();
  root.frustumCulled = false;

  const paint = paintMat(def.paint);
  const accent = paintMat(def.accent);
  const dark = new THREE.MeshStandardMaterial({
    color: def.cabin,
    roughness: 0.55,
    metalness: 0.18,
  });
  const car = carbon();
  const metal = steel();
  const visor = glass();

  const wide = def.id === "guardiao";
  const slim = def.id === "vespa";
  const long = def.id === "ziper";

  const scaleX = wide ? 1.12 : slim ? 0.9 : long ? 0.96 : 1;
  const scaleZ = slim ? 0.94 : long ? 1.08 : 1;

  // tubular floor / chassis rails
  const railGeo = new THREE.CylinderGeometry(0.045, 0.045, 1.85 * scaleZ, 8);
  const railL = new THREE.Mesh(railGeo, metal);
  railL.rotation.x = Math.PI / 2;
  railL.position.set(-0.38 * scaleX, 0.22, 0);
  const railR = railL.clone();
  railR.position.x = 0.38 * scaleX;
  const crossF = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.78 * scaleX, 8), metal);
  crossF.rotation.z = Math.PI / 2;
  crossF.position.set(0, 0.22, 0.72);
  const crossR = crossF.clone();
  crossR.position.z = -0.7;
  root.add(railL, railR, crossF, crossR);

  // floor pan
  const pan = new THREE.Mesh(new THREE.BoxGeometry(0.85 * scaleX, 0.05, 1.55 * scaleZ), car);
  pan.position.set(0, 0.2, 0.05);
  root.add(pan);

  // nose cone (tapered stack)
  const nose0 = new THREE.Mesh(new THREE.BoxGeometry(0.62 * scaleX, 0.2, 0.42), paint);
  nose0.position.set(0, 0.34, 0.78 * scaleZ);
  const nose1 = new THREE.Mesh(new THREE.BoxGeometry(0.42 * scaleX, 0.16, 0.36), paint);
  nose1.position.set(0, 0.33, 1.05 * scaleZ);
  const nose2 = new THREE.Mesh(new THREE.BoxGeometry(0.24 * scaleX, 0.12, 0.28), accent);
  nose2.position.set(0, 0.31, 1.24 * scaleZ);
  // front fairing top
  const fairing = new THREE.Mesh(new THREE.BoxGeometry(0.5 * scaleX, 0.08, 0.55), paint);
  fairing.position.set(0, 0.46, 0.85 * scaleZ);
  root.add(nose0, nose1, nose2, fairing);

  // front bumper bar
  const bumper = new THREE.Mesh(new THREE.TorusGeometry(0.28 * scaleX, 0.035, 8, 16, Math.PI), metal);
  bumper.rotation.x = Math.PI / 2;
  bumper.rotation.z = Math.PI;
  bumper.position.set(0, 0.28, 1.32 * scaleZ);
  root.add(bumper);

  // sidepods (real kart shape: longer, rounded via cylinders + boxes)
  for (const side of [-1, 1]) {
    const pod = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.28, 0.95 * scaleZ), paint);
    pod.position.set(side * 0.58 * scaleX, 0.38, 0.05);
    const podFront = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.32, 10), paint);
    podFront.rotation.z = Math.PI / 2;
    podFront.position.set(side * 0.58 * scaleX, 0.38, 0.52 * scaleZ);
    const podRear = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.28, 10), paint);
    podRear.rotation.z = Math.PI / 2;
    podRear.position.set(side * 0.58 * scaleX, 0.38, -0.42 * scaleZ);
    root.add(pod, podFront, podRear);
  }

  // seat (bucket)
  const seatBase = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.1, 0.4), dark);
  seatBase.position.set(0, 0.42, -0.08);
  const seatBack = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.48, 0.1), dark);
  seatBack.position.set(0, 0.66, -0.26);
  seatBack.rotation.x = -0.12;
  const seatSideL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.36), dark);
  seatSideL.position.set(-0.2, 0.52, -0.1);
  const seatSideR = seatSideL.clone();
  seatSideR.position.x = 0.2;
  root.add(seatBase, seatBack, seatSideL, seatSideR);

  // steering column + wheel
  const column = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.45, 8), metal);
  column.position.set(0, 0.58, 0.28);
  column.rotation.x = 0.55;
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.018, 8, 20), dark);
  wheel.position.set(0, 0.72, 0.42);
  wheel.rotation.x = 0.55;
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.04, 10), metal);
  hub.position.copy(wheel.position);
  hub.rotation.x = Math.PI / 2 + 0.55;
  root.add(column, wheel, hub);

  // roll bar / rear hoop
  const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.028, 8, 20, Math.PI), metal);
  hoop.rotation.x = Math.PI / 2;
  hoop.rotation.z = Math.PI;
  hoop.position.set(0, 0.72, -0.35);
  const hoopPostL = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.42, 6), metal);
  hoopPostL.position.set(-0.22, 0.5, -0.35);
  const hoopPostR = hoopPostL.clone();
  hoopPostR.position.x = 0.22;
  root.add(hoop, hoopPostL, hoopPostR);

  // rear engine block
  const engine = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.28, 0.4), car);
  engine.position.set(0, 0.42, -0.72 * scaleZ);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.28), steel(0x6a727c));
  head.position.set(0, 0.6, -0.72 * scaleZ);
  const airbox = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.18), dark);
  airbox.position.set(0, 0.72, -0.68 * scaleZ);
  // exhaust
  const ex = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.55, 10), steel(0x8a9098));
  ex.rotation.x = Math.PI / 2;
  ex.position.set(0.16, 0.34, -0.95 * scaleZ);
  const muff = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.2, 10), steel(0x3a3e44));
  muff.rotation.x = Math.PI / 2;
  muff.position.set(0.16, 0.34, -1.18 * scaleZ);
  root.add(engine, head, airbox, ex, muff);

  // rear bumper
  const rearBar = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.95 * scaleX, 8), metal);
  rearBar.rotation.z = Math.PI / 2;
  rearBar.position.set(0, 0.28, -1.15 * scaleZ);
  root.add(rearBar);

  // rear wing (racing kart / bodywork spoiler — subtle)
  const wing = new THREE.Mesh(new THREE.BoxGeometry((wide ? 1.05 : 0.88) * scaleX, 0.04, 0.18), car);
  wing.position.set(0, 0.78, -0.95 * scaleZ);
  const endL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.18, 0.2), car);
  endL.position.set(-0.44 * scaleX, 0.78, -0.95 * scaleZ);
  const endR = endL.clone();
  endR.position.x = 0.44 * scaleX;
  root.add(wing, endL, endR);

  // driver — full-face helmet (not a ball toy)
  const suit = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.36, 0.28), dark);
  suit.position.set(0, 0.62, -0.02);
  const shoulder = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.1, 0.2), dark);
  shoulder.position.set(0, 0.8, 0);
  // helmet shell
  const helm = new THREE.Mesh(
    new THREE.SphereGeometry(0.155, 18, 14),
    new THREE.MeshStandardMaterial({ color: 0x0c1016, roughness: 0.18, metalness: 0.55 }),
  );
  helm.scale.set(1.05, 1.0, 1.15);
  helm.position.set(0, 0.98, 0.06);
  // chin bar
  const chin = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.14), new THREE.MeshStandardMaterial({ color: 0x0c1016, metalness: 0.5, roughness: 0.25 }));
  chin.position.set(0, 0.88, 0.14);
  // visor
  const vis = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.09, 0.08), visor);
  vis.position.set(0, 0.98, 0.16);
  // visor frame
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.02, 0.09), metal);
  frame.position.set(0, 1.04, 0.15);
  root.add(suit, shoulder, helm, chin, vis, frame);

  // gloves on wheel hint
  const gloveL = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), dark);
  gloveL.position.set(-0.1, 0.7, 0.4);
  const gloveR = gloveL.clone();
  gloveR.position.x = 0.1;
  root.add(gloveL, gloveR);

  // model accents
  if (def.id === "vespa") {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 1.1), accent);
    stripe.position.set(0, 0.5, 0.35);
    root.add(stripe);
  } else if (def.id === "cometa") {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.035, 1.3), accent);
    stripe.position.set(0, 0.5, 0.2);
    root.add(stripe);
  } else if (def.id === "guardiao") {
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.95 * scaleX, 0.12, 0.14), accent);
    plate.position.set(0, 0.3, 1.15);
    root.add(plate);
  } else {
    const neon = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.03, 1.2), accent);
    neon.position.set(0.2, 0.5, 0.1);
    const neon2 = neon.clone();
    neon2.position.x = -0.2;
    root.add(neon, neon2);
  }

  // lights
  const headMat = new THREE.MeshBasicMaterial({ color: 0xfff2c8 });
  const h1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.04), headMat);
  h1.position.set(-0.16, 0.36, 1.28 * scaleZ);
  const h2 = h1.clone();
  h2.position.x = 0.16;
  const tailMat = new THREE.MeshBasicMaterial({ color: 0xff1e18 });
  const t1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.04), tailMat);
  t1.position.set(-0.22, 0.4, -1.2 * scaleZ);
  const t2 = t1.clone();
  t2.position.x = 0.22;
  root.add(h1, h2, t1, t2);

  // number plate
  const num = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.02), accent);
  num.position.set(0, 0.42, -1.22 * scaleZ);
  root.add(num);

  addWheels(root, wide);

  root.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.castShadow = true;
      o.receiveShadow = true;
      o.frustumCulled = false;
    }
  });
  return root;
}
