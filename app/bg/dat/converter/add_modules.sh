#!/usr/bin/env bash
## git rm -rf node_modules/electron/dist/* || echo
install  ./add_modules.sh ../app/
install  ./add_modules.sh ../app/bg/dat/converter/

git add ./add_modules.sh
git add ../app/add_modules.sh
git add ../app/bg/dat/converter/add_modules.sh

loop (){
for d in */ ; do
    [ -L "${d%/}" ] && continue
    echo "$d"
	git add -f "$d" && git reset **.DS_Store && git commit -m "$d:$(date +%s)" --allow-empty
done
}

loop
echo "pushd ../app && ./add_modules.sh && popd"
echo "pushd ../app/bg/dat/converter && ./add_modules.sh && popd"
