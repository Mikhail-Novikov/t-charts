'use strict';

import paths from "../paths";
import gulp from 'gulp';
import gulpLoadPlugins from 'gulp-load-plugins';

import {bs} from './server';

const gp = gulpLoadPlugins();

export default function js() {
  return gulp.src(paths.js.src, {base: `${paths.src}/js`})
    .pipe(gp.debug({title: "Asset task 'js'"}))
    .pipe(gulp.dest(paths.js.dest))
    .pipe(bs.stream({once: true}))
    .on('error', gp.notify.onError(function (err) {
    return {
      title: "Error task 'js'",
      message: err.message
    }
  }));
};