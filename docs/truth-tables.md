
# Truth tables

The following truth tables help to better understand the outcome of the action based on the last identified tag, the type of commit used, and the release/prerelease mode.

## Generate a Release tag

``` yaml
with:
  tag-prefix: v
```

In this mode, the most recent tag found in the current git history with the selected prefix, and containing a valid semantic versioning format will be evaluated.

> [!CAUTION]
> **This tag must not be a prerelease**. Otherwise, it will be ignored.

| Tag found  | Release: patch | Release: minor | Release: major |
| ---------- | -------------- | -------------- | -------------- |
| **v0.1.0** | v0.1.1         |  v0.2.0        |  v0.2.0        |
| **v0.1.1** | v0.1.2         |  v0.2.0        |  v0.2.0        |
| **v1.0.0** | v1.0.1         |  v1.1.0        |  v2.0.0        |
| **v1.0.1** | v1.0.2         |  v1.1.0        |  v2.0.0        |
| **v1.1.0** | v1.1.1         |  v1.2.0        |  v2.0.0        |
| **v1.1.1** | v1.1.2         |  v1.2.0        |  v2.0.0        |

> [!IMPORTANT]
> According to this truth table, the action is not able to generate any `v1.0.0` tag by itself because this specific tag should [be manually created by the user if needed](/docs/action-behaviour-explained.md#general-availability).

## Generate a Prerelease tag

``` yaml
with:
  tag-prefix: v
  semver-prerelease: rc
```

In this mode, the most recent tag found in the current git history with the selected prefix and prerelease keyword, and containing a valid semantic versioning format will be evaluated.

> [!TIP]
> Each cell has the converted [semver release type](https://github.com/npm/node-semver/tree/main?tab=readme-ov-file#release_types) used by the action.

| Tag found       | Prerelease: patch        | Prerelease: minor        | Prerelease: major        |
| --------------- | ------------------------ | ------------------------ | ------------------------ |
| **v0.1.0-rc.0** | v0.1.0-rc.1 (prerelease) | v0.1.0-rc.1 (prerelease) | v0.1.0-rc.1 (prerelease) |
| **v0.1.0**      | v0.1.1-rc.0 (prepatch)   | v0.2.0-rc.0 (preminor)   | v0.2.0-rc.0 (preminor)   |
| **v0.1.1-rc.0** | v0.1.1-rc.1 (prerelease) | v0.2.0-rc.0 (preminor)   | v0.2.0-rc.0 (preminor)   |
| **v0.1.1**      | v0.1.2-rc.0 (prepatch)   | v0.2.0-rc.0 (preminor)   | v0.2.0-rc.0 (preminor)   |
| **v1.0.0-rc.0** | v1.0.0-rc.1 (prerelease) | v1.0.0-rc.1 (prerelease) | v1.0.0-rc.1 (prerelease) |
| **v1.0.0**      | v1.0.1-rc.0 (prepatch)   | v1.1.0-rc.0 (preminor)   | v2.0.0-rc.0 (premajor)   |
| **v1.0.1-rc.0** | v1.0.1-rc.1 (prerelease) | v1.1.0-rc.0 (preminor)   | v2.0.0-rc.0 (premajor)   |
| **v1.0.1**      | v1.0.2-rc.0 (prepatch)   | v1.1.0-rc.0 (preminor)   | v2.0.0-rc.0 (premajor)   |
| **v1.1.0-rc.0** | v1.1.0-rc.1 (prerelease) | v1.1.0-rc.1 (prerelease) | v2.0.0-rc.0 (premajor)   |
| **v1.1.0**      | v1.1.1-rc.0 (prepatch)   | v1.2.0-rc.0 (preminor)   | v2.0.0-rc.0 (premajor)   |
| **v1.1.1-rc.0** | v1.1.1-rc.1 (prerelease) | v1.2.0-rc.0 (preminor)   | v2.0.0-rc.0 (premajor)   |
| **v1.1.1**      | v1.1.2-rc.0 (prepatch)   | v1.2.0-rc.0 (preminor)   | v2.0.0-rc.0 (premajor)   |

> [!IMPORTANT]
> According to this truth table, the action is not able to generate any `v1.0.0` or `v1.0.0-rc.0` tag by itself because they should [be manually created by the user if needed](/docs/action-behaviour-explained.md#general-availability).
