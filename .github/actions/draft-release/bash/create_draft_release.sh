#!/bin/bash

set -eo pipefail

help_command () {
    echo "Usage: $(basename "$0") [tag] [old_tag] [branch] [as_prerelease] [repository]"
}

make_command () {
    if [ -n "$old_tag" ]; then
        arg_notes_start_tag=(--notes-start-tag "$old_tag")
    fi
    if [ -n "$branch" ]; then
        arg_target=(--target "$branch")
    fi
    if [ -n "$as_prerelease" ]; then
        if [ "$as_prerelease" == 'true' ]; then
            arg_prerelease=(--prerelease)
        fi
    fi
}

draft_release_deleter () {
    # Find if a draft release exists on a specified branch. Delete it if found.
    release_uri="https://api.github.com/repos/$repository/releases"

    next_paginate_url=$release_uri
    while [ -n "$next_paginate_url" ]; do
        # https://docs.github.com/fr/rest/using-the-rest-api/using-pagination-in-the-rest-api
        response=$(gh api -i "$next_paginate_url")
        response_body=$(tail -1 <<< "$response")

        next_paginate_url=$(
            grep 'Link:' <<< "$response" |
            grep 'next' |
            sed -E 's/.*<(.*)>; rel="next".*/\1/' || 
            echo ''
        )

        release_data_json=$(jq \
            --arg OLD_TAG "$old_tag" \
            --argjson AS_PRERELEASE "$as_prerelease" \
            --arg TARGET "$branch" \
            '[.[] | select(((.target_commitish==$TARGET) and (.prerelease==$AS_PRERELEASE)) or (.tag_name == $OLD_TAG))] | first | {id :.id, draft: .draft}' \
        <<< "$response_body")

        release_id=$(jq -r '.id // ""' <<< "$release_data_json")
        if [ -n "$release_id" ]; then
            break
        fi
    done

    if [ "$(jq -r '.draft' <<< "$release_data_json")" == 'true' ]; then
        gh api \
            --method DELETE \
            "$release_uri/$release_id"
    fi
}

create_release () {
    tag_url=$(gh release create --draft "$tag" \
        --generate-notes \
        --repo "$repository" \
        "${arg_notes_start_tag[@]}" \
        "${arg_target[@]}" \
        "${arg_prerelease[@]}"
    )

    release_tag_ref=$(sed -r 's/.*\/(.+)$/\1/' <<< "$tag_url")
}

main () {
    if [ $# -eq 0 ]; then
        help_command 
        return 0
    fi

    readonly tag=$1
    readonly old_tag=$2
    readonly branch=$3
    readonly as_prerelease=$4
    readonly repository=$5

    make_command
    draft_release_deleter
    create_release

    echo "release-tag-ref=$release_tag_ref" >> "$GITHUB_OUTPUT"
}

main "$@"
