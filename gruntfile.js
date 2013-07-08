/*global module:false*/
module.exports = function(grunt) {

    var srcFiles = [
        'PxLoader.js',
        'PxLoaderImage.js',
        'PxLoaderSound.js',
        'PxLoaderVideo.js'
    ];

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            dist: {
                src: ['<banner>'].concat(srcFiles),
                dest: '<%= pkg.name %>.js'
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
            options: {
                banner: '/*! <%= pkg.title %> | <%= pkg.homepage %> | <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            dist: {
                src: ['<%= concat.dist.dest %>'],
                dest: '<%= pkg.name %>.min.js'
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
