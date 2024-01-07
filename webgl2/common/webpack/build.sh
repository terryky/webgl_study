#!/bin/sh
set -e
set -x

npm install
npm run webpack_release
