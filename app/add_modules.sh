#!/usr/bin/env bash

git rm -rf **/electron/dist/*
git add add_modules.sh
for d in */ ; do
    [ -L "${d%/}" ] && continue
    echo "$d"
	git add -f "$d"
	git rm -f *.DS_Store 2>/dev/null  || echo
	git commit -m "$d" --allow-empty
done