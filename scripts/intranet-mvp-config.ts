#!/usr/bin/env node
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

type IntranetPreset = {
  model: {
    provider: "openai";
    baseURL: string;
    apiKey: string;
    model: string;
  };
  update: {
    checkOnStart: boolean;
    auto: {
      enabled: boolean;
    };
  };
  channels: Record<string, { enabled: boolean }>;
  skills: {
    entries: {
      shell: { enabled: boolean };
      browser: { enabled: boolean };
      web_search: { enabled: boolean };
    };
  };
  agents: {
    defaults: {
      maxHistoryMessages: number;
      skills: string[];
    };
  };
};

const DEFAULT_OUTPUT = path.join(os.homedir(), ".openclaw", "openclaw.intranet.json");

function parseArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1) {
    return undefined;
  }

  return process.argv[index + 1];
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

function usage(): void {
  console.log(`Usage: node --import tsx scripts/intranet-mvp-config.ts [options]

Options:
  --base-url <url>      Internal OpenAI-compatible endpoint (required)
  --api-key <key>       Internal API key (required)
  --model <name>        Model id (default: qwen2.5-32b-instruct)
  --max-history <n>     Sliding window messages for weak models (default: 8)
  --output <path>       Output file path (default: ~/.openclaw/openclaw.intranet.json)
  --print               Print JSON only, do not write to disk
  --help                Show this help
`);
}

async function main(): Promise<void> {
  if (hasFlag("--help")) {
    usage();
    return;
  }

  const baseURL = parseArg("--base-url");
  const apiKey = parseArg("--api-key");

  if (!baseURL || !apiKey) {
    usage();
    process.exitCode = 1;
    return;
  }

  const model = parseArg("--model") ?? "qwen2.5-32b-instruct";
  const maxHistoryRaw = parseArg("--max-history") ?? "8";
  const maxHistoryMessages = Number.parseInt(maxHistoryRaw, 10);

  if (!Number.isFinite(maxHistoryMessages) || maxHistoryMessages < 1) {
    throw new Error(`--max-history must be a positive integer, got: ${maxHistoryRaw}`);
  }

  const preset: IntranetPreset = {
    model: {
      provider: "openai",
      baseURL,
      apiKey,
      model,
    },
    update: {
      checkOnStart: false,
      auto: {
        enabled: false,
      },
    },
    channels: {
      whatsapp: { enabled: false },
      telegram: { enabled: false },
      discord: { enabled: false },
      slack: { enabled: false },
      signal: { enabled: false },
      imessage: { enabled: false },
    },
    skills: {
      entries: {
        shell: { enabled: false },
        browser: { enabled: false },
        web_search: { enabled: false },
      },
    },
    agents: {
      defaults: {
        maxHistoryMessages,
        // Keep skills explicit so weak models only see coarse-grained internal tools.
        skills: ["internal_ticket_lookup", "internal_wiki_answer"],
      },
    },
  };

  const json = `${JSON.stringify(preset, null, 2)}\n`;

  if (hasFlag("--print")) {
    process.stdout.write(json);
    return;
  }

  const output = parseArg("--output") ?? DEFAULT_OUTPUT;
  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(output, json, "utf8");
  console.log(`Wrote intranet preset config: ${output}`);
  console.log("Next step: openclaw gateway run --config", output);
}

void main();
