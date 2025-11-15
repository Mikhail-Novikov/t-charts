'use strict';

import paths from '../paths';
import pkg from '../../package';
import fs from 'fs';
import path from 'path';
import gulp from 'gulp';
import gulpLoadPlugins from 'gulp-load-plugins';
import combiner from 'stream-combiner2';
import * as emitty from 'emitty';
import {bs} from './server';

const gp = gulpLoadPlugins();
const emittyPug = emitty.setup(paths.src, 'pug');

function getCssFiles() {
  const allFiles = [];
  const scssDir = path.resolve(paths.src, 'scss');
  
  function scanDirectory(dir, relativePath = '') {
    const items = fs.readdirSync(dir);
    
    items.forEach((item) => {
      const itemPath = path.join(dir, item);
      const stat = fs.lstatSync(itemPath);
      
      if (stat.isDirectory()) {
        const newRelativePath = relativePath 
          ? `${relativePath}/${item}`
          : item;
        scanDirectory(itemPath, newRelativePath);
      } else if (stat.isFile() && path.extname(item) === '.scss') {
        const fileName = path.basename(item, '.scss');
        const cssPath = relativePath 
          ? `css/${relativePath}/${fileName}.css`
          : `css/${fileName}.css`;
        allFiles.push({
          path: cssPath,
          category: relativePath.startsWith('lib') ? 'lib' : 
                   relativePath.startsWith('blocks') ? 'blocks' : 'root',
          relativePath: relativePath
        });
      }
    });
  }
  
  scanDirectory(scssDir);
  
  // Сортируем и группируем: сначала lib, потом blocks, потом root
  const libFiles = allFiles.filter(f => f.category === 'lib').sort((a, b) => a.path.localeCompare(b.path));
  const blockFiles = allFiles.filter(f => f.category === 'blocks').sort((a, b) => a.path.localeCompare(b.path));
  const rootFiles = allFiles.filter(f => f.category === 'root').sort((a, b) => a.path.localeCompare(b.path));
  
  return [...libFiles, ...blockFiles, ...rootFiles].map(f => f.path);
}

function getJsFiles() {
  const allFiles = [];
  const jsDir = path.resolve(paths.src, 'js');
  
  function scanDirectory(dir, relativePath = '') {
    const items = fs.readdirSync(dir);
    
    items.forEach((item) => {
      const itemPath = path.join(dir, item);
      const stat = fs.lstatSync(itemPath);
      
      if (stat.isDirectory()) {
        const newRelativePath = relativePath 
          ? `${relativePath}/${item}`
          : item;
        scanDirectory(itemPath, newRelativePath);
      } else if (stat.isFile() && path.extname(item) === '.js') {
        const fileName = path.basename(item, '.js');
        const jsPath = relativePath 
          ? `js/${relativePath}/${fileName}.js`
          : `js/${fileName}.js`;
        allFiles.push({
          path: jsPath,
          fileName: fileName,
          category: relativePath.startsWith('blocks') ? 'blocks' : 'root',
          relativePath: relativePath
        });
      }
    });
  }
  
  scanDirectory(jsDir);
  
  // Сортируем в правильном порядке: lib.js, core-js.js, blocks/*.js, app.js
  const libFile = allFiles.find(f => f.fileName === 'lib');
  const coreFile = allFiles.find(f => f.fileName === 'core-js');
  const blockFiles = allFiles.filter(f => f.category === 'blocks').sort((a, b) => a.path.localeCompare(b.path));
  const appFile = allFiles.find(f => f.fileName === 'app');
  const otherRootFiles = allFiles.filter(f => f.category === 'root' && f.fileName !== 'lib' && f.fileName !== 'core-js' && f.fileName !== 'app').sort((a, b) => a.path.localeCompare(b.path));
  
  const result = [];
  if (libFile) result.push(libFile.path);
  if (coreFile) result.push(coreFile.path);
  result.push(...blockFiles.map(f => f.path));
  result.push(...otherRootFiles.map(f => f.path));
  if (appFile) result.push(appFile.path);
  
  return result;
}

export default function html() {
  const development = process.env.NODE_ENV !== 'production';
  const locals = {
    pkg,
    development,
    cssFiles: getCssFiles(),
    jsFiles: getJsFiles()
  };

  fs.readdirSync(`${paths.src}/data`).forEach((item) => {
    let filepath = path.resolve(`${paths.src}/data`, item),
      extname = path.extname(filepath);
    if (fs.lstatSync(filepath).isFile() && extname === '.json') {
      locals[path.basename(filepath, extname)] = JSON.parse(fs.readFileSync(filepath));
    }
  });

  return combiner.obj([
    gulp.src(paths.html.src),
    gp.if(global.watch && global.pugChangedFile !== undefined && path.extname(global.pugChangedFile) !== '.json', emittyPug.stream(global.pugChangedFile)),
    gp.pug({
      locals
    }),
    gp.prettify({indent_inner_html: true, indent_size: 2, unformatted: ['pre', 'code']}),
    gp.typograf({
      locale: ['ru', 'en-US'],
      htmlEntity: {type: 'default'},
      safeTags: [
        ['<\\?php', '\\?>'],
        ['<textarea>', '</textarea>']
      ]
    }),
    gp.debug({title: "Asset task 'html'"}),
    gulp.dest(paths.html.dest),
    bs.stream({once: true})
  ]).on('error', gp.notify.onError(function (err) {
    return {
      title: "Error task 'html'",
      message: err.message
    }
  }));
};