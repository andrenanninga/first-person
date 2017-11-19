import * as THREE from 'three';

import { CATEGORY } from '../Physics';

export default class Shaman extends THREE.Mesh {
	constructor(game, level, definition) {
		super(
			new THREE.CylinderGeometry(0.4, 0.4, 0.8, 16),
			level.tiles[10]
		);

		this.game = game;
		this.level = level;
		this.name = definition.name;
		this.definition = definition;

		this.radius = 0.4;

		this.position.x = definition.x + definition.width / 2;
		this.position.y = 0.4;
		this.position.z = definition.y + definition.height / 2;

		this.body = this.game.physics.addEntity(this, {
			mass: 10000,
			frictionAir: 1,
			collisionFilter: { category: CATEGORY.MONSTER },
		});
	}

	update() {
		const color = this.level.light(this.position.x, this.position.z);

		if (color !== this.geometry.faces[0].color) {
			this.geometry.faces.forEach(face => face.color.set(color));
			this.geometry.colorsNeedUpdate = true;
		}
	}
}