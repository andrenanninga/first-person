import * as THREE from 'three';
import Matter from 'matter-js';
import { uniq, map } from 'lodash';

import { CATEGORY } from '../Physics';
import { CHUNK_SIZE } from '../config';

export default class Chunk extends THREE.Mesh {

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

			box.position.x = this.position.x + CHUNK_SIZE / 2 - 0.5;
			box.position.y = 0.5;
			box.position.z = this.position.z + CHUNK_SIZE / 2 - 0.5;

			const helper = new THREE.BoxHelper(box, 0xff0000);
			helper.update = () => {};
			this.level.add(helper);
		}

		this.meshes = [];
		this.addFloor();
		this.addWalls();
		this.addCeiling();
		this.addCliff();

		this.geometry = new THREE.Geometry();
		this.material = uniq(map(this.level.tiles, tile => tile.material));
		this.meshes.forEach(child => {
			child.updateMatrix();
			this.geometry.merge(child.geometry, child.matrix, this.material.indexOf(child.material));
		});
	}

	addFloor() {
		for (let x = 0; x < CHUNK_SIZE; x++) {
			for (let y = 0; y < CHUNK_SIZE; y++) {
				const index = this.level.layers.floor.data[this.coordToIndex(x, y)];
				const color = this.level.light(this.coordToIndex(x, y));
				const tile = this.level.tiles[index];

				if (index === 0) {
					continue;
				}

				const plane = new THREE.Mesh(
					new THREE.PlaneGeometry(1, 1),
					tile.material
				);

				plane.position.x = x;
				plane.position.z = y;
				plane.rotation.x = -Math.PI / 2;

				plane.geometry.faces.forEach(face => face.color = color);
				plane.geometry.faceVertexUvs[0].forEach(face => {
					face.forEach(corner => {
						corner.x = tile.uv.x + tile.size.x * corner.x;
						corner.y = tile.uv.y - tile.size.y * corner.y;
					});
				});

				this.meshes.push(plane);
			}
		}
	}

	addCeiling() {
		for (let x = 0; x < CHUNK_SIZE; x++) {
			for (let y = 0; y < CHUNK_SIZE; y++) {
				const index = this.level.layers.ceiling.data[this.coordToIndex(x, y)];
				const color = this.level.light(this.coordToIndex(x, y));
				const tile = this.level.tiles[index];

				if (index === 0) {
					continue;
				}

				const plane = new THREE.Mesh(
					new THREE.PlaneGeometry(1, 1),
					tile.material
				);

				plane.position.x = x;
				plane.position.y = 1;
				plane.position.z = y;
				plane.rotation.x = Math.PI / 2;

				plane.geometry.faces.forEach(face => face.color = color);
				plane.geometry.faceVertexUvs[0].forEach(face => {
					face.forEach(corner => {
						corner.x = tile.uv.x + tile.size.x * corner.x;
						corner.y = tile.uv.y - tile.size.y * corner.y;
					});
				});

				this.meshes.push(plane);
			}
		}
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
					const config = {
						isStatic: true,
						collisionFilter: { category: CATEGORY.WALL },
						render: {
							fillStyle: '#444',
							strokeStyle: '#444',
							lineWidth: 1,
						}
					};

					this.game.physics.addRectangle(x + this.position.x, y + this.position.z, 1, 1, config);
				}

				if (floor === 0) {
					continue;
				}

				directions.forEach(({ offset, rotation }) => {
					const index = this.level.layers.walls.data[this.coordToIndex(x + offset.x, y + offset.y)];
					const tile = this.level.tiles[index];

					if (!index) {
						return;
					}

					const color = this.level.light(this.coordToIndex(x, y));
					const plane = new THREE.Mesh(
						new THREE.PlaneGeometry(1, 1),
						tile.material,
					);

					plane.position.x = x + (offset.x / 2);
					plane.position.y = 0.5;
					plane.position.z = y + (offset.y / 2);
					plane.rotation.y = rotation,
	
					plane.geometry.faces.forEach(face => face.color = color);
					plane.geometry.faceVertexUvs[0].forEach(face => {
						face.forEach(corner => {
							corner.x = tile.uv.x + tile.size.x * corner.x;
							corner.y = tile.uv.y - tile.size.y * corner.y;
						});
					});
	
					this.meshes.push(plane);
				});
			}
		}
	}

	addCliff() {
		const group = new THREE.Group();
		const directions = [
			{ offset: { x: 0, y: -1 }, rotation: Math.PI }, // North
			{ offset: { x: -1, y: 0 }, rotation: -Math.PI / 2 }, // East
			{ offset: { x: 0, y: 1 }, rotation: 0 }, // South
			{ offset: { x: 1, y: 0 }, rotation: Math.PI / 2 }, // West
		];

		for (let x = 0; x < CHUNK_SIZE; x++) {
			for (let y = 0; y < CHUNK_SIZE; y++) {
				const index = this.level.layers.cliff.data[this.coordToIndex(x, y)];
				const floor = this.level.layers.floor.data[this.coordToIndex(x, y)];
				const ceiling = this.level.layers.ceiling.data[this.coordToIndex(x, y)];
				const tile = this.level.tiles[index];

				if (index === 0) {
					continue;
				}

				directions.forEach(({ offset, rotation }) => {
					const color = this.level.light(this.coordToIndex(x, y));
					const neighborFloor = this.level.layers.floor.data[this.coordToIndex(x + offset.x, y + offset.y)];

					for (let i = -5; i < 10; i++) {
						if (i === 0) {
							continue;
						}
						else if (i < 0 && !floor) {
							continue;
						}
						else if (i > 0 && (!ceiling && floor)) {
							continue;
						}

						const plane = new THREE.Mesh(
							new THREE.PlaneGeometry(1, 1),
							tile.material,
						);
		
						plane.position.x = x + (offset.x / 2);
						plane.position.y = i + 0.5;
						plane.position.z = y + (offset.y / 2);
						plane.rotation.y = rotation;
		
						plane.geometry.faces.forEach(face => face.color = color);
						plane.geometry.faceVertexUvs[0].forEach(face => {
							face.forEach(corner => {
								corner.x = tile.uv.x + tile.size.x * corner.x;
								corner.y = tile.uv.y - tile.size.y * corner.y;
							});
						});
		
						this.meshes.push(plane);
					}
				});
			}
		}
	}

	coordToIndex(x, y) {
		return (this.y * CHUNK_SIZE + y) * this.level.definition.width + (this.x * CHUNK_SIZE + x);
	}
}
