import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("posDesktop", {
  getConfig: () => ipcRenderer.invoke("pos:get-config"),
  isDesktop: true,
});
