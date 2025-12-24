#!/usr/bin/env node
/**
 * Script to automatically generate TypeScript paths and Vite aliases
 * for all @xndrjs workspace packages.
 *
 * This script scans package.json files in packages directory and generates:
 * - paths in packages/config-typescript/base.json
 * - Helper function for Vite aliases
 */

import { readdir, readFile, writeFile, access } from "fs/promises";
import { join, dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { constants } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, "..");

interface PackageInfo {
  name: string;
  directory: string;
}

/**
 * Scans packages directory and extracts all @xndrjs packages
 */
async function scanWorkspacePackages(): Promise<PackageInfo[]> {
  const packagesDir = join(rootDir, "packages");
  const entries = await readdir(packagesDir, { withFileTypes: true });
  const packages: PackageInfo[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const pkgJsonPath = join(packagesDir, entry.name, "package.json");
    try {
      const pkgJsonContent = await readFile(pkgJsonPath, "utf-8");
      const pkgJson = JSON.parse(pkgJsonContent);
      const pkgName = pkgJson.name;

      // Only include packages that start with @xndrjs/ and have a src directory
      if (typeof pkgName === "string" && pkgName.startsWith("@xndrjs/")) {
        const srcPath = join(packagesDir, entry.name, "src");
        try {
          // Check if src directory exists
          await access(srcPath, constants.F_OK);
          packages.push({
            name: pkgName,
            directory: entry.name,
          });
        } catch {
          // Skip packages without src directory (e.g., config packages)
          continue;
        }
      }
    } catch (error) {
      // Skip packages without package.json or invalid JSON
      continue;
    }
  }

  // Sort alphabetically for consistent output
  return packages.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Generates TypeScript paths configuration
 */
function generateTypeScriptPaths(
  packages: PackageInfo[],
): Record<string, string[]> {
  const paths: Record<string, string[]> = {};

  for (const pkg of packages) {
    paths[pkg.name] = [`packages/${pkg.directory}/src`];
  }

  return paths;
}

/**
 * Generates Vite aliases map (package name -> directory name)
 */
function generateViteAliasesMap(
  packages: PackageInfo[],
): Record<string, string> {
  const aliases: Record<string, string> = {};
  for (const pkg of packages) {
    aliases[pkg.name] = pkg.directory;
  }
  return aliases;
}

/**
 * Updates packages/config-typescript/base.json with generated paths
 */
async function updateTypeScriptConfig(packages: PackageInfo[]): Promise<void> {
  const tsconfigPath = join(rootDir, "packages", "config-typescript", "base.json");
  const tsconfigContent = await readFile(tsconfigPath, "utf-8");
  const tsconfig = JSON.parse(tsconfigContent);

  // Generate and update paths
  const paths = generateTypeScriptPaths(packages);
  tsconfig.compilerOptions.paths = paths;

  // Write back with formatting
  const updatedContent =
    JSON.stringify(tsconfig, null, 2).replace(/\n/g, "\n") + "\n";
  await writeFile(tsconfigPath, updatedContent, "utf-8");

  console.log(`✓ Updated packages/config-typescript/base.json with ${packages.length} packages`);
}

/**
 * Generates vite-aliases.generated.json for runtime use by vite.config.ts files
 */
async function generateViteAliasesJson(packages: PackageInfo[]): Promise<void> {
  const aliasesMap = generateViteAliasesMap(packages);
  const outputPath = join(rootDir, "scripts", "vite-aliases.generated.json");
  const content = JSON.stringify(aliasesMap, null, 2) + "\n";
  await writeFile(outputPath, content, "utf-8");
  console.log(`✓ Generated vite-aliases.generated.json with ${packages.length} aliases`);
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log("Scanning workspace packages...");
    const packages = await scanWorkspacePackages();

    if (packages.length === 0) {
      console.warn("⚠ No @xndrjs packages found");
      return;
    }

    console.log(`Found ${packages.length} packages:`);
    packages.forEach((pkg) => {
      console.log(`  - ${pkg.name} (${pkg.directory})`);
    });

    await updateTypeScriptConfig(packages);
    await generateViteAliasesJson(packages);

    console.log("\n✓ Workspace configuration generated successfully");
  } catch (error) {
    console.error("Error generating workspace configuration:", error);
    process.exit(1);
  }
}

main();

