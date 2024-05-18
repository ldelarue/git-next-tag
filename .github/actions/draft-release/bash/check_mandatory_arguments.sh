#!/bin/bash

set -eo pipefail

help_command () {
    echo "Usage: $(basename "$0") [argument_type] [arg1=val1] [...]"
}

if [ $# -eq 0 ]; then
    help_command
fi

exit_code=0
power_of_two=1

argument_type="$1"
for arg in "${@:2}"
do
    key="${arg%=*}"
    value="${arg#*=}"

    if [ -z "${value}" ]; then 
        echo "::error ::Missing mandatory $argument_type: $key"
        exit_code=$((exit_code + power_of_two))
    fi

    power_of_two=$((power_of_two * 2))
done
exit $exit_code
