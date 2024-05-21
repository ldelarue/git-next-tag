import { getTags, getCommits, GitCommit } from './git-parser.js'
import { analyzeCommits } from '@semantic-release/commit-analyzer'
import createPreset from 'conventional-changelog-conventionalcommits'
import semver, { SemVer, ReleaseType } from 'semver'
import assert from 'node:assert/strict'
import { Logger, MandatoryInputs } from './interfaces.js'

const tagVersionRegExps = {
  prefix: /^(([a-zA-Z0-9][a-zA-Z0-9_-]*[a-zA-Z_-])|([a-zA-Z]))?$/,
  core: /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/,
  prerelease:
    /^(-((0|[1-9][0-9]*|[0-9]*[a-zA-Z-][0-9a-zA-Z-]*)(\.(0|[1-9][0-9]*|[0-9]*[a-zA-Z-][0-9a-zA-Z-]*))*))?$/,
  build: /^(\+([0-9a-zA-Z-]+(\.[0-9a-zA-Z-]+)*))?$/
}

async function parseGitHistorySemver (ref: string, prefix: string, prereleaseMode: boolean, scope: string): Promise<{ tags: string[], commits: GitCommit[] }> {
  const bashTagVersionRegExps = {
    core: tagVersionRegExps.core.source.replace(/[$^]/g, ''),
    prerelease: tagVersionRegExps.prerelease.source.replace(/[$^]/g, ''),
    build: tagVersionRegExps.build.source.replace(/[$^]/g, '')
  }

  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions#escaping
  function escapeRegExp (string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  const sanitizedPrefix = escapeRegExp(prefix)
  const { core, prerelease, build } = bashTagVersionRegExps

  const tags = await getTags(ref, `${sanitizedPrefix}${core}${prereleaseMode ? prerelease : ''}${build}`)
  if (tags.length === 0) {
    throw Error('No tags found in the git history.')
  }
  const commits = await getCommits(tags[0], ref, `${scope === '' ? '' : `[a-zA-Z]+\\(${escapeRegExp(scope)}\\):`}`)
  return { tags, commits }
}

function parseGitTagsAsSemver (gitTags: string[], logger: Logger, prefix: string): SemVer[] {
  return gitTags.reduce<SemVer[]>((versions, gitTag) => {
    const version = semver.parse(gitTag.replace(prefix, ''), {})
    if (version != null) versions.push(version)
    else {
      logger.warning(
        `Could not parse '${gitTag}' tag. This case is ignored.`
      )
    }
    return versions
  }, [])
}

function checkInputsWithRegexp (regex: RegExp, value: string): void {
  assert(regex.test(value), `'${value.toString()}' value does not match with RegExp '${regex.toString()}'.`)
}

function checkInputs (inputs: SemVerInputs): void {
  [{
    regex: tagVersionRegExps.prefix,
    value: inputs.prefix
  }, {
    regex: tagVersionRegExps.build,
    value: inputs.build
  }, {
    regex: tagVersionRegExps.prerelease,
    value: inputs.prerelease
  }].forEach(obj => {
    checkInputsWithRegexp(obj.regex, obj.value.toString())
  })
}

export interface SemVerInputs {
  readonly mandatory: MandatoryInputs
  readonly prefix: string
  readonly prerelease: string
  readonly build: string
  readonly scope: string
}

export interface SemVerOutputs {
  tag: string
  previousTag: string
  semver: string
}

function selectLastVersion (versions: SemVer[], logger: Logger): SemVer {
  if (versions.length > 1) {
    logger.warning(
      `Multiple versions found on same commit: '${versions.join('; ')}'. The highest precedence one will be selected.`
    )
  }
  return semver.rsort(versions)[0]
}

function getPrereleaseType (version: SemVer, releaseType: ReleaseType): ReleaseType {
  if (version.prerelease.length === 0) {
    return `pre${releaseType}` as ReleaseType
  }

  let releaseTypeFromPreviousVersion = 'major'
  if (version.patch > 0) {
    releaseTypeFromPreviousVersion = 'patch'
  } else if (version.minor > 0) {
    releaseTypeFromPreviousVersion = 'minor'
  }

  if (
    releaseTypeFromPreviousVersion === releaseType ||
    releaseTypeFromPreviousVersion === 'major' ||
    (releaseTypeFromPreviousVersion === 'minor' && releaseType === 'patch')
  ) { return 'prerelease' }

  return `pre${releaseType}` as ReleaseType
}

async function getReleaseType (commits: GitCommit[], selectedVersion: SemVer, isPrerelease: boolean, logger: Logger): Promise<ReleaseType | null> {
  if (commits.length === 0) {
    logger.info('No commits found in the git history.')
    return null
  }

  let releaseType: ReleaseType = await analyzeCommits(
    { parserOpts: (await createPreset()).parserOpts },
    {
      commits,
      logger: console
    }
  )

  if (releaseType === null) {
    logger.info(
      `Analysis starting from commit '${commits[0]?.hash ?? ''}' to '${commits.at(-1)?.hash ?? ''}' results in no new version.`
    )
    return null
  }
  if (releaseType === 'major' && selectedVersion.major === 0) {
    releaseType = 'minor'
  }
  if (isPrerelease) {
    releaseType = getPrereleaseType(selectedVersion, releaseType)
  }
  return releaseType
}

export async function nextSemanticVersion (inputs: SemVerInputs): Promise<SemVerOutputs> {
  const output: SemVerOutputs = {
    tag: '',
    previousTag: '',
    semver: ''
  }

  checkInputs(inputs)

  const ref = inputs.mandatory.ref
  const logger = inputs.mandatory.logger
  const gitParsedResult = await parseGitHistorySemver(ref, inputs.prefix, inputs.prerelease !== '', inputs.scope)
  const versions = parseGitTagsAsSemver(gitParsedResult.tags, logger, inputs.prefix)

  const selectedVersion = selectLastVersion(versions, logger)

  output.previousTag = `${inputs.prefix}${selectedVersion.version}`

  const releaseType = await getReleaseType(gitParsedResult.commits, selectedVersion, inputs.prerelease !== '', logger)
  if (releaseType === null) {
    return output
  }
  logger.info(`Release applied: ${releaseType}`)
  const incrementedVersion = semver.parse(semver.inc(selectedVersion.version, releaseType, inputs.prerelease))
  if (incrementedVersion === null) {
    return output
  }
  output.tag = `${inputs.prefix}${incrementedVersion.toString()}${inputs.build}`
  output.semver = incrementedVersion.toString()

  return output
}
