#!/bin/bash

set -eo pipefail

dist_need_to_be_transpiled=false

for filepath in $(git diff --cached --name-only); do
    if grep -qE "^^(src\/.*)|(package.*\.json)$" <<< "$filepath"; then
        dist_need_to_be_transpiled=true
        break
    fi
done

if $dist_need_to_be_transpiled; then
    cd "$(git rev-parse --show-toplevel)"
    npx ts-standard --fix --project tsconfig.json ./src/**/*.ts
    git add ./src
    npm run build
    git add ./dist
    git status
fi
