import { getInput, setOutput, setFailed, warning, info } from '@actions/core'
import { nextSemanticVersion, SemVerInputs } from './semver.js'
import { Logger, MandatoryInputs } from './interfaces.js'

try {
  const { GITHUB_SHA } = process.env
  let ref = getInput('ref')

  if (GITHUB_SHA != null) {
    ref = GITHUB_SHA
  }

  const logger: Logger = {
    warning,
    info
  }

  const mandatory: MandatoryInputs = { ref, logger }

  const inputs: SemVerInputs = {
    mandatory,
    prefix: getInput('tag-prefix'),
    build: (getInput('semver-build') !== '') ? `+${getInput('semver-build')}` : '',
    prerelease: (getInput('semver-prerelease') !== '') ? `-${getInput('semver-prerelease')}` : '',
    scope: getInput('scope')
  }

  const outputs = await nextSemanticVersion(inputs)
  console.log(outputs)
  setOutput('previous-tag', outputs.previousTag)
  setOutput('tag', outputs.tag)
} catch (error) {
  setFailed(error.message)
}
