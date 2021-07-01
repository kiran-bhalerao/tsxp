import { InstallCommand } from "./getInstallCmd";

export default function getInstallArgs(cmd: InstallCommand) {
  switch (cmd) {
    case "npm":
      return ["i"];
    case "yarn":
      return [];
  }
}
