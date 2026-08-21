import { detectDevices } from './detectors'

const DEFAULT_INTERVAL_MS = 3000

/* USB hotplug has no dependable cross-platform event without a native
   module, so we poll. Two rules keep that cheap: never run two probes at
   once, and only tell the renderer when the set actually changed. */
export function createDeviceWatcher({ onChange, intervalMs = DEFAULT_INTERVAL_MS }) {
  let timer = null
  let inFlight = null
  let signature = null
  let devices = []

  const fingerprint = (list) =>
    list
      .map((device) => `${device.id}:${device.readable ? 1 : 0}`)
      .sort()
      .join('|')

  /* Callers share the running probe rather than starting a second one,
     so a manual refresh during a tick still resolves with fresh data. */
  function poll() {
    inFlight ??= detectDevices()
      .then((next) => {
        const nextSignature = fingerprint(next)
        if (nextSignature !== signature) {
          signature = nextSignature
          devices = next
          onChange(next)
        }
        return devices
      })
      .catch(() => devices)
      .finally(() => {
        inFlight = null
      })

    return inFlight
  }

  let subscribers = 0
  let paused = false

  const running = () => subscribers > 0 && !paused

  function sync() {
    if (running() && !timer) {
      poll()
      timer = setInterval(poll, intervalMs)
    } else if (!running() && timer) {
      clearInterval(timer)
      timer = null
    }
  }

  return {
    /* Probing spawns a shell process that walks the phone over COM. Doing
       that forever, for an app that is usually not on the Devices screen,
       wastes power and — worse — contends with the Windows shell: a native
       folder dialog is also a shell COM client, and the two together can
       hang the main process. So we only poll while someone is watching. */
    acquire() {
      subscribers += 1
      sync()
    },
    release() {
      subscribers = Math.max(0, subscribers - 1)
      sync()
    },
    /* Held while a native dialog is open, for the same reason. */
    pause() {
      paused = true
      sync()
    },
    resume() {
      paused = false
      sync()
    },
    stop() {
      subscribers = 0
      paused = true
      sync()
    },
    /* The renderer asks for the current list on mount, before the next
       tick would have told it anything. */
    async current() {
      if (signature === null) return poll()
      return devices
    },
    /* An explicit user request always re-probes, even if the set looks
       unchanged — the point is to confirm, not to guess. */
    refresh() {
      return poll()
    },
  }
}
