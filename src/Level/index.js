import * as THREE from 'three';
import { find, flatten } from 'lodash';

import { CHUNK_SIZE } from '../config';
import Chunk from './Chunk';
import LightMap from './LightMap';
import getTiles from './tiles';

import Player from '../entities/Player';
import Trigger from '../entities/Trigger';
import Shaman from '../entities/Shaman';

const requireTsx = require.context('../assets/sprites', true, /\.tsx$/);

const levels = {
	playground: require('../assets/levels/playground/playground'),
	cave: require('../assets/levels/cave/cave'),
};

export default class Level extends THREE.Group {
	static PLAYGROUND = 'playground';
	static CAVE = 'cave';

	constructor(game, level) {
		super();

		this.game = game;
		this.level = level;

		this.load(level);
	}

	light(...args) {
		return this.lightMap.getLight(...args);
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
		this.chunks = new THREE.Group();
		this.entities = new THREE.Group();
		this.tiles = {};

		this.layers = {
			ceiling: find(this.definition.layers, { name: 'ceiling' }),
			walls: find(this.definition.layers, { name: 'walls' }),
			floor: find(this.definition.layers, { name: 'floor' }),
			collision: find(this.definition.layers, { name: 'collision' }),
			entities: find(this.definition.layers, { name: 'entities' }),
			face: find(this.definition.layers, { name: 'face' }),
			cliff: find(this.definition.layers, { name: 'cliff' }),
		};

		this.layers.test = () => false;

		this.lightMap = new LightMap(this);

		const loader = new THREE.TextureLoader(this.game.loader);

		this.definition.tilesets.forEach(({ source, firstgid }) => {
			if (source.includes('collision') || source.includes('lights')) {
				return;
			}

			const tsx = requireTsx(source.replace('../../sprites/', './'));
			const tiles = getTiles(this.game, tsx);

			tiles.forEach((tile, index) => {
				this.tiles[index + firstgid] = tile;
			});
		});

		console.log(this.tiles);
	}

	create = () => {
		for (let x = 0; x < this.definition.width / CHUNK_SIZE; x += 1) {
			for (let y = 0; y < this.definition.height / CHUNK_SIZE; y += 1) {
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
