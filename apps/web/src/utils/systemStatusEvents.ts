export const DATA_SYNC_STATUS_UPDATED_EVENT = 'tradepilot:data-sync-status-updated';

export function notifyDataSyncStatusUpdated() {
  window.dispatchEvent(new Event(DATA_SYNC_STATUS_UPDATED_EVENT));
}
