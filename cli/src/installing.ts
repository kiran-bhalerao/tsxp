import * as chalk from "chalk";

export const installing = function (packages: string[]) {
  const pkgText = packages
    .map(function (pkg) {
      return `    ${chalk.cyan(chalk.bold(pkg))}`;
    })
    .join("\n");

  return `Installing npm modules, This might take a couple of minutes:
${pkgText}
`;
};
