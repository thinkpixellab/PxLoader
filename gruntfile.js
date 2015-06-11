/*global module:false*/
module.exports = function(grunt) {

    var BANNER_TEMPLATE = '/*! <%= pkg.title %> v<%= pkg.version %> | <%= pkg.homepage %> */\n';

    var srcFiles = [
        'PxLoader.js',
        'PxLoaderImage.js',
        'PxLoaderSound.js',
        'PxLoaderVideo.js',
        'PxLoaderData.js'
    ];

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            options: { banner: BANNER_TEMPLATE },
            all: {
                src: srcFiles,
                dest: 'dist/pxloader-all.js'
            },
            images: {
                src: [
                    'PxLoader.js',
                    'PxLoaderImage.js'
                ],
                dest: 'dist/pxloader-images.js'
            }
        },
        jshint: {
            files: ['gruntfile.js'].concat(srcFiles),
            options: {
                curly: true,
                eqeqeq: true,
                immed: true,
                latedef: true,
                newcap: true,
                noarg: true,
                sub: true,
                undef: true,
                boss: true,
                eqnull: true,
                browser: true,
                globals: {}
            }
        },
        watch: {
            cj: {
                files: ['<%= jshint.files %>'],
                tasks: ['jshint', 'concat', 'uglify']
            }
        },
        uglify: {
            options: { banner: BANNER_TEMPLATE },
            all: {
                src: ['<%= concat.all.dest %>'],
                dest: 'dist/pxloader-all.min.js'
            },
            images: {
                src: ['<%= concat.images.dest %>'],
                dest: 'dist/pxloader-images.min.js'
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');

    grunt.registerTask('default', ['jshint', 'concat', 'uglify']);

};
