const webpack = require('webpack');
const path = require('path');
const BrowserSyncPlugin = require('browser-sync-webpack-plugin');

module.exports = {
    entry: './src/Game.js',
    output: {
        path: path.resolve(__dirname, 'dist/js'),
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
                        presets: ['env'],
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
        new webpack.HotModuleReplacementPlugin(), // Enable HMR
        new webpack.NamedModulesPlugin(),
        new webpack.DefinePlugin({
            __DEV__: true,
        }),
    ],
    devServer: {
        hot: true, // Tell the dev-server we're using HMR
        contentBase: path.resolve(__dirname, 'dist'),
        publicPath: '/game/',
    },
    watch: true,
    devtool: 'cheap-module-source-map',
};