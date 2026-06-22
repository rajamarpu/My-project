import { spawn } from 'node:child_process'
import { mkdir, rm } from 'node:fs/promises'

const frontend = 'http://localhost:5173'
const api = 'http://localhost:5000/api'
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const profileDir = `${process.cwd()}\\.tmp-profile-edge`
const email = `profile-smoke-${Date.now()}@example.com`
const password = 'ProfileSmoke@2026'

await rm(profileDir, { recursive: true, force: true })
await mkdir(profileDir, { recursive: true })

async function withCaptcha(payload = {}) {
  const response = await fetch(`${api}/auth/captcha`)
  const captcha = await response.json()
  if (!response.ok) throw new Error(`Could not load captcha: ${JSON.stringify(captcha)}`)
  return { ...payload, captchaId: captcha.captcha.captchaId, captchaAnswer: String(captcha.captcha.left + captcha.captcha.right) }
}

const registerResponse = await fetch(`${api}/auth/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(await withCaptcha({ name: 'Profile Button Test', email, phone: '9876543210', password, confirmPassword: password, role: 'learner' })),
})
const registration = await registerResponse.json()
if (!registerResponse.ok || !registration.token || !registration.user) {
  throw new Error(`Could not create smoke-test learner: ${JSON.stringify(registration)}`)
}

const browser = spawn(edgePath, [
  '--headless=new',
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  '--remote-debugging-port=9333',
  `--user-data-dir=${profileDir}`,
  `${frontend}/login`,
], { stdio: 'ignore', windowsHide: true })

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function retry(fn, attempts = 60) {
  let lastError
  for (let index = 0; index < attempts; index += 1) {
    try { return await fn() } catch (error) { lastError = error; await delay(250) }
  }
  throw lastError
}

const targets = await retry(async () => {
  const response = await fetch('http://localhost:9333/json')
  if (!response.ok) throw new Error('Edge debugging endpoint is not ready')
  const items = await response.json()
  const page = items.find((item) => item.type === 'page')
  if (!page) throw new Error('No Edge page target found')
  return page
})

const socket = new WebSocket(targets.webSocketDebuggerUrl)
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true })
  socket.addEventListener('error', reject, { once: true })
})

let requestId = 0
const pending = new Map()
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data)
  if (!message.id || !pending.has(message.id)) return
  const { resolve, reject } = pending.get(message.id)
  pending.delete(message.id)
  if (message.error) reject(new Error(message.error.message))
  else resolve(message.result)
})

function cdp(method, params = {}) {
  const id = ++requestId
  socket.send(JSON.stringify({ id, method, params }))
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }))
}

async function evaluate(expression) {
  const result = await cdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'Browser evaluation failed')
  return result.result.value
}

async function waitFor(expression, label) {
  return retry(async () => {
    const value = await evaluate(expression)
    if (!value) throw new Error(`Timed out waiting for ${label}`)
    return value
  })
}

async function clickButton(label) {
  const clicked = await evaluate(`(() => {
    const button = [...document.querySelectorAll('button')].find((item) => item.offsetParent !== null && item.textContent.trim().includes(${JSON.stringify(label)}))
    if (!button) return false
    button.click()
    return true
  })()`)
  if (!clicked) throw new Error(`Visible button not found: ${label}`)
}

const checks = []
const pass = (name, detail = 'worked') => checks.push({ name, detail })

try {
  await cdp('Runtime.enable')
  await cdp('Page.enable')
  await cdp('Browser.grantPermissions', { origin: frontend, permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'] })
  await waitFor(`location.pathname === '/login'`, 'login page')
  await evaluate(`localStorage.setItem('lms-user', ${JSON.stringify(JSON.stringify(registration.user))}); localStorage.setItem('lms-role', ${JSON.stringify(registration.user.role)}); localStorage.setItem('lms-token', ${JSON.stringify(registration.token)}); true`)
  await cdp('Page.navigate', { url: `${frontend}/profile` })
  await waitFor(`location.pathname === '/profile' && document.body.innerText.includes('Personal Information')`, 'learner profile')

  const visibleButtons = await evaluate(`[...document.querySelectorAll('button')].filter((item) => item.offsetParent !== null).map((item) => item.textContent.trim() || item.getAttribute('aria-label'))`)
  pass('Visible button inventory', visibleButtons.join(', '))

  for (let attempt = 0; attempt < 3 && await evaluate(`localStorage.getItem('uptoskills-theme') !== 'light'`); attempt += 1) {
    await evaluate(`document.querySelector('button[aria-label^="Theme:"]')?.click(); true`)
    await delay(150)
  }
  await waitFor(`localStorage.getItem('uptoskills-theme') === 'light'`, 'light theme')
  const lightPalette = await evaluate(`(() => { const style = getComputedStyle(document.documentElement); return ['--bg-primary','--bg-card','--text-primary','--text-secondary','--accent-primary'].map((token) => style.getPropertyValue(token).trim()) })()`)
  await evaluate(`document.querySelector('button[aria-label^="Theme:"]')?.click(); true`)
  await waitFor(`localStorage.getItem('uptoskills-theme') === 'dark' && document.documentElement.classList.contains('dark')`, 'dark theme')
  const darkPalette = await evaluate(`(() => { const style = getComputedStyle(document.documentElement); return ['--bg-primary','--bg-card','--text-primary','--text-secondary','--accent-primary'].map((token) => style.getPropertyValue(token).trim()) })()`)
  const themeSpecificTokenCount = 4
  if (lightPalette.slice(0, themeSpecificTokenCount).some((value, index) => value === darkPalette[index])) throw new Error(`Light and dark surface/text palettes are not fully distinct: ${JSON.stringify({ lightPalette, darkPalette })}`)
  pass('Theme button', `light ${lightPalette.join(' / ')}; dark ${darkPalette.join(' / ')}`)

  await evaluate(`document.querySelector('button[aria-label="Mobile menu"]')?.click(); true`)
  await waitFor(`document.querySelector('button[aria-label="Mobile menu"]')?.getAttribute('aria-expanded') === 'true' && Boolean(document.querySelector('#mobile-navigation'))`, 'mobile menu open')
  await evaluate(`[...document.querySelectorAll('#mobile-navigation a')].find((item) => item.textContent.includes('Learning Path'))?.click(); true`)
  await waitFor(`location.pathname === '/learning-path' && document.body.innerText.includes('A clear route from learning to achievement')`, 'dedicated learning path page')
  pass('Learning Path navigation', 'redirected to the dedicated /learning-path roadmap')
  await cdp('Page.navigate', { url: `${frontend}/profile` })
  await waitFor(`location.pathname === '/profile' && document.body.innerText.includes('Personal Information')`, 'return to profile after learning-path check')
  pass('Mobile menu button', 'opened the navigation drawer and followed its Learning Path link')

  await clickButton('Edit Profile')
  await waitFor(`document.querySelector('#profile-editor')?.getBoundingClientRect().top < innerHeight`, 'profile editor scroll')
  pass('Edit Profile', 'scrolled to the profile editor')

  await clickButton('Share')
  await waitFor(`document.body.innerText.includes('Profile link copied.') || document.body.innerText.includes('Profile shared successfully.')`, 'share success')
  pass('Share', 'shared successfully or copied the profile link')

  await clickButton('Certificates')
  await waitFor(`location.pathname === '/certificates'`, 'certificates destination')
  pass('Certificates', 'redirected to /certificates')
  await cdp('Page.navigate', { url: `${frontend}/profile` })
  await waitFor(`location.pathname === '/profile' && document.body.innerText.includes('Personal Information')`, 'return to profile')

  await clickButton('Save Profile')
  await waitFor(`document.body.innerText.includes('Profile saved successfully.')`, 'profile save')
  pass('Save Profile', 'profile API saved successfully')

  await evaluate(`(() => {
    const input = [...document.querySelectorAll('input')].find((item) => item.placeholder === 'Profile picture URL')
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
    setter.call(input, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB')
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new Event('change', { bubbles: true }))
    return true
  })()`)
  await waitFor(`[...document.querySelectorAll('button')].some((item) => item.offsetParent !== null && item.textContent.includes('Remove Photo'))`, 'remove-photo button')
  await clickButton('Remove Photo')
  await waitFor(`document.body.innerText.includes('Profile photo removed.')`, 'photo removal')
  pass('Remove Photo', 'cleared the selected profile image')

  const changeVisibilityButtons = await evaluate(`[...document.querySelectorAll('button[aria-label^="Show "]')].filter((item) => item.offsetParent !== null).length`)
  for (let index = 0; index < changeVisibilityButtons; index += 1) {
    await evaluate(`document.querySelector('button[aria-label^="Show "]')?.click(); true`)
  }
  const visiblePasswordInputs = await evaluate(`[...document.querySelectorAll('input')].filter((item) => ['Current password','New password','Confirm password'].includes(item.closest('label')?.childNodes[0]?.textContent?.trim()) && item.type === 'text').length`)
  if (visiblePasswordInputs !== changeVisibilityButtons) throw new Error('One or more password visibility buttons did not toggle')
  pass('Password visibility buttons', `${visiblePasswordInputs} fields toggled to visible`)

  await clickButton('Update Password')
  await waitFor(`document.body.innerText.includes('Current password is required.')`, 'password validation')
  pass('Update Password', 'validation handler displayed the required-field error')

  await clickButton('Forgot password')
  await waitFor(`document.body.innerText.includes('Send 6-digit OTP')`, 'forgot-password mode')
  pass('Forgot password tab', 'opened OTP recovery form')

  const forgotVisibilityButtons = await evaluate(`[...document.querySelectorAll('button[aria-label^="Show "]')].filter((item) => item.offsetParent !== null).length`)
  for (let index = 0; index < forgotVisibilityButtons; index += 1) {
    await evaluate(`document.querySelector('button[aria-label^="Show "]')?.click(); true`)
  }
  pass('Recovery password visibility buttons', `${forgotVisibilityButtons} controls toggled`)

  await clickButton('Send 6-digit OTP')
  await waitFor(`document.body.innerText.includes('Resend 6-digit OTP')`, 'OTP request')
  pass('Send 6-digit OTP', 'OTP endpoint succeeded and resend state appeared')

  await clickButton('Reset Password')
  await waitFor(`document.body.innerText.includes('Enter the 6-digit OTP.')`, 'reset validation')
  pass('Reset Password', 'validation handler rejected an empty OTP correctly')

  await clickButton('Change password')
  await waitFor(`document.body.innerText.includes('Update Password')`, 'change-password mode')
  pass('Change password tab', 'returned to password change form')

  console.log(JSON.stringify({ ok: true, profile: '/profile', checks }, null, 2))
} finally {
  socket.close()
  browser.kill()
  await delay(500)
  await rm(profileDir, { recursive: true, force: true }).catch(() => {})
}
