const HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const webpack = require('webpack');
const dotenv = require('dotenv');

module.exports = (env, argv) => {
    // call dotenv and it will return an Object with a parsed key
    const dot = dotenv.config().parsed;

    // reduce it to a nice object, the same as before
    const envKeys = Object.keys(dot).reduce((prev, next) => {
        prev[`process.env.${next}`] = JSON.stringify(dot[next]);
        return prev;
    }, {});

    return {
        mode: argv.mode === 'production' ? 'production' : 'development',

        // This is necessary because Figma's 'eval' works differently than normal eval
        devtool: argv.mode === 'production' ? false : 'inline-source-map',

        entry: {
            ui: './src/app/index.tsx', // The entry point for your UI code
            code: './src/plugin/controller.ts', // The entry point for your plugin code
        },

        module: {
            rules: [
                // Converts TypeScript code to JavaScript
                {test: /\.tsx?$/, use: 'ts-loader', exclude: /node_modules/},

                // Enables including CSS by doing "import './file.css'" in your TypeScript code
                {test: /\.css$/, loader: [{loader: 'style-loader'}, {loader: 'css-loader'}]},

                // Allows you to use "<%= require('./file.svg') %>" in your HTML code to get a data URI
                {test: /\.(png|jpg|gif|webp|svg)$/, loader: [{loader: 'url-loader'}]},
            ],
        },

        // Webpack tries these extensions for you if you omit the extension like "import './file'"
        resolve: {extensions: ['.tsx', '.ts', '.jsx', '.js']},

        output: {
            filename: '[name].js',
            path: path.resolve(__dirname, 'dist'), // Compile into a folder called "dist"
        },

        // Tells Webpack to generate "ui.html" and to inline "ui.ts" into it
        plugins: [
            new HtmlWebpackPlugin({
                template: './src/app/index.html',
                filename: 'ui.html',
                inlineSource: '.(js)$',
                chunks: ['ui'],
            }),
            new HtmlWebpackInlineSourcePlugin(),
            new webpack.DefinePlugin(envKeys),
        ],
    };
};
