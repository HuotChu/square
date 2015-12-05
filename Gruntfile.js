/**
 * Created by Scott on 8/16/2015.
 */
module.exports = function(grunt) {
    // Project configuration.
    grunt.initConfig({
        // configuration for grunt tasks...
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            files: ['Gruntfile.js', 'lib/square.js']
        },
        uglify: {
            options: {
                mangle: true
            },
            square: {
                files: {
                    'lib/square.min.js': ['lib/square.js']
                }
            }
        }
    });
    // Load the plugin that provides the "jshint" task.
    grunt.loadNpmTasks('grunt-contrib-jshint');

    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.registerTask('default', ['jshint']);
};