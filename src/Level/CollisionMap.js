import * as THREE from 'three';
import { find } from 'lodash';

export default class CollisionMap {
	constructor(level) {
		this.level = level;
		this.collision = find(level.definition.layers, { name: 'collision' }).data;

		const tileset = find(level.definition.tilesets, ({ source }) => source.includes('collision.tsx'));
		this.offset = tileset.firstgid;
		console.log(this.offset);
	}

	isSolid(...args) {
		if (args.length === 1) {
			return this.isSolidByIndex(args[0]);
		}
		else if (args.length === 2) {
			return this.isSolidByCoords(args[0], args[1]);
		}

		throw new Error(`Unknown arguments ${args}`);
	}

	isSolidByIndex(index) {
		return !(this.collision[index] - this.offset);
	}

	isSolidByCoords(x, y) {
		const index = this.level.definition.width * Math.floor(y) + Math.floor(x);
		return this.isSolidByIndex(index);
	}
}
