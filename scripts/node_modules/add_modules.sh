#!/usr/bin/env bash

git rm -rf electron/dist/*

for d in */ ; do
    [ -L "${d%/}" ] && continue
    echo "$d"
	git add -f "$d" && git reset **.DS_Store && git commit -m "$d"
done