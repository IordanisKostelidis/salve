#!/bin/bash

VERSION=$1

npm install
./node_modules/gulp/bin/gulp.js test
./node_modules/gulp/bin/gulp.js

tar -czvf salve-ds-${VERSION}.tar.gz ./build/dist/
