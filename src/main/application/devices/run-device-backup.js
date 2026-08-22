import { readSettings } from '../../settings'
import { libraryUsage } from '../../library/usage'
import { runBackup } from '../../devices/backup'
import { recordBackup } from '../../library/meta'
import { notify } from '../../infrastructure/notifications'
import { broadcast } from '../../infrastructure/window-broadcast'
import { BACKUP_CHANNEL, BACKUP_STATE_CHANNEL } from '../../ipc/channels'
import { setBackupDevice } from '../../backup-session'
import { indexMetadataInBackground } from '../media/index-metadata-in-background'

/* The one handler in the old index.js that was more than a thin adapter:
   it coordinates the device watcher, the copy itself, the backup history,
   the metadata re-index, and two rounds of notifications. That coordination
   is the actual application logic — everything it calls into
   (runBackup, recordBackup, libraryUsage) already lives in its own,
   properly-abstracted module. */
export async function runDeviceBackup({ deviceName, watcher }) {
  const { libraryPath, quotaGB } = readSettings()
  if (!libraryPath || !quotaGB) {
    throw new Error('Configura primero la carpeta y el límite de la biblioteca.')
  }

  const { usedGB } = await libraryUsage(libraryPath)

  setBackupDevice(deviceName)
  broadcast(BACKUP_STATE_CHANNEL, { running: true, deviceName })
  notify(
    'PhotoBase está copiando',
    `No desconectes ${deviceName} ni cierres la aplicación hasta que termine.`,
  )

  /* The device probe and the copy both drive the Windows shell;
     running them together is what froze the app before. */
  watcher?.pause()
  try {
    const outcome = await runBackup({
      deviceName,
      libraryPath,
      quotaGB,
      usedGB,
      onProgress(progress) {
        broadcast(BACKUP_CHANNEL, progress)
      },
    })

    /* Every run is recorded, including the ones that copied nothing:
       "we checked and there was nothing new" is useful history. */
    if (!outcome.blocked) {
      recordBackup(libraryPath, {
        deviceName,
        copied: outcome.copied,
        skipped: outcome.skipped,
      })
    }

    /* Newly copied files have no metadata read yet, and search is
       only as good as the index behind it. */
    if (outcome.copied > 0) indexMetadataInBackground()

    notify(
      outcome.blocked ? 'Copia detenida' : 'Copia terminada',
      outcome.blocked
        ? outcome.message
        : outcome.copied > 0
          ? `${outcome.copied} elementos nuevos en tu biblioteca.`
          : 'Ya tenías todo copiado.',
    )

    return outcome
  } finally {
    setBackupDevice(null)
    broadcast(BACKUP_STATE_CHANNEL, { running: false, deviceName: null })
    watcher?.resume()
  }
}
