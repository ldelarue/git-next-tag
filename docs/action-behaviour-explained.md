# Action behaviour explained

In this tutorial, we'll review the various behaviors of the action, using case studies and the application of [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/#specification) coupled with [semantic versioning](https://semver.org/#semantic-versioning-specification-semver) specifications.

The aim is to gain a better understanding of the strengths of this action in order to better manage the versioning of applications and projects.

> [!IMPORTANT]
> It is preferable to have first consulted the documentation indicated in the project's [README.md](/README.md#prerequisites).

## General Behaviour

- The action retrieves all commits for a given reference (or commit sha) to a tag detected in the git history.
- The tag must be in `<prefix><semver>` format.
  - If the action does not have the `semver-prerelease` entry, the `<semver>` part must not contain a prerelease part.
  - If the action has the `prerelease` entry, the `<semver>` part can contain a prerelease part.
  - `semver build` part is completely ignored and optional. So it can be put on any valid tag without any impact on the calculation.
  - If a tag does not respect this format, it is ignored.
  - Only the most recent tag in the git history is retrieved for calculation. If several tags are found, the largest SemVer will be selected, and the others ignored.
  - If no valid tag is found, the action fails.
- Commits between the tag found and the reference are selected.
  - If the commit does not follow conventional commit specifications, it will be ignored.
  - All commits are analyzed as a whole to generate a new SemVer increment.
  - If detected tag has a **Major** version equal 0, increment on major is redirected to minor instead.

## General Availability

To clarify the general availability (GA) of a project, the `<semver>` reaches `1.0.0`.  

This step **is not based on the state of the project's commits**. It is therefore theoretically impossible to automatically define this specific version upgrade while respecting [the above-mentioned specifications](#general-behaviour). In order to perform this step, a manual action by the user is required.

Here's an example command to create such a tag:

``` bash
git switch main
git tag v1.0.0
git push origin v1.0.0
```

Afterwards, the action will be able to take over and continue tag generation.

## Case studies

### Simple case

``` mermaid
%%{init: { 'logLevel': 'debug', 'theme': 'default' , 'themeVariables': {
  'gitInv0': '#954eca',
  'git0': '#7030a1'
} } }%%
gitGraph LR:
    commit id: "bc5a8e6"
    commit id: "5df2ba7" tag: "v3.1.3"
    commit id: "fix: toilet flush"
    commit id: "feat: paint door"
    commit id: "feat: new bonzai"
    commit id: "fix: oven was broken"
```

In this scenario, version tags has a `tag-prefix` value of `v`.

Between the existing `v3.1.3` tag and the `HEAD`, there are the following commits:

``` text
2a26b9e - "fix: toilet flush"
1685128 - "feat: paint door"
af657d5 - "feat: new bonzai"
cb3ba0c - "fix: oven was broken" <~ HEAD
```

We want to try two solutions: use the action for all commits in succession, and on the `HEAD` commit separately, and compare the differences.

#### Successive calculations

We decide to calculate versions for each commits between `v3.1.3` and `HEAD`:

- Commits containing the keyword `feat` increment **MINOR** version number.
- Commits containing the keyword `fix` increment **PATCH** version number.  
- Thus, `steps.run_action.outputs.tag` gives `v3.3.1`.

``` mermaid
%%{init: { 'logLevel': 'debug', 'theme': 'default' , 'themeVariables': {
  'gitInv0': '#954eca',
  'git0': '#7030a1'
} } }%%
gitGraph LR:
    commit id: "bc5a8e6"
    commit id: "5df2ba7" tag: "v3.1.3"
    commit id: "fix: toilet flush" tag: "v3.1.4" type: HIGHLIGHT
    commit id: "feat: paint door" tag: "v3.2.0" type: HIGHLIGHT
    commit id: "feat: new bonzai" tag: "v3.3.0" type: HIGHLIGHT
    commit id: "fix: oven was broken" tag: "v3.3.1" type: HIGHLIGHT
```

---

#### Commit grouping

We decide to calculate the version between `v3.1.3` and `HEAD`:

- All these commits together increment **MINOR** version, because only `feat` commit type is relevent and is applied once.
- Thus, `steps.run_action.outputs.tag` gives `v3.2.0`.

``` mermaid
%%{init: { 'logLevel': 'debug', 'theme': 'default' , 'themeVariables': {
  'gitInv0': '#954eca',
  'git0': '#7030a1'
} } }%%
gitGraph LR:
    commit id: "bc5a8e6"
    commit id: "5df2ba7" tag: "v3.1.3"
    commit id: "fix: toilet flush"
    commit id: "feat: paint door"
    commit id: "feat: new bonzai"
    commit id: "fix: oven was broken" tag: "v3.2.0" type: HIGHLIGHT
```

> [!NOTE]
> Depending on how the tags are calculated, the result is different. The commit targeted by `HEAD` does not have the same tag between the two scenarios.

---

### Multiple tag formats on the same branch

``` mermaid
%%{init: { 'logLevel': 'debug', 'theme': 'default' , 'themeVariables': {
  'gitInv0': '#40a7c1',
  'git0': '#3087a1'
} } }%%
gitGraph LR:
    commit id: "2f92776"
    commit id: "8f75fac" tag: "v2.0.6 ; v2.4.2"
    commit id: "feat: potato in fridge"
    commit id: "fix: cleaning potatoes" tag: "v2"
    commit id: "fix: tomato color" tag: "v2.4.3-rc"
    commit id: "fix: refill water tank"
    commit id: "feat: new honey pot" tag: "version-1.5.6"
    commit id: "feat: new coffee machine"
    commit id: "fix: remove junk food" tag: "v2.5.0" type: HIGHLIGHT
```

In this scenario, version tags has a `tag-prefix` value of `v` without any extra configuration.

Between the existing `v2.0.6` tag and the `HEAD`, there are the following commits:

``` text
5a068e4 - "feat: potato in fridge"
af6bf38 - "fix: cleaning potatoes"
6788add - "fix: tomato color"
b3b3a0d - "fix: refill water tank"
f75faca - "feat: new honey pot"
a3f368f - "feat: new coffee machine"
1b00078 - "fix: remove junk food" <~ HEAD
```

Several observation points from the `HEAD` to commit `8f75fac`:

- Tag `version-1.5.6` is valid, but has a `tag-prefix` value of `version-`, and not `v`. It is ignored because of the action configuration.
- Tag `v2.4.3-rc` is valid, but has a prerelease part. It is ignored because of the action configuration. More details in the ["prerelease mode" section](#prerelease-mode).
- Tag `v2` is ignored by design because it does not follow the `<prefix><semver>` format.
- Commit `8f75fac` has two valid tags `v2.0.6` and `v2.4.2`. So the biggest SemVer will be selected for the next tag calculation (i.e `v2.4.2`).

> [!NOTE]
> In conclusion, the next calculated tag for commit `1b00078` would be `v2.5.0`.

---

### Breaking changes

#### when SemVer is "1.y.z"

``` mermaid
%%{init: { 'logLevel': 'debug', 'theme': 'default' , 'themeVariables': {  
  'gitInv0': '#40c183',
  'git0': '#30a163'
} } }%%
gitGraph LR:
    commit id: "553474f"
    commit id: "3596e30" tag: "v1.2.3"
    commit id: "feat!: replace car by bike"
    commit id: "fix: buy a bike helmet" tag: "v2.0.0" type: HIGHLIGHT
```

Following the [conventional commit specifications (11, 12, 13, 15 and 16)](https://www.conventionalcommits.org/en/v1.0.0/#specification), any **MAJOR** release is instancied because of the `!` in the commit title, or the use of `BREAKING CHANGE / BREAKING-CHANGE` in the commit footer.

> [!NOTE]
> In our example, because of a commit with a title `feat!: replace car by bike`, the resulted tag on `HEAD` would be `v2.0.0`

---

#### Using ZeroVer

``` mermaid
%%{init: { 'logLevel': 'debug', 'theme': 'default' , 'themeVariables': {  
  'gitInv0': '#a3507e',
  'git0': '#a1306e'
} } }%%
gitGraph LR:
    commit id: "553474f"
    commit id: "3596e30" tag: "v0.2.3"
    commit id: "feat!: replace car by bike"
    commit id: "fix: buy a bike helmet" tag: "v0.3.0" type: HIGHLIGHT
```

In this example, we are using the same git branch as before, but we have updated the **MAJOR** number to `0`.

Following the [SemVer specification n°4](https://semver.org/#spec-item-4), there is no standard way to describe a breaking change. So things [can be wild](https://softwareengineering.stackexchange.com/a/440593).

This action try to follow the [ZeroVer](https://0ver.org/) *weak* specs insead. A new specification related to our commit version control is defined as follows:
> When major version is zero (0.y.z), major version increment MUST NOT be possible. API breaking changes SHOULD result to a minor increment instead.

This mean that, if necessary, a tag would be manually created with a **MAJOR** number equal to `1`, symbolizing the [general availability (GA) of the project](#general-availability).

> [!NOTE]
> In our example, because of commit title `feat!: replace car by bike` and following our new spec, the resulted tag on `HEAD` would be `v0.3.0`

### Prerelease mode

``` mermaid
%%{init: { 'logLevel': 'debug', 'theme': 'default' , 'themeVariables': {  
  'gitInv0': '#c6bc39',
  'git0': '#d1ca61'
} } }%%
gitGraph LR:
    commit id: "553474f"
    commit id: "3596e30" tag: "v1.2.3"
    commit id: "fix: broken function"
    commit id: "fix: issues in class" tag: "v1.2.4-rc.0"
    commit id: "fix: wrong env vars"
    commit id: "fix: mistakes in method" type: HIGHLIGHT tag: "v1.2.4"
```

In this scenario, version tags has a `tag-prefix` value of `v` without any extra configuration.

Several observation points from the `HEAD` to commit `3596e30`:

- All commit types are `fix`, so the **PATCH** version number will increment.
- Tag `v1.2.4-rc.0` is valid, but is ignored because it has a prerelease part.

> [!NOTE]
> So the resulted tag on `HEAD` would be `v1.2.4`

---

``` mermaid
%%{init: { 'logLevel': 'debug', 'theme': 'default' , 'themeVariables': {  
  'gitInv0': '#d09362',
  'git0': '#ca864e'
} } }%%
gitGraph LR:
    commit id: "553474f"
    commit id: "3596e30" tag: "v1.2.3"
    commit id: "fix: broken function"
    commit id: "fix: issues in class" tag: "v1.2.4-rc.0"
    commit id: "fix: wrong env vars"
    commit id: "fix: mistakes in method" type: HIGHLIGHT tag: "v1.2.4-rc.1"
```

In this example, we are using the same git branch as before, but we added in the confugration a prerelease value of `rc`.

This action has a different behaviour if `semver-prerelease` input is set. It will generate a prerelease tag based on the last prerelease tag found. Please read [the dedicated section](/docs/truth-tables.md) for more context.

> [!NOTE]
> So the last detected tag is `v1.2.4-rc.0`, and the resulted tag on `HEAD` would be `v1.2.4-rc.1`
