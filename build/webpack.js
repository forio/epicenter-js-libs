'use strict';
var webpack = require('webpack');
var path = require('path');

var uglifyOptions = {
    mangle: false,
    warnings: true,
    sourceMap: true,
    compress: {
        screw_ie8: true,
        join_vars: false
    }
};

module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-webpack');

    var version = grunt.file.readJSON('package.json').version;
    var banner = '';

    var babelloader = { 
        test: /\.js$/, 
        exclude: /node_modules\/(?!(autotrack|dom-utils))/,
        loader: 'babel-loader',
        options: {
            plugins: [
                // 'transform-es2015-modules-commonjs',
                'transform-es2015-destructuring',
                'transform-es2015-block-scoping',
                'transform-es2015-computed-properties',
                'babel-plugin-transform-es2015-arrow-functions',
                'babel-plugin-transform-es2015-classes',
                'babel-plugin-transform-es2015-template-literals',
            ]
        }
    };
    grunt.config.set('webpack', {
        options: {
            stats: 'errors-only',
            node: false,
            plugins: [
                new webpack.DefinePlugin({
                    RELEASE_VERSION: JSON.stringify(version)
                })
            ],
            resolve: {
                modules: [__dirname + '/../src', 'node_modules']
            },
            externals: {
                jquery: 'jQuery',
            }
        },
        edge: {
            entry: path.resolve('./src/app.js'),
            output: {
                path: path.resolve('./dist/'),
                pathinfo: true,
                filename: 'epicenter-edge.js',
                library: 'F',
                libraryTarget: 'var'
            },
            module: {
                rules: [] //meant for testing in a new browser so no babel transpiling required
            },
            plugins: [],
            devtool: 'cheap-module-source-map',

            // devtool: 'eval'
        },
        mapped: {
            entry: path.resolve('./src/app.js'),
            output: {
                path: path.resolve('./dist/'),
                filename: 'epicenter.js',
                library: 'F',
                libraryTarget: 'var'
            },
            module: {
                rules: [babelloader]
            },
            plugins: [
                new webpack.DefinePlugin({
                    RELEASE_VERSION: JSON.stringify(version)
                }),
                new webpack.BannerPlugin({
                    banner: banner,
                    entryOnly: true
                }),
            ],
            devtool: 'source-map',
        },
        min: {
            entry: path.resolve('./src/app.js'),
            output: {
                path: path.resolve('./dist/'),
                filename: 'epicenter.min.js',
                library: 'F',
                libraryTarget: 'var'
            },
            module: {
                rules: [babelloader]
            },
            plugins: [
                new webpack.DefinePlugin({
                    RELEASE_VERSION: JSON.stringify(version)
                }),
                new webpack.BannerPlugin({
                    banner: banner,
                    entryOnly: true
                }),
                new webpack.optimize.UglifyJsPlugin(uglifyOptions),
            ],
            devtool: 'source-map',
        },
        components: {
            entry: path.resolve('./src/components/assignment/js/index.js'),
            devtool: 'source-map',
            output: {
                path: path.resolve('./dist/components/assignment'),
                filename: 'assignment.min.js'
            },
            plugins: [
                new webpack.DefinePlugin({
                    RELEASE_VERSION: JSON.stringify(version)
                }),
                new webpack.optimize.UglifyJsPlugin(uglifyOptions)
            ]
        }
    });
};
