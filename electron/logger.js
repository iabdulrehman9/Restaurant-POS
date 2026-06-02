import log from "electron-log";
import path from "path";

export const initLogger = (userDataPath) => {
  log.transports.file.resolvePathFn = () => path.join(userDataPath, "logs", "main.log");
  log.transports.file.maxSize = 5 * 1024 * 1024;
  log.transports.console.level = "info";
  log.info("Logger initialized");
  return log;
};

export default log;
