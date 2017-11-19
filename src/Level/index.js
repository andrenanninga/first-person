import * as THREE from 'three';
import { find, flatten } from 'lodash';

import { CHUNK_SIZE } from '../config';
import Chunk from './Chunk';
import LightMap from './LightMap';
import CollisionMap from './CollisionMap';
import getTiles from './tiles';

import Player from '../entities/Player';
import Trigger from '../entities/Trigger';
import Shaman from '../entities/Shaman';

const requireTsx = require.context('../assets/sprites', true, /\.tsx$/);

const levels = {
	playground: require('../assets/levels/playground/playground'),
};

export default class Level extends THREE.Group {
	static PLAYGROUND = 'playground';

	constructor(game, level) {
		super();

		this.game = game;
		this.level = level;

		this.load(level);
	}

	light(...args) {
		return this.lightMap.getLight(...args);
	}

	solid(...args) {
		return this.collisionMap.isSolid(...args);
	}

	getWalls() {
		return flatten(this.chunks.children.map(chunk => chunk.walls.children));
	}

	preprocess(definition) {
		const tileSize = definition.tileheight;

		definition.layers.forEach(layer => {
			if (layer.type === 'objectgroup') {
				layer.objects.forEach(object => {
					object.x /= tileSize;
					object.y /= tileSize;
					object.height /= tileSize;
					object.width /= tileSize;
				});
			}
		})

		return definition;
	}

	load = (level) => {
		this.definition = this.preprocess(levels[level]);
		this.tileSize = this.definition.tileheight;

		this.tiles = [new THREE.MeshNormalMaterial()];

		this.chunks = new THREE.Group();
		this.entities = new THREE.Group();

		this.ceiling = find(this.definition.layers, { name: 'ceiling' });
		this.walls = find(this.definition.layers, { name: 'walls' });
		this.floor = find(this.definition.layers, { name: 'floor' });

		this.lightMap = new LightMap(this);
		this.collisionMap = new CollisionMap(this);

		const loader = new THREE.TextureLoader(this.game.loader);

		this.definition.tilesets.forEach(({ source, firstgid }) => {
			if (source.includes('collision') || source.includes('lights')) {
				return;
			}

			const tsx = requireTsx(source.replace('../../sprites/', './'));
			const tiles = getTiles(this.game, tsx);

			this.tiles.splice(firstgid, 0, ...tiles);
		});
	}

	create = () => {
		for (let x = 0; x < this.definition.width / CHUNK_SIZE; x += 1) {
			for (let y = 0; y < this.definition.width / CHUNK_SIZE; y += 1) {
				this.chunks.add(new Chunk(this.game, this, x, y));
			}
		}

		const entities = find(this.definition.layers, { name: 'entities' });
		entities.objects.forEach(entity => {
			switch (entity.type) {
				case 'Player':
					this.entities.add(new Player(this.game, this, entity));
					return;

				case 'Trigger':
					this.entities.add(new Trigger(this.game, this, entity));
					return;

				case 'Shaman':
					console.log(entity);
					if (entity.properties.autoSpawn) {
						this.entities.add(new Shaman(this.game, this, entity));
					}
					return;

				default:
					console.warn(`Entity ${entity.name} has an unknown type: ${entity.type}`, entity);
			}
		});

		console.log(this.entities)

		this.add(this.chunks);
		this.add(this.entities);
	}

	update(delta) {
		// this.chunks.children.forEach(chunk => {
		// 	chunk.visible = false;
		// });

		this.entities.children.forEach(child => {
			child.update(delta)
		});
	}
}
