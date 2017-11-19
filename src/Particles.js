import * as THREE from 'three';
import { random, find } from 'lodash';

import tileset from './assets/sprites/particles.png';
import lights from './assets/sprites/lights';
import { PARTICLE_KEEP_ALIVE } from './config';

export default class Particles extends THREE.Group {
	static GRAVITY = new THREE.Vector3(0, -1, 0);

	static SPARK = { tile: 0, size: 0.05, mass: 50, friction: 0.2 }
	static SHELL = { tile: 1, size: 0.1, mass: 5, friction: 0.8 }
	static GIB = { tile: 2, size: 0.21, mass: 10, friction: 0.1 }

	constructor(level) {
		super();

		this.level = level;

		this.texture = new THREE.TextureLoader().load(tileset);
		this.texture.magFilter = THREE.NearestFilter;
		this.texture.minFilter = THREE.NearestMipMapLinearFilter;
		this.material = new THREE.MeshBasicMaterial({ map: this.texture, transparent: true });
		this.material.vertexColors = THREE.FaceColors;
	}

	addParticle(particle, position, velocity = new THREE.Vector3()) {
		this.add(new Particle(particle, position, velocity, this.level, this.material));
	}
}

class Particle extends THREE.Mesh {
	constructor(particle, position, velocity, level, material) {
		super();

		this.material = material;
		this.geometry = new THREE.PlaneGeometry(particle.size, particle.size);
		this.timer = PARTICLE_KEEP_ALIVE;
		this.collision = find(level.layers, { name: 'collision' });
		this.lighting = find(level.layers, { name: 'lights' });

		const tilesetWidth = material.map.image.width / 8;
		const tilesetHeight = material.map.image.height / 8;

		const size = new THREE.Vector2(1 / tilesetWidth, 1 / tilesetHeight);
		const uv = new THREE.Vector2(
			(particle.tile % tilesetWidth) / tilesetWidth,
			1 - Math.floor(particle.tile / tilesetWidth) / tilesetHeight
		);

		this.geometry.faceVertexUvs[0].forEach(face => {
			face.forEach(corner => {
				corner.x = uv.x + size.x * corner.x;
				corner.y = uv.y - size.y * corner.y;
			});
		});

		this.mass = particle.mass;
		this.size = particle.size;
		this.friction = particle.friction;

		this.position.add(position);
		this.velocity = new THREE.Vector3(random(-5, 5, true), random(0, 1, true), random(-5, 5, true));
		this.force = Particles.GRAVITY;
	}

	update(delta) {
		if (window.game) {
			this.quaternion.copy(window.game.camera.quaternion);
		}

		if (this.timer < 0) {
			this.parent.remove(this);
			return;
		}

		this.timer -= delta;

		if (Math.abs(this.velocity.x) < 0.1 && Math.abs(this.velocity.z) < 0.1) {
			return;
		}

		const prevPosition = this.position.clone();
		const current = Math.floor(this.position.z) * this.collision.width + Math.floor(this.position.x);
		
		this.velocity.add(this.force.clone().multiplyScalar(this.mass).multiplyScalar(delta));
		this.position.add(this.velocity.clone().multiplyScalar(delta));

		if ((this.position.y - this.size / 2) < 0 && this.velocity.y < 0) {
			this.velocity.y = -this.velocity.y;
			this.velocity.multiplyScalar(1 - this.friction);
			this.position.y = 0 + this.size / 2;
		}
		
		if ((this.position.y + this.size / 2) > 1 && this.velocity.y > 0) {
			this.velocity.y = -this.velocity.y;
			this.velocity.multiplyScalar(1 - this.friction);
			this.position.y = 1 - this.size / 2;
		}
		
		const east = this.collision.data[current + 1];
		const west = this.collision.data[current - 1];
		const north = this.collision.data[current - this.collision.width];
		const south = this.collision.data[current + this.collision.width];

		const index = Math.floor(this.position.z) * this.lighting.width + Math.floor(this.position.x);
		const light = lights[this.lighting.data[index] - 17];

		this.geometry.faces.forEach(face => {
			face.color.set(light);
		});
		this.geometry.colorsNeedUpdate = true;

		if (Math.floor(this.position.x) !== Math.floor(prevPosition.x)) {
			if ((east && this.velocity.x > 0) || (west && this.velocity.x < 0)) {
				this.velocity.x = -this.velocity.x;
				this.velocity.y += random(-1, 1, true);
				this.velocity.z += random(-1, 1, true);
				this.velocity.multiplyScalar(1 - this.friction);
				this.position.x = prevPosition.x;
			}
		}

		if (Math.floor(this.position.z) !== Math.floor(prevPosition.z)) {
			if ((north && this.velocity.z < 0) || (south && this.velocity.z > 0)) {
				this.velocity.x += random(-1, 1, true);
				this.velocity.y += random(-1, 1, true);
				this.velocity.z = -this.velocity.z;
				this.velocity.multiplyScalar(1 - this.friction);
				this.position.z = prevPosition.z;
			}
		}
	}
}
