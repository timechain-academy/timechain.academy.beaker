#!/usr/bin/env bash

loop (){

git rm -rf node_modules/electron/dist/* || echo

for d in */ ; do
    [ -L "${d%/}" ] && continue
    echo "$d"
	## [ "$d" == "node_modules" ] && pushd $d && loop
	git add -f "$d" && git reset **.DS_Store && git commit -m "$d" -m "$(date +%s)" --allow-empty
done
## popd
}
loop