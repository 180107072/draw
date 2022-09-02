import * as THREE from "three";
import Grass from "./scripts/grass.js";

export const world = new THREE.Group();
const geo = new THREE.PlaneBufferGeometry(100, 100, 1, 1);
const mat = new THREE.MeshBasicMaterial({ color: "#614141", side: THREE.DoubleSide });
const plane = new THREE.Mesh(geo, mat);

// geo.rotateX(-Math.PI * 0.5); // this is how you can do it

world.add(plane);
