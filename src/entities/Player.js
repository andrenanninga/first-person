import * as THREE from 'three';
import { Body } from 'matter-js';
import { flatten } from 'lodash';

import { CATEGORY } from '../Physics';

const PLAYER_FOV = 60;
const SPEED = 80;
const TURN = 4;

export default class Player extends THREE.Group {
	constructor(game, level, definition) {
		super();

		this.game = game;
		this.level = level;
		this.name = definition.name;
		this.definition = definition;

		this.radius = 0.2;

		const capsule = new THREE.Mesh(
			new THREE.CylinderGeometry(this.radius, this.radius, 0.8, 16),
			new THREE.MeshNormalMaterial()
		);

		const aspect = window.innerWidth / window.innerHeight;
		this.camera = new THREE.PerspectiveCamera(PLAYER_FOV, aspect, 0.1, 100)
		this.camera.position.y = 0.1;
		this.camera.rotation.y = -Math.PI / 2;
		this.add(this.camera);
		
		if (__DEV__) {
			this.game.scene.add(new THREE.CameraHelper(this.camera));
		}

		this.position.x = definition.x + definition.width / 2;
		this.position.y = 0.4;
		this.position.z = definition.y + definition.height / 2;

		this.body = this.game.physics.addEntity(this, {
			collisionFilter: { category: CATEGORY.PLAYER },
		});

		this.body.friction = 0;
		this.body.frictionAir = 0.15;
		this.body.inverseInertia = 0;

		this.add(capsule);
	}

	update(delta) {
		const force = new THREE.Vector3(0, 0, 0);
		const speed = new THREE.Vector3(this.body.velocity.x, 0, this.body.velocity.y);

		if (this.game.keys.includes(87)) {
			force.x = 1;
		}
		else if (this.game.keys.includes(83)) {
			force.x = -1;
		}

		if (this.game.keys.includes(65)) {
			force.z = -1;
		}
		else if (this.game.keys.includes(68)) {
			force.z = 1;
		}

		if (this.game.keys.includes(37)) {
			Body.rotate(this.body, -delta * TURN);
		}
		else if (this.game.keys.includes(39)) {
			Body.rotate(this.body, delta * TURN);
		}

		force.applyAxisAngle(new THREE.Vector3(0, 1, 0), -this.body.angle);
		force.multiplyScalar(SPEED);

		Body.applyForce(this.body, this.body.position, { x: force.x, y: force.z });

		if (speed.length() > 1) {
			speed.normalize();
			this.body.velocity.x = speed.x;
			this.body.velocity.y = speed.z;
		}

		this.rotation.y = -this.body.angle;
	}

	render() {
		const aspect = __DEV__ ? window.innerWidth / (window.innerHeight - 320) : window.innerWidth / window.innerHeight;

		if (this.camera.aspect !== aspect) {
			this.camera.aspect = aspect;
			this.camera.updateProjectionMatrix();
		}

		if (__DEV__) {
			this.game.renderer.setViewport(0, 0, window.innerWidth, window.innerHeight - 320);
			this.game.renderer.setScissor(0, 0, window.innerWidth, window.innerHeight - 320);
			this.game.renderer.setScissorTest(true);
		}

		this.game.renderer.render(this.game.scene, this.camera);
	}
}
