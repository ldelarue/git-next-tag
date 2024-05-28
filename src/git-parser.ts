import { getExecOutput } from '@actions/exec'

export interface GitCommit {
  hash: string
  message: string
}

export async function getCommits (tag: string, ref: string, pattern: string = ''): Promise<GitCommit[]> {
  const gitLogCommand = getCommitsGitCommand(tag, ref, pattern)
  const { stdout, stderr, exitCode } = await execCommand(gitLogCommand)

  if (exitCode !== 0) {
    throw Error(
      `Bash command failed. '${gitLogCommand}'\n${stderr}`
    )
  }
  if (stdout === '') {
    return []
  }
  return stdout.split('\n').map((rawCommit) => {
    const { hash, message } = rawCommit.match(/^(?<hash>[0-9a-f]{40}) (?<message>.*)/)?.groups ?? { hash: '', message: '' }
    return { hash, message }
  })
}

export async function getTags (ref: string, BashTagRegExp: string): Promise<string[]> {
  const tagsGitCommand = getMostRecentTagsGitCommand(ref, BashTagRegExp)
  const { stdout, exitCode } = await execCommand(tagsGitCommand)

  if (exitCode === 127) {
    throw Error(
      'Bash command failed. Error is related to missing binaries.'
    )
  }
  if (stdout === '') {
    return []
  }
  return stdout.split('\n')
}

export async function isGitHistoryLinear (ref: string): Promise<boolean> {
  const isGitHistoryLinearCommand = getIsGitHistoryLinearGitCommand(ref)
  const { stdout, stderr, exitCode } = await execCommand(isGitHistoryLinearCommand)

  if (exitCode !== 0) {
    throw Error(
      `Bash command failed. '${isGitHistoryLinearCommand}'\n${stderr}`
    )
  }
  const num = parseFloat(stdout)
  return !isNaN(num) && num % 1 === 0
}

function getCommitsGitCommand (base: string = '', head: string = '', messageFilterRegExp: string = ''): string {
  // Get all commits from the git history from the base to the head in json format.
  const range = (base === '') ? head : `${base}..${head}`
  return '' +
    // format: '{hash} {message}'
    `git log --pretty='%H %s' --reverse ${range}` +
    `${messageFilterRegExp === '' ? '' : ` | grep -E ' ${messageFilterRegExp}' || true`}`
}

function getMostRecentTagsGitCommand (ref: string, ResultedBashTagRegExp: string): string {
  return '' +
    // Get all tags from the git history. One line is one commit.
    `git log --pretty='%D' ${ref} | ` +
    // Filter commits only with valid tags.
    `grep -E 'tag: ${ResultedBashTagRegExp}($|,)?' | ` +
    // Get the most recent commit with valid tags, then put them on multiple lines.
    'head -1 | tr \',\' \'\n\' | ' +
    // Extract valid tags.
    `grep -oE '${ResultedBashTagRegExp}'`
}

function getIsGitHistoryLinearGitCommand (ref: string): string {
  return '' +
    // Get all commits from the git history with at least two parents.
    `git log --min-parents=2 --pretty='%H' ${ref} | ` +
    // Word count. If the git history is linear, the result is 0.
    'wc -l'
}

async function execCommand (command: string): Promise<{ stdout: string, stderr: string, exitCode: number }> {
  // https://github.com/actions/toolkit/issues/359#issuecomment-603065463
  const { stdout, stderr, exitCode } = await getExecOutput(
    '/bin/bash',
    ['-c', command],
    { ignoreReturnCode: true }
  )

  return { stdout: stdout.replace(/\n$/, ''), stderr, exitCode }
}
