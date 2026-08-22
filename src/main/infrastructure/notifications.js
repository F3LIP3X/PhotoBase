import { Notification } from 'electron'
import { logError } from './logging/file-logger'

export function notify(title, body) {
  if (!Notification.isSupported()) return
  try {
    new Notification({ title, body }).show()
  } catch (error) {
    logError('notification', error)
  }
}
