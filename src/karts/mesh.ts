import * as THREE from "three";
import type { KartDef } from "../types";

function paintMat(color: string, glow = 0.12): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.28,
    metalness: 0.42,
    emissive: new THREE.Color(color).multiplyScalar(glow),
    emissiveIntensity: 0.55,
  });
}

function mat(color: number, opts: Partial<THREE.MeshStandardMaterialParameters> = {}): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.25, ...opts });
}

function wheel(wide: number, radius: number): THREE.Group {
  const g = new THREE.Group();
  const tire = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, wide, 20),
    mat(0x0a0a0c, { roughness: 0.95, metalness: 0.02 }),
  );
  tire.rotation.z = Math.PI / 2;
  const rim = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.58, radius * 0.58, wide + 0.04, 14),
    mat(0xc5ced8, { metalness: 0.85, roughness: 0.18 }),
  );
  rim.rotation.z = Math.PI / 2;
  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.28, radius * 0.28, wide + 0.08, 10),
    mat(0x1c222a, { metalness: 0.6, roughness: 0.25 }),
  );
  disc.rotation.z = Math.PI / 2;
  // spokes vibe
  for (let i = 0; i < 5; i++) {
    const spoke = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, radius * 0.85, 0.05),
      mat(0xa8b4c0, { metalness: 0.8, roughness: 0.2 }),
    );
    spoke.rotation.z = Math.PI / 2;
    spoke.rotation.x = (i / 5) * Math.PI;
    g.add(spoke);
  }
  g.add(tire, rim, disc);
  g.traverse((o) => {
    if (o instanceof THREE.Mesh) o.castShadow = true;
  });
  return g;
}

function addWheels(root: THREE.Group, wideKart: boolean): void {
  const wr = wideKart ? 0.4 : 0.36;
  const ww = wideKart ? 0.34 : 0.28;
  const spreadX = wideKart ? 0.78 : 0.68;
  const frontZ = 0.92;
  const rearZ = -0.88;
  for (const [x, z] of [
    [-spreadX, frontZ],
    [spreadX, frontZ],
    [-spreadX, rearZ],
    [spreadX, rearZ],
  ] as const) {
    const w = wheel(ww, wr);
    w.position.set(x, wr, z);
    w.name = z > 0 ? "wheelF" : "wheelR";
    root.add(w);
  }
}

/**
 * Arcade racing kart — low-poly but adult: pointed nose, sidepods,
 * wing with endplates, roll hoop, helmet (no toy ball-on-box look).
 */
export function createKartMesh(def: KartDef): THREE.Group {
  const root = new THREE.Group();
  root.frustumCulled = false;
  const paint = paintMat(def.paint, 0.1);
  const accent = paintMat(def.accent, 0.08);
  const carbon = mat(0x14181e, { roughness: 0.55, metalness: 0.35 });
  const dark = mat(new THREE.Color(def.cabin).getHex(), { roughness: 0.5, metalness: 0.2 });
  const glass = new THREE.MeshStandardMaterial({
    color: "#1a3040",
    transparent: true,
    opacity: 0.62,
    metalness: 0.75,
    roughness: 0.08,
  });
  const chrome = mat(0xd8e0ea, { metalness: 0.92, roughness: 0.16 });

  const wide = def.id === "guardiao";
  const slim = def.id === "vespa";
  const long = def.id === "ziper";
  const bodyW = wide ? 1.28 : slim ? 0.86 : long ? 0.96 : 1.06;
  const bodyL = slim ? 1.85 : long ? 2.05 : 1.95;

  // floorpan
  const pan = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.88, 0.06, bodyL * 0.9), carbon);
  pan.position.y = 0.2;

  // main tub
  const tub = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.72, 0.32, bodyL * 0.55), paint);
  tub.position.set(0, 0.4, -0.08);

  // pointed nose (wedge stack)
  const nose1 = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.55, 0.16, 0.55), paint);
  nose1.position.set(0, 0.34, bodyL * 0.28);
  const nose2 = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.38, 0.12, 0.42), paint);
  nose2.position.set(0, 0.32, bodyL * 0.42);
  const tip = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.22, 0.09, 0.28), accent);
  tip.position.set(0, 0.3, bodyL * 0.52);

  // sidepods
  const podL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.26, bodyL * 0.48), paint);
  podL.position.set(-bodyW * 0.42, 0.38, 0.02);
  const podR = podL.clone();
  podR.position.x = bodyW * 0.42;

  // intake / engine cover behind seat
  const cover = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.5, 0.22, 0.45), carbon);
  cover.position.set(0, 0.52, -0.42);

  root.add(pan, tub, nose1, nose2, tip, podL, podR, cover);

  // model-specific personality
  if (def.id === "vespa") {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.28, 0.7), accent);
    fin.position.set(0, 0.58, 0.2);
    const splitter = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.05, 0.14), carbon);
    splitter.position.set(0, 0.24, 1.05);
    root.add(fin, splitter);
  } else if (def.id === "cometa") {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, bodyL * 0.85), accent);
    stripe.position.set(0, 0.58, 0.05);
    const hood = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.48, 0.1, 0.7), paint);
    hood.position.set(0, 0.52, 0.35);
    root.add(stripe, hood);
  } else if (def.id === "guardiao") {
    const armor = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.95, 0.2, 1.1), paint);
    armor.position.set(0, 0.48, 0.05);
    const bull = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.9, 0.12, 0.16), accent);
    bull.position.set(0, 0.3, 1.12);
    const cage = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.08, 0.5), carbon);
    cage.position.set(0, 0.95, -0.12);
    root.add(armor, bull, cage);
  } else {
    // ziper — long & low
    const railL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, bodyL * 0.8), accent);
    railL.position.set(0.28, 0.5, 0);
    const railR = railL.clone();
    railR.position.x = -0.28;
    const skirt = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.95, 0.08, bodyL * 0.75), carbon);
    skirt.position.set(0, 0.26, 0);
    root.add(railL, railR, skirt);
  }

  // rear wing + endplates
  const wingW = slim ? 0.85 : wide ? 1.2 : 1.05;
  const wing = new THREE.Mesh(new THREE.BoxGeometry(wingW, 0.05, 0.22), carbon);
  wing.position.set(0, slim ? 0.72 : 0.78, slim ? -0.85 : -0.95);
  const endL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.22, 0.26), carbon);
  endL.position.set(-wingW * 0.48, wing.position.y, wing.position.z);
  const endR = endL.clone();
  endR.position.x = wingW * 0.48;
  const strutL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.28, 0.04), chrome);
  strutL.position.set(-0.22, 0.62, wing.position.z + 0.02);
  const strutR = strutL.clone();
  strutR.position.x = 0.22;
  root.add(wing, endL, endR, strutL, strutR);

  // roll hoop
  const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.035, 8, 16, Math.PI), chrome);
  hoop.rotation.x = Math.PI / 2;
  hoop.rotation.z = Math.PI;
  hoop.position.set(0, 0.78, -0.22);
  root.add(hoop);

  // cockpit: seat + driver (helmet, not toy ball)
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.16, 0.38), dark);
  seat.position.set(0, 0.48, -0.12);
  const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.36, 0.1), dark);
  backrest.position.set(0, 0.68, -0.28);
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.32, 0.28), dark);
  torso.position.set(0, 0.68, -0.08);
  const shoulder = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.1, 0.22), dark);
  shoulder.position.set(0, 0.84, -0.06);
  // helmet shell (slightly flattened sphere) + visor strip
  const helmet = new THREE.Mesh(
    new THREE.SphereGeometry(0.15, 16, 12),
    mat(0x0e1218, { roughness: 0.22, metalness: 0.45 }),
  );
  helmet.scale.set(1.05, 0.92, 1.1);
  helmet.position.set(0, 0.98, 0.02);
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.1), glass);
  visor.position.set(0, 0.97, 0.12);
  const chin = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 0.1), mat(0x0e1218, { metalness: 0.4 }));
  chin.position.set(0, 0.9, 0.1);
  root.add(seat, backrest, torso, shoulder, helmet, visor, chin);

  // steering wheel hint
  const wheelRim = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.015, 6, 14), mat(0x22262c, { roughness: 0.6 }));
  wheelRim.position.set(0, 0.7, 0.22);
  wheelRim.rotation.x = 0.55;
  root.add(wheelRim);

  addWheels(root, wide);

  // exhausts
  const exL = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.28, 8), chrome);
  exL.rotation.x = Math.PI / 2;
  exL.position.set(-0.18, 0.32, -bodyL * 0.48);
  const exR = exL.clone();
  exR.position.x = 0.18;
  root.add(exL, exR);

  // lights
  const lampMat = new THREE.MeshBasicMaterial({ color: 0xfff1c2 });
  const l1 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.07, 0.05), lampMat);
  l1.position.set(-0.2, 0.34, bodyL * 0.55);
  const l2 = l1.clone();
  l2.position.x = 0.2;
  const tailMat = new THREE.MeshBasicMaterial({ color: 0xff2a22 });
  const t1 = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.07, 0.05), tailMat);
  t1.position.set(-0.26, 0.42, -bodyL * 0.5);
  const t2 = t1.clone();
  t2.position.x = 0.26;
  root.add(l1, l2, t1, t2);

  // number plate vibe
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.12, 0.02), accent);
  plate.position.set(0, 0.4, -bodyL * 0.5 - 0.04);
  root.add(plate);

  root.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.castShadow = true;
      o.frustumCulled = false;
    }
  });
  return root;
}
