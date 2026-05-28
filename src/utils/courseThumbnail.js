const subjectThemes = [
  {
    match: ['react', 'ui', 'frontend', 'javascript', 'web', 'motion', 'css', 'html'],
    label: 'UI Engineering',
    accent: '#16a9d8',
    secondary: '#10b9a7',
    shape: 'interface',
  },
  {
    match: ['fullstack', 'full-stack', 'mern', 'node', 'express', 'app', 'application'],
    label: 'Fullstack Apps',
    accent: '#16a9d8',
    secondary: '#10b9a7',
    shape: 'interface',
  },
  {
    match: ['data', 'python', 'analytics', 'science', 'machine', 'ai', 'ml'],
    label: 'Data Skills',
    accent: '#0e7cc1',
    secondary: '#10b9a7',
    shape: 'chart',
  },
  {
    match: ['cloud', 'docker', 'devops', 'backend', 'api', 'server', 'database'],
    label: 'Cloud Systems',
    accent: '#083e57',
    secondary: '#16a9d8',
    shape: 'nodes',
  },
  {
    match: ['cyber', 'security', 'network', 'ethical', 'hacking'],
    label: 'Cyber Security',
    accent: '#10b9a7',
    secondary: '#16a9d8',
    shape: 'nodes',
  },
  {
    match: ['business', 'entrepreneur', 'startup', 'management', 'sales', 'finance'],
    label: 'Business Skills',
    accent: '#f97316',
    secondary: '#10b9a7',
    shape: 'chart',
  },
  {
    match: ['design', 'brand', 'marketing', 'creative', 'content'],
    label: 'Creative Practice',
    accent: '#f97316',
    secondary: '#16a9d8',
    shape: 'layout',
  },
]

function pickTheme(course) {
  const haystack = `${course?.title || ''} ${course?.category || ''} ${course?.description || ''}`.toLowerCase()
  return subjectThemes.find((theme) => theme.match.some((word) => haystack.includes(word))) || {
    label: course?.category || 'Course Skills',
    accent: '#16a9d8',
    secondary: '#f97316',
    shape: 'layout',
  }
}

function escapeSvgText(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function shortText(value, maxLength) {
  const text = String(value || '').trim()
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}.` : text
}

function splitTitle(value) {
  const text = shortText(value, 46)
  if (text.length <= 25) return [text]
  const words = text.split(/\s+/)
  const lines = ['']
  words.forEach((word) => {
    const current = lines[lines.length - 1]
    if (`${current} ${word}`.trim().length > 24 && lines.length < 2) {
      lines.push(word)
    } else {
      lines[lines.length - 1] = `${current} ${word}`.trim()
    }
  })
  return lines
}

function subjectArtwork(shape, accent, secondary) {
  if (shape === 'interface') {
    return `
      <rect x="738" y="78" width="340" height="204" rx="32" fill="rgba(255,255,255,0.08)" stroke="rgba(148,236,229,0.28)" />
      <rect x="772" y="114" width="210" height="16" rx="8" fill="#e6fffb" opacity="0.88" />
      <rect x="772" y="164" width="252" height="18" rx="9" fill="${secondary}" opacity="0.95" />
      <rect x="772" y="218" width="142" height="20" rx="10" fill="${accent}" opacity="0.98" />
    `
  }
  if (shape === 'chart') {
    return `
      <rect x="734" y="76" width="342" height="208" rx="32" fill="rgba(255,255,255,0.07)" stroke="rgba(148,236,229,0.26)" />
      <rect x="770" y="130" width="54" height="118" rx="18" fill="#e6fffb" opacity="0.82" />
      <rect x="854" y="84" width="54" height="164" rx="18" fill="${secondary}" opacity="0.92" />
      <rect x="938" y="156" width="54" height="92" rx="18" fill="${accent}" opacity="0.95" />
      <path d="M750 266H1034" stroke="#e6fffb" stroke-width="10" stroke-linecap="round" opacity="0.42" />
    `
  }
  if (shape === 'nodes') {
    return `
      <rect x="734" y="76" width="342" height="208" rx="32" fill="rgba(255,255,255,0.07)" stroke="rgba(148,236,229,0.26)" />
      <circle cx="786" cy="142" r="42" fill="#e6fffb" opacity="0.82" />
      <circle cx="970" cy="118" r="52" fill="${secondary}" opacity="0.92" />
      <circle cx="912" cy="246" r="58" fill="${accent}" opacity="0.94" />
      <path d="M826 136L918 124M806 180L870 220M956 168L930 200" stroke="#e6fffb" stroke-width="11" stroke-linecap="round" opacity="0.5" />
    `
  }
  return `
    <rect x="734" y="76" width="342" height="208" rx="32" fill="rgba(255,255,255,0.07)" stroke="rgba(148,236,229,0.26)" />
    <rect x="760" y="94" width="142" height="142" rx="34" fill="#e6fffb" opacity="0.78" />
    <rect x="934" y="72" width="138" height="102" rx="32" fill="${secondary}" opacity="0.92" />
    <rect x="928" y="202" width="158" height="88" rx="32" fill="${accent}" opacity="0.94" />
  `
}

function buildSubjectThumbnail(course) {
  const theme = pickTheme(course)
  const titleLines = splitTitle(course?.title || theme.label).map(escapeSvgText)
  const label = escapeSvgText(shortText(theme.label, 24))
  const category = escapeSvgText(shortText(course?.category || 'UptoSkills', 28))
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 360" role="img" aria-label="${titleLines.join(' ')}">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#071d2f" />
          <stop offset="48%" stop-color="#083e57" />
          <stop offset="100%" stop-color="#0b1b2d" />
        </linearGradient>
        <radialGradient id="glow" cx="72%" cy="24%" r="62%">
          <stop offset="0%" stop-color="${theme.secondary}" stop-opacity="0.34" />
          <stop offset="100%" stop-color="${theme.accent}" stop-opacity="0" />
        </radialGradient>
        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#03111f" flood-opacity="0.34" />
        </filter>
      </defs>
      <rect width="1200" height="360" rx="34" fill="url(#bg)" />
      <rect width="1200" height="360" rx="34" fill="url(#glow)" />
      <circle cx="1050" cy="-18" r="230" fill="${theme.accent}" opacity="0.14" />
      <circle cx="130" cy="330" r="220" fill="${theme.secondary}" opacity="0.13" />
      <circle cx="40" cy="44" r="3" fill="#8ff5ed" opacity="0.55" />
      <circle cx="268" cy="52" r="3" fill="#8ff5ed" opacity="0.38" />
      <circle cx="630" cy="302" r="3" fill="#8ff5ed" opacity="0.45" />
      <circle cx="1120" cy="288" r="3" fill="#8ff5ed" opacity="0.5" />
      <rect x="50" y="48" width="420" height="42" rx="21" fill="rgba(143,245,237,0.09)" stroke="rgba(143,245,237,0.26)" />
      <text x="78" y="75" fill="#d9f3f0" font-family="Inter, Arial, sans-serif" font-size="17" font-weight="700">${label}</text>
      <text x="70" y="${titleLines.length > 1 ? 154 : 178}" fill="#f8fafc" font-family="Inter, Arial, sans-serif" font-size="${titleLines.length > 1 ? 48 : 58}" font-weight="800">${titleLines[0]}</text>
      ${titleLines[1] ? `<text x="70" y="212" fill="#8ff5ed" font-family="Inter, Arial, sans-serif" font-size="48" font-weight="800">${titleLines[1]}</text>` : ''}
      <text x="72" y="270" fill="#cfe8e7" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="600">${category}</text>
      <path d="M74 304H350" stroke="${theme.secondary}" stroke-width="12" stroke-linecap="round" opacity="0.9" />
      <path d="M74 330H258" stroke="${theme.accent}" stroke-width="12" stroke-linecap="round" opacity="0.78" />
      <g filter="url(#softShadow)">
        ${subjectArtwork(theme.shape, theme.accent, theme.secondary)}
      </g>
    </svg>
  `
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

export function isCelebrityThumbnail(value) {
  return String(value || '').toLowerCase().includes('/celebrities/')
}

export function resolveCourseThumbnail(course) {
  const stored = course?.thumbnailUrl || course?.image || ''
  if (stored && !isCelebrityThumbnail(stored) && String(stored).startsWith('data:image/')) return stored
  return buildSubjectThumbnail(course)
}
