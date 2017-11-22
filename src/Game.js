import * as THREE from 'three';
import Stats from 'stats.js';
import OrbitControls from 'orbit-controls-es6';

import Physics from './Physics'
import Level from './Level';

// Initial HMR Setup
if (module.hot) {

	module.hot.dispose(() => {
		const canvas = document.querySelector('canvas');
		
		if (canvas) {
			canvas.remove();
		}

		if (window.game) {
			window.game.renderer.forceContextLoss();
			window.game.renderer.context = null;
			window.game.renderer.domElement = null;
			window.game.renderer = null;
			cancelAnimationFrame(window.game.animationFrame);
			removeEventListener('resize', window.game.resize);
			removeEventListener('keydown', window.game.keyDown);
			removeEventListener('keyup', window.game.keyUp);
			removeEventListener('mousemove', window.game.mouseMove);
			removeEventListener('click', window.game.click);
			document.removeEventListener('pointerlockchange', window.game.pointerLockChange);
			document.removeEventListener('mozpointerlockchange', window.game.pointerLockChange);
			document.removeEventListener('webkitpointerlockchange', window.game.pointerLockChange);
		}
	});
}

const stats = new Stats();
document.body.appendChild(stats.dom);

class Game {
	constructor() {
		this.scene = new THREE.Scene();
		
		const aspect = window.innerWidth / window.innerHeight;
		this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000000);
		this.camera.position.x = 0;
		this.camera.position.y = 20;
		this.camera.position.z = 0;

		this.keys = {};
		this.clock = new THREE.Clock(true);

		this.hasPointerLock = false;
		this.isLoading = true;

		this.debug = {
			followPlayer: false,
		};

		this.loader = new THREE.LoadingManager();
		this.loader.onProgress = (_, loaded, total) => console.log(`loaded ${loaded} of ${total}`);
		this.loader.onLoad = () => {
			this.level.create();

			this.player = this.level.getObjectByName('player');
			this.isLoading = false;

			if (__DEV__) {
				this.camera.position.copy(this.player.position.clone().setY(10));
				this.controls.target = this.player.position.clone();
				this.controls.update();
				console.log(this.controls);
			}
		};
		
		this.renderer = new THREE.WebGLRenderer({ antialias: true });
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.setClearColor(0xeeeeee);


		if (__DEV__) {
			this.controls = new OrbitControls(this.camera);
			this.controls.enableKeys = false;
			this.scene.add(new THREE.AxesHelper(1));
		}

		this.physics = new Physics(this);
		this.level = new Level(this, Level.CAVE);

		this.scene.add(this.level);
		this.player = this.level.getObjectByName('player');

		document.body.appendChild(this.renderer.domElement);
		addEventListener('resize', this.resize);
		addEventListener('keydown', this.keyDown);
		addEventListener('keyup', this.keyUp);
		addEventListener('mousemove', this.mouseMove);
		addEventListener('click', this.click);
		document.addEventListener('pointerlockchange', this.pointerLockChange);
		document.addEventListener('mozpointerlockchange', this.pointerLockChange);
		document.addEventListener('webkitpointerlockchange', this.pointerLockChange);

		this.update();
	}

	update = () => {
		stats.begin();
		const delta = this.clock.getDelta();

		if (this.isLoading) {
			stats.end();
			this.animationFrame = requestAnimationFrame(this.update);

			return;
		}

		this.physics.update(delta);
		this.level.update(delta);
		
		if (__DEV__) {
			const half = window.innerWidth / 2;
			this.camera.aspect = half / 320;
			this.camera.updateProjectionMatrix();

			if (this.debug.followPlayer) {
				this.camera.position.copy(this.player.position.clone().setY(10));
				this.controls.target = this.player.position.clone();
			}

			this.renderer.setViewport(half, window.innerHeight - 320, half, 320);
			this.renderer.setScissor(half, window.innerHeight - 320, half, 320);
			this.renderer.setScissorTest(true);
			this.renderer.render(this.scene, this.camera);
		}

		this.player.render();

		stats.end();
		this.animationFrame = requestAnimationFrame(this.update);
	}

	resize = () => {
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(window.innerWidth, window.innerHeight);
	}

	keyDown = (e) => {
		this.keys[e.keyCode] = true;

		if (e.keyCode === 192) {
			this.debug.followPlayer = !this.debug.followPlayer;
		}
	}

	keyUp = (e) => {
		this.keys[e.keyCode] = false;
	}

	mouseMove = (e) => {
		if (this.hasPointerLock) {
			this.player.rotation.y -= e.movementX * 0.006;
		}
	}

	click = (e) => {
		if (!this.hasPointerLock) {
			const element = this.renderer.domElement;
			element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
			element.requestPointerLock();
		}

		console.log(e);
	}

	pointerLockChange = (e) => {
		this.hasPointerLock = !!document.pointerLockElement;
	}
}

window.game = new Game();
window.THREE = THREE;
