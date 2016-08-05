#!/bin/bash
set -e

if [ "$TRAVIS_REPO_SLUG" != "archiverjs/node-archiver" ] || [ "$TRAVIS_PULL_REQUEST" == "true" ]; then
  exit 0
fi

if [ "$TRAVIS_BRANCH" != "master" ] || [ "$TRAVIS_NODE_VERSION" != "4" ]; then
  exit 0
fi

if [ -z "$GH_REPO" ]; then
  echo "ENV:GH_REPO:MISSING"
  exit 1
fi

if [ -z "$GH_SECRET_TOKEN" ]; then
  echo "ENV:GH_SECRET_TOKEN:MISSING"
  exit 1
fi

if [ -z "$GH_USER_EMAIL" ]; then
  GH_USER_EMAIL="travis@travis-ci.org"
fi

if [ -z "$GH_USER_NAME" ]; then
  GH_USER_NAME="travis-ci"
fi

if [ -z "$GH_REPO_BRANCH" ]; then
  GH_REPO_BRANCH="master"
fi

if [ -z "$GH_REPO_DOCSDIR" ]; then
  GH_REPO_BRANCH="docs"
fi

if [ -z "$GH_REPO_TMPNAME" ]; then
  GH_REPO_TMPNAME="jsdoc-deploy"
fi

GH_REPO_TMPNAME_STAGED="${GH_REPO_TMPNAME}-staging"

echo -e "Running jsdoc...\n"
npm run-script jsdoc
cp -R tmp/jsdoc $HOME/$GH_REPO_TMPNAME_STAGED

echo -e "Publishing jsdoc...\n"

cd $HOME

git config --global user.email $GH_USER_EMAIL
git config --global user.name $GH_USER_NAME
git clone --quiet --branch=${GH_REPO_BRANCH} https://${GH_SECRET_TOKEN}@${GH_REPO} ${GH_REPO_TMPNAME} > /dev/null

cd $GH_REPO_TMPNAME
git rm -rf ./$GH_REPO_DOCSDIR
cp -Rf $HOME/$GH_REPO_TMPNAME_STAGED ./$GH_REPO_DOCSDIR
git add -f .
git commit -m "deploy(jsdocs): $TRAVIS_REPO_SLUG travis build $TRAVIS_BUILD_NUMBER."
git push -fq origin $GH_REPO_BRANCH > /dev/null

echo -e "Published jsdocs.\n"

