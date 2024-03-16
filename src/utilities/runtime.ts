/*
 * This file is part of prose-app-web
 *
 * Copyright 2024, Prose Foundation
 */

/**************************************************************************
 * IMPORTS
 * ************************************************************************* */

// NPM
import { invoke as tauriInvoke } from "@tauri-apps/api";
import { open as tauriOpen } from "@tauri-apps/api/shell";
import { appWindow as tauriAppWindow } from "@tauri-apps/api/window";
import FileDownloader from "js-file-downloader";

// PROJECT: COMMONS
import CONFIG from "@/commons/config";

// PROJECT: UTILITIES
import logger from "@/utilities/logger";
import UtilitiesFile from "@/utilities/file";

/**************************************************************************
 * CONSTANTS
 * ************************************************************************* */

const platform = CONFIG.platform;

const NOTIFICATION_PERMISSIONS = {
  granted: "granted",
  denied: "denied"
};

/**************************************************************************
 * RUNTIME
 * ************************************************************************* */
// TAURI SPECIFICS
import { invoke } from '@tauri-apps/api'

interface ProgressPayload {
  id: number;
  progress: number;
  total: number;
}

type ProgressHandler = (progress: number, total: number) => void;

class UtilitiesRuntime {
  private readonly __isBrowser: boolean;
  private readonly __isApp: boolean;
  private __handlers: Map<number, ProgressHandler>;

  constructor() {
    // Initialize markers
    this.__isBrowser = platform === "web" ? true : false;
    this.__isApp = window.__TAURI__ !== undefined;
    this.__handlers = new Map();

    tauriAppWindow.listen<ProgressPayload>("download://progress", ({ payload }) => {
      const handler = this.__handlers.get(payload.id)
      if (handler != null) {
        handler(payload.progress, payload.total)
      }
    });
  }

  async requestOpenUrl(url: string, target = "_blank"): Promise<void> {
    if (this.__isApp === true) {
      // Request to open via Tauri API (application build)
      await tauriOpen(url);
    } else {
      // Request to open via browser Window API (Web build)
      // Important: set the 'noopener' policy so that the origin window \
      //   cannot be accessed at target, which would create a huge \
      //   security hole.
      window.open(url, target, "noopener");
    }
  }


  async requestFileDownload(
    url: string,
    filename: string | null = null,
    progressHandler?: ProgressHandler
  ): Promise<void> {
    // Tauri build
    if (this.__isApp) {
      // Request to download file via Tauri API (application build)
      const ids = new Uint32Array(1);
      window.crypto.getRandomValues(ids);
      const id = ids[0];

      if (progressHandler != undefined) {
        this.__handlers.set(id, progressHandler);
      }
      await invoke("plugin:downloader|download_file", {
        id,
        url,
        filename,
      })
      this.__handlers.delete(id)
    } else {
      // Request to download file via browser APIs (Web build)
      await new FileDownloader({
        url
      });
    }
  }

  async requestNotificationSend(title: string, body: string): Promise<void> {
    if (this.__isApp) {
      // Request to show notification via Tauri API (application build)
      await invoke("plugin:notifications|send_notification", {
        title,
        body
      })
    } else {
      const hasPermission = await this.requestNotificationPermission();
      if (hasPermission) {
        // Request to show notification via browser APIs (Web build)
        new Notification(title, { body });
      } else {
        logger.warn(
          "Not sending notification since permission is denied:",
          title
        );
      }
    }
  }

  setBadgeCount(count: number) {
    if (this.__isApp) {
      invoke("plugin:notifications|set_badge_count", {
        count
      })
    }
  }

  async requestNotificationPermission(): Promise<boolean> {
    // Request to show notification via browser APIs (Web build)
   let hasPermission =
      Notification.permission === NOTIFICATION_PERMISSIONS.granted;
    if (
      hasPermission === false &&
      Notification.permission !== NOTIFICATION_PERMISSIONS.denied
    ) {
      hasPermission =
        (await Notification.requestPermission()) ===
        NOTIFICATION_PERMISSIONS.granted;
    }

    return hasPermission;
  }
}

/**************************************************************************
 * EXPORTS
 * ************************************************************************* */

export { platform };
export default new UtilitiesRuntime();
