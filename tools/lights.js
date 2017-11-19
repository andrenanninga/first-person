const fs = require('fs');
const path = require('path');
const getPixels = require("get-pixels")

const input = path.join(__dirname, '../src/assets/sprites/lights.png');
const output = path.join(__dirname, '../src/assets/sprites/lights.json');

const TILE_SIZE = 16;

console.log(`Reading from ${input}`);
getPixels(input, (err, pixels) => {
	if (err) {
		throw err;
	}

	const colors = [];
	let index = 0;

	while (index < pixels.data.length) {
		const red = pixels.data[index] * 256 * 256;
		const green = pixels.data[index + 1] * 256;
		const blue = pixels.data[index + 2];
		const color = red + green + blue;

		const x = (index / pixels.shape[2]) % pixels.shape[0];
		const y = Math.floor(index / pixels.shape[2] / pixels.shape[0]);
		console.log({ x, y, color });

		colors.push(color);
		index += TILE_SIZE * pixels.shape[2];

		if (index % (TILE_SIZE * pixels.shape[2] * 16) === 0) {
			index += TILE_SIZE * TILE_SIZE * 15 * pixels.shape[2]
		}
	}

	console.log(colors.length);

	console.log(`Writing to ${output}`);
	fs.writeFile(output, JSON.stringify(colors), 'utf8', (err) => {
		if (err) {
			throw err;
		}
	});
});
