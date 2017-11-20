import * as THREE from 'three';
import Matter from 'matter-js';

import { CATEGORY } from '../Physics';
import { CHUNK_SIZE } from '../config';

export default class Chunk extends THREE.Group {

	constructor(game, level, x, y) {
		super();

		this.game = game;
		this.level = level;
		this.x = x;
		this.y = y;

		this.position.x = x * CHUNK_SIZE + 0.5;
		this.position.z = y * CHUNK_SIZE + 0.5;

		if (__DEV__) {
			const box = new THREE.Mesh(
				new THREE.BoxGeometry(CHUNK_SIZE, 1, CHUNK_SIZE),
				new THREE.MeshNormalMaterial()
			);

			box.position.x = CHUNK_SIZE / 2 - 0.5;
			box.position.y = 0.5;
			box.position.z = CHUNK_SIZE / 2 - 0.5;

			const helper = new THREE.BoxHelper(box, 0xff0000);
			helper.update = () => {};
			this.add(helper);
		}

		this.floor = this.addFloor();
		this.walls = this.addWalls();
		this.ceiling = this.addCeiling();

		this.add(this.floor);
		this.add(this.walls);
		this.add(this.ceiling);
	}

	addFloor() {
		const group = new THREE.Group();

		for (let x = 0; x < CHUNK_SIZE; x++) {
			for (let y = 0; y < CHUNK_SIZE; y++) {
				const tile = this.level.layers.floor.data[this.coordToIndex(x, y)];
				const color = this.level.light(this.coordToIndex(x, y));

				if (tile === 0) {
					continue;
				}

				const plane = new THREE.Mesh(
					new THREE.PlaneGeometry(1, 1),
					this.level.tiles[tile]
				);

				plane.position.x = x;
				plane.position.z = y;
				plane.rotation.x = -Math.PI / 2;

				plane.geometry.faces.forEach(face => face.color = color);

				group.add(plane);
			}
		}

		return group;
	}

	addCeiling() {
		const group = new THREE.Group();

		for (let x = 0; x < CHUNK_SIZE; x++) {
			for (let y = 0; y < CHUNK_SIZE; y++) {
				const tile = this.level.layers.ceiling.data[this.coordToIndex(x, y)];
				const color = this.level.light(this.coordToIndex(x, y));

				if (tile === 0) {
					continue;
				}

				const plane = new THREE.Mesh(
					new THREE.PlaneGeometry(1, 1),
					this.level.tiles[tile]
				);

				plane.position.x = x;
				plane.position.y = 1;
				plane.position.z = y;
				plane.rotation.x = Math.PI / 2;

				plane.geometry.faces.forEach(face => face.color = color);

				group.add(plane);
			}
		}

		return group;
	}

	addWalls() {
		const group = new THREE.Group();
		const directions = [
			{ offset: { x: 0, y: -1 }, rotation: 0 }, // North
			{ offset: { x: -1, y: 0 }, rotation: Math.PI / 2 }, // East
			{ offset: { x: 0, y: 1 }, rotation: Math.PI }, // South
			{ offset: { x: 1, y: 0 }, rotation: -Math.PI / 2 }, // West
		];

		for (let x = 0; x < CHUNK_SIZE; x++) {
			for (let y = 0; y < CHUNK_SIZE; y++) {
				const floor = this.level.layers.floor.data[this.coordToIndex(x, y)];
				const wall = this.level.layers.collision.data[this.coordToIndex(x, y)];

				if (wall) {
					this.game.physics.addRectangle(
						x + this.position.x,
						y + this.position.z,
						1,
						1,
						{
							isStatic: true,
							collisionFilter: { category: CATEGORY.WALL },
							render: {
								fillStyle: '#444',
								strokeStyle: '#444',
								lineWidth: 1,
							}
						});
				}

				if (floor === 0) {
					continue;
				}

				directions.forEach(({ offset, rotation }) => {
					const tile = this.level.layers.walls.data[this.coordToIndex(x + offset.x, y + offset.y)];

					if (!tile) {
						return;
					}

					const color = this.level.light(this.coordToIndex(x, y));
					const plane = new THREE.Mesh(
						new THREE.PlaneGeometry(1, 1),
						this.level.tiles[tile]
					);
	
					plane.position.x = x + (offset.x / 2);
					plane.position.y = 0.5;
					plane.position.z = y + (offset.y / 2);
					plane.rotation.y = rotation,
	
					plane.geometry.faces.forEach(face => face.color = color);
	
					group.add(plane);
				});
			}
		}


		return group;
	}

	coordToIndex(x, y) {
		return (this.y * CHUNK_SIZE + y) * this.level.definition.width + (this.x * CHUNK_SIZE + x);
	}
}
