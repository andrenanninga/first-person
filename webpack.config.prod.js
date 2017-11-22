const webpack = require('webpack');
const path = require('path');
const BrowserSyncPlugin = require('browser-sync-webpack-plugin');

module.exports = {
	entry: './src/Game.js',
	output: {
		path: path.resolve(__dirname, 'dist/game'),
		publicPath: '/game/',
		filename: 'game.bundle.js'
	},
	module: {
		loaders: [
			{
				test: /\.js$/,
				exclude: /(node_modules|bower_components)/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: [['env', {
							'targets': {
								'browsers': ['last 2 versions', 'safari >= 7']
							},
						}]],
						plugins: ['transform-class-properties'],
						cacheDirectory: true,
					}
				},
			},
			{
				test: /\.(gif|png|jpe?g|svg)$/i,
				use: {
					loader: 'file-loader',
					options: {
						loader: 'image-webpack-loader',
						options: {
							bypassOnDebug: true,
						},
					},
				},
			},
			{
				test: /\.tsx$/i,
				use: {
					loader: 'xml-loader',
				},
			},
		],
	},
	plugins: [
		new webpack.LoaderOptionsPlugin({
						test: /.*/,
			options: {
				exclude: {
					test: [
					  /\.tmx$/,
					  /\.pyxel$/,
					  /\.png$/,
					],
				},
			},
		}),
		new webpack.NamedModulesPlugin(),
		new webpack.DefinePlugin({
			__DEV__: false
		}),
	],
	watch: false,
	devtool: 'cheap-module-source-map',
};