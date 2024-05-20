# git-next-tag

[![CI](https://github.com/ldelarue/git-next-tag/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/ldelarue/git-next-tag/actions/workflows/ci.yml)

This tool generates a **new git tag** from those already in your project git history.

Tag calculation is based on **conventional commit** and **semantic versioning**.

## Motivation

I wanted a simple tool with very little configuration that would guarantee the consistency of the versions included the git tags of my projects.

I had not found a tool that do the followings tasks combined in an elegant way:

- Follows [conventional commit specifications](https://www.conventionalcommits.org/en/v1.0.0/#specification) with **the greatest assiduity**.
- Uses [semantic versioning](https://semver.org/) for **non-JavaScript** based projects.
- Manage project versioning and release cycle using Git as **source of truth**.
- Implements a CI **without a config file**, only via GitHub Actions and Git configuration.
- Can handle [ZeroVer](https://0ver.org/) and [SemVer](https://semver.org/#spec-item-4) with a **minimum of automation**.
- Manages an opinionated logic on SemVer **prerelease increments**.

Maybe it does exist. If in doubt, give this project a try. 😉

## Prerequisites

- The current branch using the Action **MUST** have a linear git history.
- Before the first start, it is necessary to add a version tag in the git-history consistent with the action configuration.

Example of command to create a git tag on the first commit of a project:

``` bash
git switch main
git tag v0.0.0 $(git rev-list --max-parents=0 HEAD)
git push origin v0.0.0
```

## Usage

- This action needs to retrieve the entire git history of the project using to `actions/checkout`.
- `contents: read` permission is required to access the repository content in order to retrieve git-related information (commits, tags, etc).

Here's an example configuration:

``` yml
jobs:  
  get-new-tag:
    runs-on: ['ubuntu-latest']
    timeout-minutes: 5

    permissions:
      contents: read

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - id: calculate_next_version
        uses: ldelarue/git-next-tag@v0
        with:
          tag-prefix: v

      - shell: bash
        run: |
          echo "::notice::Generated tag is '${{ steps.calculate_next_version.outputs.tag }}'"
```

> [!TIP]
> Please read [action.yml](/action.yml) for more details on parameters and output values.

In this example:

- My only tag in my git history is `v0.0.0`.
- I pushed a commit named `feat: this is an example` that triggered this job.

So the resulted tag is `v0.1.0`.

Give it a try! And see what your Action prints in its logs! 🚀

## More examples and tutorials

- It is highly recommended to read at least once the [Conventional Commits](https://www.conventionalcommits.org/) and [Semantic Versioning](https://semver.org/) specifications to better understand version incrementation behavior.
- [A tutorial on action behavior](/docs/action-behaviour-explained.md) is available with examples and scenarios.
- [Correspondence tables](docs/truth-tables.md) are available to help you visualize the format of the generated tags.

## Contributions

Please read the [dedicated file](/CONTRIBUTING.md) for setup and project management.

Thanks for your interest! 👍
