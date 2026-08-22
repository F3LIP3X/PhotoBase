import { spawn } from 'child_process'
import { writeFileSync, mkdirSync, rmSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { app } from 'electron'
import {
  DEFAULT_SOURCES,
  EXCLUDED_PATHS,
  isExcludedPath,
  isMediaFile,
} from './androidLayout'
import {
  loadIndex,
  saveIndex,
  mediaKey,
  planDestination,
  recordCopy,
  destinationFor,
} from '../library/index-store'
import { log, logError } from '../log'

const GB = 1024 ** 3

/* Size and dates come from ExtendedProperty, never GetDetailsOf: the
   latter returns localised text ("3,45 MB") that cannot be parsed back
   into a number. */
const SCAN_SCRIPT = `
param([string]$DeviceName, [string]$Sources, [string]$Excluded)
$ErrorActionPreference = 'SilentlyContinue'

$skip = @($Excluded -split ',' | Where-Object { $_ })

# The walk now starts at the storage root, so it needs room for the
# deeper places apps keep media —
# Android/media/com.whatsapp/WhatsApp/Media/WhatsApp Images is six down.
# Still capped: a device that reports a folder loop must not turn the
# scan into an infinite one.
$MAX_DEPTH = 12

$shell = New-Object -ComObject Shell.Application
$device = $shell.NameSpace(17).Items() | Where-Object { $_.Name -eq $DeviceName }
if (-not $device) { Write-Output '{"type":"result","items":[]}'; exit }
$storage = $device.GetFolder.Items() | Select-Object -First 1
if (-not $storage) { Write-Output '{"type":"result","items":[]}'; exit }
$root = $storage.GetFolder

# Walking a full phone over MTP takes minutes, and a silent minute is
# indistinguishable from a hang. Every folder entered says so.
function Report($path, $count) {
  Write-Output ('{"type":"scan","path":' + ($path | ConvertTo-Json) + ',"found":' + $count + '}')
}

function Get-Sub($folder, $name) {
  if ($null -eq $folder) { return $null }
  $hit = @($folder.Items() | Where-Object { $_.IsFolder -and $_.Name -eq $name })[0]
  if ($null -eq $hit) { return $null }
  return $hit.GetFolder
}

# Every folder is descended into. Which subfolder a camera, a vendor or
# a messaging app picks is its own business, and the only way not to miss
# any of them is to stop guessing and walk the lot.
function Walk($folder, $path, $found, $depth) {
  if ($null -eq $folder -or $depth -gt $MAX_DEPTH) { return }

  Report $path $found.Count
  $sinceReport = 0

  foreach ($item in $folder.Items()) {
    if ($item.IsFolder) {
      $name = $item.Name
      if ($name.StartsWith('.')) { continue }

      $next = if ($path -eq '') { $name } else { "$path/$name" }
      if ($skip -contains $next) { continue }

      Walk $item.GetFolder $next $found ($depth + 1)
      continue
    }

    [void]$found.Add([pscustomobject]@{
      source   = $path
      name     = $item.Name
      size     = [int64]$item.ExtendedProperty('Size')
      modified = $item.ExtendedProperty('System.DateModified')
    })

    # One folder can hold thousands of files, so the count moves even
    # while the path does not.
    $sinceReport++
    if ($sinceReport -ge 200) {
      Report $path $found.Count
      $sinceReport = 0
    }
  }
}

$found = New-Object System.Collections.ArrayList

foreach ($src in ($Sources -split ',')) {
  $cur = $root
  # An empty source is the storage root itself.
  if ($src -ne '') {
    foreach ($part in ($src -split '/')) { $cur = Get-Sub $cur $part }
  }
  if ($null -eq $cur) { continue }
  Walk $cur $src $found 0
}

[pscustomobject]@{ type = 'result'; items = @($found) } | ConvertTo-Json -Compress -Depth 4
`

/* CopyHere is asynchronous and has no completion callback, so each file
   is followed by a wait on the destination reaching the size it has on
   the phone. Flags: 4 no progress dialog, 16 yes-to-all, 512 no
   new-folder prompt, 1024 no error UI — this runs unattended behind our
   own progress bar. */
const COPY_SCRIPT = `
param([string]$DeviceName, [string]$PlanPath)
$ErrorActionPreference = 'SilentlyContinue'

# 60 s without the file growing, at 500 ms a poll.
$STALL_LIMIT = 120

$plan = Get-Content -Raw -LiteralPath $PlanPath | ConvertFrom-Json
$shell = New-Object -ComObject Shell.Application
$device = $shell.NameSpace(17).Items() | Where-Object { $_.Name -eq $DeviceName }
if (-not $device) { Write-Output '{"type":"fatal","error":"device-gone"}'; exit }
$root = ($device.GetFolder.Items() | Select-Object -First 1).GetFolder

function Get-Sub($folder, $name) {
  if ($null -eq $folder) { return $null }
  $hit = @($folder.Items() | Where-Object { $_.IsFolder -and $_.Name -eq $name })[0]
  if ($null -eq $hit) { return $null }
  return $hit.GetFolder
}

function Get-Size($path) {
  try { return (Get-Item -LiteralPath $path -Force -ErrorAction Stop).Length } catch { return -1 }
}

# Existence is not completion. CopyHere returns at once and the shell
# then grows the destination, so a Test-Path check calls a 2 GB video
# done a fraction of a second in and leaves a truncated file behind.
# Byte length is the only completion signal MTP gives us.
function Test-Copied($path, $expected) {
  $size = Get-Size $path
  if ($size -lt 0) { return $false }
  if ($expected -gt 0) { return ($size -eq $expected) }
  return ($size -gt 0)
}

# Progress is the deadline, not the clock: a long video over USB
# legitimately takes minutes, so the wait only ends when the file stops
# growing altogether.
# Emits progress and nothing else: the verdict is taken from
# Test-Copied afterwards, so this must not put a return value on the
# pipeline where it would be read as an event.
function Wait-Copy($path, $expected, $name) {
  $seen = -1
  $idle = 0
  $tick = 0

  while ($idle -lt $STALL_LIMIT) {
    if ($expected -gt 0 -and (Test-Copied $path $expected)) { return }

    $size = Get-Size $path
    if ($size -gt $seen) { $seen = $size; $idle = 0 } else { $idle++ }

    # One long video would otherwise leave the bar frozen for minutes,
    # so the bytes already on disk are reported every few seconds.
    $tick++
    if (($tick % 8) -eq 0 -and $size -gt 0) {
      Write-Output ('{"type":"progress","name":' + ($name | ConvertTo-Json) + ',"bytes":' + $size + '}')
    }

    Start-Sleep -Milliseconds 500
  }
}

$folderCache = @{}

foreach ($entry in $plan) {
  if (-not $folderCache.ContainsKey($entry.source)) {
    $cur = $root
    if ($entry.source -ne '') {
      foreach ($part in ($entry.source -split '/')) { $cur = Get-Sub $cur $part }
    }
    $folderCache[$entry.source] = $cur
  }
  $sourceFolder = $folderCache[$entry.source]
  if ($null -eq $sourceFolder) { continue }

  $item = @($sourceFolder.Items() | Where-Object { $_.Name -eq $entry.name })[0]
  if ($null -eq $item) { continue }

  if (-not (Test-Path -LiteralPath $entry.destDir)) {
    New-Item -ItemType Directory -Path $entry.destDir -Force | Out-Null
  }

  $target = Join-Path $entry.destDir $entry.destName

  # Anything already there that is the wrong length is the wreckage of an
  # interrupted run, and gets pulled again rather than trusted.
  if ((Get-Size $target) -ge 0 -and -not (Test-Copied $target $entry.size)) {
    Remove-Item -LiteralPath $target -Force
  }

  if (-not (Test-Path -LiteralPath $target)) {
    $dest = $shell.NameSpace($entry.destDir)
    if ($null -eq $dest) {
      Write-Output ('{"type":"failed","id":' + $entry.id + ',"name":' + ($entry.destName | ConvertTo-Json) + '}')
      continue
    }
    $dest.CopyHere($item, 4 + 16 + 512 + 1024)
    Wait-Copy $target $entry.size $entry.destName
  }

  if (Test-Copied $target $entry.size) {
    Write-Output ('{"type":"copied","id":' + $entry.id + ',"name":' + ($entry.destName | ConvertTo-Json) + ',"size":' + $entry.size + '}')
  } else {
    # A half-written file must not survive the run: the next backup would
    # see it, and a partial video is worse than a missing one.
    Remove-Item -LiteralPath $target -Force
    Write-Output ('{"type":"failed","id":' + $entry.id + ',"name":' + ($entry.destName | ConvertTo-Json) + '}')
  }
}

Write-Output '{"type":"done"}'
`

/* The scripts take named parameters, and -Command appends extra
   arguments to the command text instead of binding them. Only -File
   binds param(), so the script goes to a temp .ps1 first. */
function powershell(script, args, { onLine } = {}) {
  const scriptPath = join(tmpdir(), `photobase-${Date.now()}-${Math.random().toString(36).slice(2)}.ps1`)
  writeFileSync(scriptPath, script, 'utf8')

  return new Promise((resolve, reject) => {
    const child = spawn(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', scriptPath, ...args],
      { windowsHide: true },
    )

    let stdout = ''
    let buffer = ''

    child.stdout.on('data', (chunk) => {
      const text = chunk.toString()
      stdout += text

      if (!onLine) return
      buffer += text
      const lines = buffer.split(/\r?\n/)
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed) onLine(trimmed)
      }
    })

    child.on('error', (error) => {
      rmSync(scriptPath, { force: true })
      reject(error)
    })

    child.on('close', () => {
      rmSync(scriptPath, { force: true })
      resolve(stdout)
    })
  })
}

/* Capture time drives the YYYY/MM layout. Android camera filenames carry
   it directly (PXL_20260806_214636611.jpg) and that is more trustworthy
   than the modified date, which changes when a file is moved or synced.
   DateTaken is not exposed over MTP at all. */
function captureDate({ name, modified }) {
  const fromName = /(?:^|[^0-9])(20\d{2})(\d{2})(\d{2})(?:[^0-9]|$)/.exec(name)
  if (fromName) {
    const [, year, month, day] = fromName
    const parsed = new Date(`${year}-${month}-${day}T00:00:00`)
    if (!Number.isNaN(parsed.getTime())) return parsed
  }

  /* ConvertTo-Json serialises dates as "/Date(1786045598000)/". */
  if (typeof modified === 'string') {
    const dotNet = /\/Date\((-?\d+)\)\//.exec(modified)
    if (dotNet) return new Date(Number(dotNet[1]))
  }

  const fallback = modified ? new Date(modified) : null
  return fallback && !Number.isNaN(fallback.getTime()) ? fallback : new Date()
}

/* Reads what is on the device and decides what is genuinely new. */
export async function planBackup({ deviceName, libraryPath, quotaGB, onProgress }) {
  let items = null
  let folders = 0

  await powershell(
    SCAN_SCRIPT,
    [
      '-DeviceName',
      deviceName,
      '-Sources',
      DEFAULT_SOURCES.join(','),
      '-Excluded',
      EXCLUDED_PATHS.join(','),
    ],
    {
      onLine(line) {
        if (!line.startsWith('{')) return

        let event
        try {
          event = JSON.parse(line)
        } catch {
          return
        }

        if (event.type === 'scan') {
          folders += 1
          onProgress?.({
            phase: 'scan',
            /* The storage root reports itself as an empty path. */
            path: event.path || '(raíz del teléfono)',
            found: event.found ?? 0,
            folders,
          })
          return
        }

        if (event.type === 'result') items = [].concat(event.items ?? [])
      },
    },
  )

  if (!items) {
    logError('backup scan parse', new Error('scan produced no result line'))
    throw new Error('No se pudo leer el contenido del dispositivo.')
  }

  const media = items.filter(
    (item) => item?.name && isMediaFile(item.name) && !isExcludedPath(item.source),
  )
  const index = loadIndex(libraryPath)

  const plan = []
  /* Destinations handed out in this run, so two files from different
     folders on the phone cannot be promised the same slot. */
  const claimed = new Set()
  /* And the same photo sitting in two of those folders is still one
     photo, so it is copied once. */
  const seen = new Set()
  let plannedBytes = 0
  let skipped = 0

  for (const item of media) {
    const key = mediaKey(item)
    if (seen.has(key)) {
      skipped += 1
      continue
    }
    seen.add(key)

    const withDate = { ...item, takenAt: captureDate(item) }
    const relative = planDestination({
      index,
      libraryPath,
      item,
      relative: destinationFor(withDate),
      claimed,
    })

    if (!relative) {
      skipped += 1
      continue
    }

    claimed.add(relative)
    const segments = relative.split('/')

    plan.push({
      /* The script reports back by id: names are no longer unique now
         that the whole tree is walked. */
      id: plan.length,
      source: item.source,
      name: item.name,
      destName: segments[segments.length - 1],
      size: Number(item.size) || 0,
      relative,
      destDir: join(libraryPath, ...segments.slice(0, -1)),
    })
    plannedBytes += Number(item.size) || 0
  }

  onProgress?.({
    phase: 'planned',
    planned: plan.length,
    skipped,
    totalBytes: plannedBytes,
    found: media.length,
  })

  return { plan, skipped, plannedBytes, total: media.length, index, quotaGB }
}

/* Copies the planned files, reporting each one as it lands. */
export async function runBackup({ deviceName, libraryPath, quotaGB, usedGB, onProgress }) {
  const { plan, skipped, plannedBytes, total, index } = await planBackup({
    deviceName,
    libraryPath,
    quotaGB,
    onProgress,
  })

  /* The quota is a promise, so it is checked before writing rather than
     apologised for afterwards. */
  const room = (quotaGB - usedGB) * GB
  if (plannedBytes > room) {
    return {
      copied: 0,
      skipped,
      failed: 0,
      total,
      blocked: true,
      message:
        `Esta copia necesita ${(plannedBytes / GB).toFixed(1)} GB y solo quedan ` +
        `${Math.max(0, room / GB).toFixed(1)} GB de tu límite de ${quotaGB} GB.`,
    }
  }

  if (!plan.length) {
    return { copied: 0, skipped, failed: 0, total, blocked: false, message: null }
  }

  const planPath = join(tmpdir(), `photobase-plan-${Date.now()}.json`)
  mkdirSync(tmpdir(), { recursive: true })
  writeFileSync(planPath, JSON.stringify(plan), 'utf8')

  let copied = 0
  let failed = 0
  let copiedBytes = 0
  /* Bytes of the file currently in flight, which only a big video makes
     worth showing separately. */
  let inFlight = 0
  const byId = new Map(plan.map((entry) => [entry.id, entry]))

  /* Counted in bytes as well as files, because one 2 GB clip and one
     2 MB photo are one file each and nothing like the same wait. */
  const report = (name) =>
    onProgress?.({
      phase: 'copy',
      copied,
      planned: plan.length,
      name,
      bytes: copiedBytes + inFlight,
      totalBytes: plannedBytes,
    })

  try {
    await powershell(COPY_SCRIPT, ['-DeviceName', deviceName, '-PlanPath', planPath], {
      onLine(line) {
        if (!line.startsWith('{')) return
        let event
        try {
          event = JSON.parse(line)
        } catch {
          return
        }

        if (event.type === 'progress') {
          inFlight = Number(event.bytes) || 0
          report(event.name)
          return
        }

        if (event.type === 'copied') {
          const entry = byId.get(event.id)
          if (entry) {
            recordCopy(index, { name: entry.name, size: entry.size }, entry.relative)
            copiedBytes += entry.size
          }
          inFlight = 0
          copied += 1
          report(event.name)
          return
        }

        if (event.type === 'failed') {
          inFlight = 0
          failed += 1
          logError('backup file failed', new Error(String(event.name)))
          report(event.name)
        }
      },
    })
  } finally {
    rmSync(planPath, { force: true })
    /* Persist whatever was copied, even if the run ended early: a
       half-finished backup must not re-copy what it already brought. */
    saveIndex(libraryPath, index)
  }

  log('backup finished', { deviceName, copied, skipped, failed, planned: plan.length })
  return { copied, skipped, failed, total, blocked: false, message: null }
}

export const backupSupported = () => process.platform === 'win32' && Boolean(app)
