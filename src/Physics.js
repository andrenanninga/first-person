import Matter, { Engine, Render, Body, Bodies, World } from 'matter-js';
import * as THREE from 'three';

import { MatterCollisionEvents } from 'matter-collision-events';

export const SCALE = 32;
export const CATEGORY = {
	PLAYER: 0x0001,
	MONSTER: 0x0002,
	WALL: 0x0008,
};

export default class Physics {
	static SCALE = SCALE;
	static CATEGORY = CATEGORY;

	constructor(game) {
		this.game = game;

		console.log(MatterCollisionEvents);
		Matter.Plugin.register(MatterCollisionEvents);
		Matter.use('matter-collision-events');

		this.engine = Engine.create();
		this.engine.world.gravity = {
			x: 0,
			y: 0,
			scale: 0,
		};

		if (__DEV__) {
			this.renderer = Render.create({
				element: document.body,
				engine: this.engine,
				options: {
					width: window.innerWidth / 2,
					height: 320,
					wireframes: false,
					background: '#111'
				}
			});
	
			const aspect = __DEV__ ? 1.5 : window.innerWidth / window.innerHeight;
			this.renderer.canvas.style.position = 'absolute';
			this.renderer.canvas.style.bottom = '0px';
			this.renderer.canvas.style.left = '0px';
			this.renderer.canvas.style.width = '50%';
			this.renderer.canvas.style.height = '320px';

			this.renderer.options.showVelocity = true;
			this.renderer.options.showAngleIndicator = true;
	
			Render.run(this.renderer);
		}
	}

	update(delta) {
		Engine.update(this.engine, delta);

		// this.game.player.rotation.y = -this.body.angle;
		// this.game.player.position.x = this.body.position.x / SCALE;
		// this.game.player.position.z = this.body.position.y / SCALE;

		if (__DEV__) {
			Render.lookAt(this.renderer, this.game.player.body, { x: 5 * SCALE, y: 5 * SCALE }, true);
		}

		this.engine.world.bodies.forEach(body => {
			if (body.entity) {
				body.entity.position.x = body.position.x / SCALE;
				body.entity.position.z = body.position.y / SCALE;
			}
		})
	}

	addEntity(entity, options) {
		let body;

		if (entity.width && entity.height) {
			body = this.addRectangle(entity.position.x, entity.position.z, entity.width, entity.height, options);
		}
		else if (entity.radius) {
			body = this.addCircle(entity.position.x, entity.position.z, entity.radius, options);
		}
		else {
			throw new Error(`Unsure what kind of body to make for ${entity.name}`);
		}

		body.entity = entity;

		return body;
	}

	addCircle(x, y, radius, options) {
		const body = Bodies.circle(x * SCALE, y * SCALE, radius * SCALE, options);
		World.add(this.engine.world, body);

		return body;
	}

	addRectangle(x, y, width, height, options) {
		const body = Bodies.rectangle(x * SCALE, y * SCALE, width * SCALE, height * SCALE, options);
		World.add(this.engine.world, body);

		return body;
	}
}