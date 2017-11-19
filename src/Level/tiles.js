import * as THREE from 'three';

const requireImage = require.context('../assets/sprites', true, /\.png$/);

export default function getTiles(game, tsx) {
	const name = tsx.tileset.$.name;
	const tileCount = parseInt(tsx.tileset.$.tilecount, 10);
	const columns = parseInt(tsx.tileset.$.columns, 10);
	const rows = tileCount / columns;
	
	const file = tsx.tileset.image[0].$.source;
	const image = requireImage(`./${name}/${file}`);
	const texture = new THREE.TextureLoader(game.loader).load(image);
	texture.magFilter = THREE.NearestFilter;
	texture.minFilter = THREE.NearestMipMapLinearFilter;
	
	const materials = [];
	
	for (let i = 0; i < tileCount; i++) {
		const x = i % columns;
		const y = Math.floor(i / columns);
	
		const uv = new THREE.Vector2(x / columns, 1 - (y / rows) - (1 / rows));
		const size = new THREE.Vector2(1 / columns, 1 / rows);
	
		const material = new THREE.MeshBasicMaterial({
			map: texture.clone(),
			vertexColors: THREE.FaceColors,
		});
	
		material.map.needsUpdate = true;
		material.map.offset = uv;
		material.map.repeat = size;
	
		materials.push(material);
	}

	return materials;
}
