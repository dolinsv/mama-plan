/**
 * Non-interactive VK Mini Apps auth + deploy helper.
 * Opens OAuth URL, polls for token, then runs vk-miniapps-deploy.
 */
import { execSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const require = createRequire(import.meta.url)
const Configstore = require('configstore')
const pkg = require('@vkontakte/vk-miniapps-deploy/package.json')
const vault = new Configstore(pkg.name, {})

const scriptDir = dirname(fileURLToPath(import.meta.url))
const root = join(scriptDir, '..')
const cfg = JSON.parse(readFileSync(join(root, 'vk-hosting-config.json'), 'utf8'))
const appId = cfg.app_id
const OAUTH_HOST = 'https://oauth.vk.ru/'
const DEPLOY_APP_ID = 6670517

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function obtainToken() {
  const existing = vault.get('access_token')
  const expires = Number(vault.get('expires_in') || 0)
  if (existing && (expires === 0 || expires * 1000 > Date.now())) {
    console.log('Using saved VK deploy token')
    return existing
  }

  const getAuthCodeUrl = `${OAUTH_HOST}get_auth_code?scope=offline&client_id=${DEPLOY_APP_ID}&mini_app_id=${appId}`
  const authCodeRes = await fetch(getAuthCodeUrl).then((r) => r.json())
  if (authCodeRes.error) throw new Error(JSON.stringify(authCodeRes.error))
  if (!authCodeRes.auth_code) throw new Error('No auth_code from VK: ' + JSON.stringify(authCodeRes))

  const { auth_code, device_id } = authCodeRes
  const codeAuthUrl = `${OAUTH_HOST}code_auth?stage=check&code=${auth_code}&revoke=1`
  console.log('\nОткройте ссылку и подтвердите доступ:\n')
  console.log(codeAuthUrl)
  console.log('\nЖду авторизацию (до 3 минут)...\n')

  try {
    execSync(`start "" "${codeAuthUrl}"`, { stdio: 'ignore', shell: true })
  } catch {
    /* user opens manually */
  }

  const tokenUrl = `${OAUTH_HOST}code_auth_token?device_id=${device_id}&client_id=${DEPLOY_APP_ID}&mini_app_id=${appId}`
  const deadline = Date.now() + 180000

  while (Date.now() < deadline) {
    await sleep(2500)
    const res = await fetch(tokenUrl)
    if (res.status !== 200) continue
    const json = await res.json()
    if (json.access_token) {
      vault.set('access_token', json.access_token)
      vault.set('expires_in', json.expires_in || 0)
      console.log('Токен получен и сохранён')
      return json.access_token
    }
  }

  throw new Error('Таймаут ожидания авторизации VK. Откройте ссылку и повторите.')
}

const token = await obtainToken()
process.env.MINI_APPS_ACCESS_TOKEN = token
console.log('Запускаю vk-miniapps-deploy...')
execSync('npx vk-miniapps-deploy', {
  stdio: 'inherit',
  env: process.env,
  cwd: root
})
