const gulp = require('gulp');
const nodemon = require('gulp-nodemon');

/*
  npm i -g gulp
  gulp db:load --from fixtures/users
*/

process.on('uncaughtException', function(err) {
  console.error(err.message, err.stack, err.errors);
  process.exit(255);
});

// nodemon index.js
gulp.task('nodemon', () => {
  nodemon({
    execMap: {
      js: 'node'
    },
    script: 'index.js'
  });
});

gulp.task('db:load', require('./tasks/dbLoad'));
