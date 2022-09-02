import { chunk } from "lodash";
import simplify from "simplify-js";
import * as THREE from "three";
import { Mesh, Vector2, Vector3 } from "three";
import { computeBezierCurve } from "./computeBezierCurve";

import { world } from "./world";

const mouse = new THREE.Vector2();

type WindowSizes = {
	width: number;
	height: number;
};
export const sizes: WindowSizes = {
	width: window.innerWidth,
	height: window.innerHeight,
};

const aspectRatio = (s: WindowSizes) => s.width / s.height;
console.log("Aspect ratio:", aspectRatio);

const frustumDelta = 100;
export const cameraPositionISO = 1000;
export const camera = new THREE.PerspectiveCamera();
camera.scale.set(0.7, 0.7, 0.7);
camera.position.set(0, -90, 100);

camera.updateProjectionMatrix();

export const onResizeCamera = () => {};

export const referencePlane = new THREE.Mesh(
	new THREE.PlaneGeometry(1000, 1000),
	new THREE.MeshBasicMaterial({
		color: 0x5555ff,
		side: THREE.BackSide,
		transparent: true,
		opacity: 1,
		depthTest: false,
	})
);
referencePlane.rotation.x = Math.PI / 2;
referencePlane.position.z = -0.1;
referencePlane.position.y = -1;

const initalAngle = (Math.PI / 4) * 3;
let currentAngle = initalAngle;

export const getBlock = () => {
	const raycaster = new THREE.Raycaster();
	raycaster.setFromCamera(new Vector2(0, 0), camera);
	const intersect = raycaster.intersectObject(referencePlane).pop();
};

export const rotateCamera = (rotation = 0) => {
	// console.log('roatate camera', rotation)
};

const raycaster = new THREE.Raycaster();

document.addEventListener("mousemove", (event) => {
	mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
	mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

const worldTerrain = [];
let mousedown = false;

document.addEventListener("click", (event) => {
	raycaster.setFromCamera(mouse, camera);
	const isIntersected = raycaster.intersectObject(world);

	const intersection = isIntersected.find(({ object }) => object instanceof Mesh);
	if (intersection) {
	}
});

let points = [];
const obj = new THREE.Object3D();

document.addEventListener("mousedown", () => {
	points = [];
	mousedown = true;
});
document.addEventListener("mouseup", () => {
	mousedown = false;

	const simple = simplify(points, 2);
	const [start, ...bezierCurve] = computeBezierCurve(simple.map(({ x, y }) => [x, y]));
	const beziers = chunk(bezierCurve, 3);
	const bezier = new THREE.Path();
	bezier.moveTo(start[0], start[1]);
	beziers.forEach((points: number[][], i) => {
		if (points.length === 3) {
			const [[c1x, c1y], [c2x, c2y], [x, y]] = points;
			bezier.bezierCurveTo(c1x, c1y, c2x, c2y, x, y);
		} else {
			bezier.closePath();
		}
	});
	bezier.autoClose = false;
	const curvePoints = bezier.getPoints(simple.length * 50);
	const geometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
	// geometry.setAttribute("position", position);

	const material = new THREE.LineBasicMaterial({ color: "#FF0000" });
	const line = new THREE.Line(geometry, material);

	world.add(line);

	const geometryB = new THREE.CircleBufferGeometry(1, 32); //new THREE.PlaneBufferGeometry(POINTSIZE,POINTSIZE)
	const materialB = new THREE.MeshBasicMaterial({ color: "green" });
	const mesh = new THREE.InstancedMesh(geometryB, materialB, 20000);

	const setPoint = (point, index, count) => {
		const updatePoint = (p: THREE.Vector3, i: number) => {
			const { x, y, z } = p;
			obj.position.set(x, y, z);
			obj.updateMatrix();
			mesh.setMatrixAt(i, obj.matrix);
		};
		if (Array.isArray(point)) {
			point.forEach((po, i) => updatePoint(po, index + i));
		} else {
			updatePoint(point, index);
		}
		if (count) mesh.count = count;
		mesh.instanceMatrix.needsUpdate = true;
		mesh.updateMatrix();
	};

	if (simple) simple.forEach((p, i) => setPoint(p, i, simple.length));
	// *-------------* ?
	world.add(mesh);
});

document.addEventListener("mousemove", (event) => {
	if (mousedown) {
		raycaster.setFromCamera(mouse, camera);
		const isIntersected = raycaster.intersectObject(world);

		const intersection = isIntersected.find(({ object }) => object instanceof Mesh);
		if (intersection) {
			const geometry = new THREE.BoxGeometry(1, 1, 1);
			const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
			const cube = new THREE.Mesh(geometry, material);
			const vec = new THREE.Vector3(); // create once and reuse
			const pos = new THREE.Vector3(); // create once and reuse

			vec.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1, 0.5);

			vec.unproject(camera);

			vec.sub(camera.position).normalize();

			const distance = intersection.object.position.z - camera.position.z / vec.z;

			const newPos = pos.copy(camera.position).add(vec.multiplyScalar(distance));
			points.push(newPos);

			cube.position.set(newPos.x, newPos.y, newPos.z);
			world.add(cube);
			setTimeout(() => {
				world.remove(cube);
			}, 1000);
		}
	}
});
