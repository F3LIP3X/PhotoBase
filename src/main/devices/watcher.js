import { detectDevices } from './detectors'

const DEFAULT_INTERVAL_MS = 3000

/* USB hotplug has no dependable cross-platform event without a native
   module, so we poll. Two rules keep that cheap: never start a probe
   while the previous one is still running, and only tell the renderer
   when the set actually changed. */
export function createDeviceWatcher({ onChange, intervalMs = DEFAULT_INTERVAL_MS }) {
  let timer = null
  let probing = false
  let signature = null
  let devices = []

  const fingerprint = (list) =>
    list
      .map((device) => `${device.id}:${device.readable ? 1 : 0}`)
      .sort()
      .join('|')

  async function poll() {
    if (probing) return
    probing = true
    try {
      const next = await detectDevices()
      const nextSignature = fingerprint(next)
      if (nextSignature !== signature) {
        signature = nextSignature
        devices = next
        onChange(next)
      }
    } finally {
      probing = false
    }
  }

  return {
    start() {
      if (timer) return
      poll()
      timer = setInterval(poll, intervalMs)
    },
    stop() {
      if (!timer) return
      clearInterval(timer)
      timer = null
    },
    /* The renderer asks for the current list on mount, before the next
       tick would have told it anything. */
    async current() {
      if (signature === null) await poll()
      return devices
    },
  }
}
