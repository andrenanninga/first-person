import * as THREE from 'three';
import { find } from 'lodash';

import lights from '../assets/sprites/lights/lights';

export default class Lightmap {
	constructor(level) {
		this.level = level;
		this.lighting = find(level.definition.layers, { name: 'lighting' }).data;

		const tileset = find(level.definition.tilesets, ({ source }) => source.includes('lights.tsx'));
		this.offset = tileset.firstgid;

		this.colors = this.lighting.map(light => new THREE.Color(lights[light - this.offset] || 0xff00ff));
	}

	getLight(...args) {
		if (args.length === 1) {
			return this.getLightByIndex(args[0]);
		}
		else if (args.length === 2) {
			return this.getLightByCoords(args[0], args[1]);
		}

		throw new Error(`Unknown arguments ${args}`);
	}

	getLightByIndex(index) {
		return this.colors[index];
	}

	getLightByCoords(x, y) {
		const index = this.level.definition.width * Math.floor(y) + Math.floor(x);
		return this.getLightByIndex(index);
	}
}
