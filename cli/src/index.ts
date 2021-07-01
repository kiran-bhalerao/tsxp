import { Command } from "@oclif/command";
import * as chalk from "chalk";
import { prompt } from "enquirer";
import * as execa from "execa";
import * as fs from "fs-extra";
import * as ora from "ora";
import * as path from "path";
import getInstallArgs from "./getInstallArgs";
import getInstallCmd from "./getInstallCmd";
import { installing } from "./installing";

const { dependencies: deps } = require("../template/package.json");

class Cli extends Command {
  static args = [{ name: "folder" }];

  async createFolder(dir: string) {
    await fs.mkdirp(dir);
  }

  async copyTemplate(projectPath: string) {
    // copy the template
    await fs.copy(path.resolve(__dirname, `../template`), projectPath, {
      overwrite: true,
    });
  }

  async installDeps(projectPath: string) {
    const installSpinner = ora(installing(Object.keys(deps).sort())).start();
    try {
      process.chdir(projectPath);

      const cmd = await getInstallCmd();
      await execa(cmd, getInstallArgs(cmd));
      installSpinner.succeed(
        "Installed dependencies, This might take a couple of minutes."
      );
    } catch (e) {
      installSpinner.fail("Failed to install dependencies");
      process.exit(1);
    }
  }

  async run() {
    const { args } = this.parse(Cli);
    let folderName = args.folder;
    let projectPath = (await fs.realpath(process.cwd())) + "/" + folderName;

    console.log(
      chalk.blue(`
      ::::::::::: ::::::::: :::    ::: :::::::::  
          :+:    :+:    :+: :+:    :+: :+:    :+: 
          +:+    +:+         +:+  +:+  +:+    +:+ 
          +#+    +#++:++#++   +#++:+   +#+ # +:+  
          +#+           +#+ :+:    :+: +#+       
          #+#    #+#    #+# :+:    :+: #+#        
          ###     ########  :+:    :+: ###        
      `)
    );

    const bootSpinner = ora(`Creating ${chalk.bold.green(folderName)} ...`);

    const exists = await fs.pathExists(projectPath);
    if (exists) {
      bootSpinner.fail(`Failed to create ${chalk.bold.red(folderName)}`);

      const { _folderName } = await prompt<{ _folderName: string }>({
        type: "input",
        name: "_folderName",
        message: `A folder named ${chalk.bold.red(
          folderName
        )} already exists! ${chalk.bold("Choose a different name")}`,
        initial: folderName + "-1",
        result: (v: string) => v.trim(),
      });

      folderName = _folderName;
      projectPath = (await fs.realpath(process.cwd())) + "/" + folderName;
    }

    bootSpinner.start();
    await this.createFolder(projectPath);
    await this.copyTemplate(projectPath);
    bootSpinner.stop();

    await this.installDeps(projectPath);

    const displayedCommand = await getInstallCmd();
    const isYarn = displayedCommand === "yarn";

    console.log();
    console.log(`Success! Created ${folderName} at ${projectPath}`);
    console.log("Inside that directory, you can run several commands:");
    console.log();
    console.log(chalk.cyan(`  ${displayedCommand} ${isYarn ? "" : "run "}dev`));
    console.log("    Starts the development server.");
    console.log();
    console.log(
      chalk.cyan(`  ${displayedCommand} ${isYarn ? "" : "run "}build`)
    );
    console.log("    Build with tsc.");
    console.log();
    console.log(
      chalk.cyan(`  ${displayedCommand} ${isYarn ? "" : "run "}start`)
    );
    console.log("    Start the production build.");
    console.log();
    console.log(chalk.cyan("  cd"), folderName);
    console.log(`  ${chalk.cyan(`${displayedCommand} dev`)}`);
    console.log();
    console.log("Happy hacking!");
  }
}

export = Cli;
