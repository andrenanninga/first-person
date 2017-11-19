import * as THREE from 'three';
import { find } from 'lodash';

import { CATEGORY } from '../Physics';
import Shaman from './Shaman';

const ACTIVE_COLOR = '#ff00ff';
const COOLDOWN_COLOR = '#990099';

export default class Trigger extends THREE.Mesh {
	constructor(game, level, definition) {
		super(
			new THREE.BoxGeometry(definition.width, 1, definition.height),
			new THREE.MeshBasicMaterial({ color: ACTIVE_COLOR, wireframe: true })
		);

		this.game = game;
		this.level = level;
		this.definition = definition;
		this.visible = __DEV__;
		this.name = definition.name;
		this.cooldown = 0;

		this.width = definition.width;
		this.height = definition.height;

		this.position.x = definition.x + definition.width / 2;
		this.position.y = 0.5;
		this.position.z = definition.y + definition.height / 2;

		let mask = 0;
		mask += (definition.properties.monsterTrigger && CATEGORY.MONSTER);
		mask += (definition.properties.playerTrigger && CATEGORY.PLAYER);

		this.body = this.game.physics.addEntity(this, {
			isStatic: true,
			isSensor: true,
			collisionFilter: { mask },
			render: {
				fillStyle: 'transparent',
				strokeStyle: ACTIVE_COLOR,
				lineWidth: 1
			}
		});
		
		this.body.onCollideActive(this.trigger);
	}

	update(delta) {
		this.cooldown = Math.max(this.cooldown - delta, 0);

		if (__DEV__) {
			this.body.render.strokeStyle = this.cooldown > 0 ? COOLDOWN_COLOR : ACTIVE_COLOR;
			this.material.color = new THREE.Color(this.cooldown > 0 ? COOLDOWN_COLOR : ACTIVE_COLOR);
			this.material.needsUpdate = true;
		}
	}

	trigger = (event) => {
		if (this.cooldown > 0) {
			return;
		}

		this.cooldown = this.definition.properties.repeat || Number.MAX_SAFE_INTEGER;

		if (!!this.definition.properties.spawn && this.definition.properties.spawn.length > 0) {
			const entities = find(this.level.definition.layers, { name: 'entities' }).objects;

			const spawns = JSON.parse(this.definition.properties.spawn);

			spawns.forEach(spawn => {
				const entity = find(entities, { name: spawn.name });

				if (entity) {
					setTimeout(() => {
						this.level.entities.add(new Shaman(this.game, this.level, entity));
					}, spawn.delay);
				}
			});
		}
	}
}