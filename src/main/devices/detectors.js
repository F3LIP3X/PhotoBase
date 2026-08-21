import { execFile } from 'child_process'
import { promisify } from 'util'
import { existsSync } from 'fs'
import { join } from 'path'

const run = promisify(execFile)

/* A probe must never hang the poll loop or crash the app: every detector
   resolves to a list, and a failing platform tool yields an empty one. */
const PROBE_TIMEOUT_MS = 8000

async function probe(command, args) {
  try {
    const { stdout } = await run(command, args, {
      timeout: PROBE_TIMEOUT_MS,
      windowsHide: true,
      maxBuffer: 1024 * 1024,
    })
    return stdout.trim()
  } catch {
    return ''
  }
}

function parseJson(text, fallback) {
  if (!text) return fallback
  try {
    return JSON.parse(text)
  } catch {
    return fallback
  }
}

/* A removable volume is only interesting to a photo manager if it looks
   like a camera, and DCIM is the standard that says so. */
function mediaFolder(mountPath) {
  if (!mountPath) return null
  for (const name of ['DCIM', 'dcim']) {
    const candidate = join(mountPath, name)
    if (existsSync(candidate)) return candidate
  }
  return null
}

function volumeDevice({ id, name, mountPath }) {
  const media = mediaFolder(mountPath)
  return {
    id,
    name,
    kind: 'volume',
    mountPath,
    mediaPath: media,
    /* Mass storage is plain filesystem access, so we can read it today. */
    readable: Boolean(media),
  }
}

/* Phones connect over MTP, so they never get a drive letter and fs cannot
   see them. They do appear in the shell namespace — the "Este equipo\
   Pixel 10" entry in Explorer — which is reachable over COM, and that is
   the same door Explorer itself uses to browse and copy from a phone.
   Get-PnpDevice -Class WPD misses them entirely. */
const WINDOWS_PROBE = `
$ErrorActionPreference = 'SilentlyContinue'
$shell = New-Object -ComObject Shell.Application
$thisPC = $shell.NameSpace(17)
$removable = @(Get-CimInstance Win32_LogicalDisk -Filter 'DriveType=2' |
  ForEach-Object { $_.DeviceID })
$found = @()

foreach ($item in $thisPC.Items()) {
  $path = $item.Path
  $isDrive = ($path.Length -le 3) -and ($path -like '?:*')

  if ($isDrive) {
    if ($removable -notcontains $path.Substring(0, 2)) { continue }
    $dcim = Join-Path $path 'DCIM'
    $media = $null
    if (Test-Path $dcim) { $media = $dcim }
    $found += [pscustomobject]@{
      id = $path; name = $item.Name; kind = 'volume'
      mountPath = $path; mediaPath = $media
    }
    continue
  }

  # Anything else at this level that is a folder is a portable device.
  if (-not $item.IsFolder) { continue }

  $media = $null
  $root = $item.GetFolder
  if ($root) {
    # A phone exposes one folder per storage; DCIM lives inside one of them.
    foreach ($storage in $root.Items()) {
      $inside = $storage.GetFolder
      if (-not $inside) { continue }
      $dcim = $inside.Items() | Where-Object { $_.Name -eq 'DCIM' } | Select-Object -First 1
      if ($dcim) { $media = $dcim.Path; break }
    }
  }

  $found += [pscustomobject]@{
    id = $path; name = $item.Name; kind = 'mtp'
    mountPath = $null; mediaPath = $media
  }
}

@($found) | ConvertTo-Json -Depth 4 -Compress
`

export function mapWindowsItems(payload) {
  /* ConvertTo-Json collapses a single-element list into a bare object. */
  const items = [].concat(payload ?? [])

  return items.filter(Boolean).map((item) => ({
    id: item.id,
    name: item.name,
    kind: item.kind,
    mountPath: item.mountPath ?? null,
    mediaPath: item.mediaPath ?? null,
    /* A locked phone still appears, but its storage cannot be opened
       until the user unlocks it and allows file transfer. */
    readable: Boolean(item.mediaPath),
  }))
}

async function detectWindows() {
  const stdout = await probe('powershell.exe', [
    '-NoProfile',
    '-NonInteractive',
    '-ExecutionPolicy',
    'Bypass',
    '-Command',
    WINDOWS_PROBE,
  ])

  return mapWindowsItems(parseJson(stdout, []))
}

/* lsblk reports `rm` as a real boolean on modern util-linux but as "0"/"1"
   on older builds — and the string "0" is truthy, which would mark every
   internal disk as removable. */
const isRemovable = (value) => value === true || value === 1 || value === '1'

/* Pseudo-mountpoints like "[SWAP]" are not directories we can read. */
const isRealMount = (value) => typeof value === 'string' && value.startsWith('/')

export function parseLsblk(tree) {
  const found = []
  const walk = (nodes = []) => {
    for (const node of nodes) {
      if (isRemovable(node.rm) && isRealMount(node.mountpoint)) {
        found.push({
          id: `/dev/${node.name}`,
          name: node.label || node.name,
          mountPath: node.mountpoint,
        })
      }
      walk(node.children)
    }
  }
  walk(tree?.blockdevices)
  return found
}

async function detectLinux() {
  const stdout = await probe('lsblk', ['-J', '-o', 'NAME,LABEL,MOUNTPOINT,RM,TYPE'])
  const tree = parseJson(stdout, { blockdevices: [] })

  const devices = parseLsblk(tree).map(volumeDevice)

  /* Phones mounted through gvfs surface as MTP hosts under the user's
     runtime directory. */
  const gvfs = await probe('sh', [
    '-c',
    'ls -d /run/user/$(id -u)/gvfs/mtp:host=* 2>/dev/null',
  ])
  for (const path of gvfs.split('\n').filter(Boolean)) {
    devices.push(
      volumeDevice({
        id: path,
        name: 'Dispositivo MTP',
        mountPath: path,
      }),
    )
  }

  return devices
}

async function detectMac() {
  const stdout = await probe('sh', ['-c', 'ls -1 /Volumes 2>/dev/null'])
  return stdout
    .split('\n')
    .filter(Boolean)
    .map((name) =>
      volumeDevice({ id: `/Volumes/${name}`, name, mountPath: `/Volumes/${name}` }),
    )
}

export async function detectDevices() {
  switch (process.platform) {
    case 'win32':
      return detectWindows()
    case 'linux':
      return detectLinux()
    case 'darwin':
      return detectMac()
    default:
      return []
  }
}
