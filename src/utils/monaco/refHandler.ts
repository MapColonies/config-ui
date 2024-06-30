import * as monaco from 'monaco-editor';
import { queryClient } from '../../api/tanstack/queryClient';
import { jsonFormatter } from '../jsonFormatter';
import { getVersionedConfig, GetVersionedConfigData, GetVersionedConfigResponse, version as Version } from '../../api/client';

type RefObject = {
  $ref: {
    configName: string;
    version: string;
  };
} & JsonObject;

type JsonObject = { [key: string]: JsonValue };
type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
type JsonArray = JsonValue[];

const refConfigRegex =
  /"\$ref"\s*:\s*\{\s*(?:"configName"\s*:\s*"(?<configName>[^"]*)"\s*,\s*"version"\s*:\s*"(?<version>[^"]*)"|"version"\s*:\s*"(?<version2>[^"]*)"\s*,\s*"configName"\s*:\s*"(?<configName2>[^"]*)")\s*\}/s;

export const isRef = (text: string): boolean => {
  return refConfigRegex.test(text);
};

const configObjectRegex = /"configName": "(.*?)", "version": "(.*?)"/;
export const extractRefConfigObject = (text: string): { configName: string; version: string } => {
  const match = text.match(configObjectRegex);
  if (!match) {
    throw new Error('Invalid $ref object');
  }

  return {
    configName: match[1],
    version: match[2],
  };
};

async function dereferenceObject(obj: JsonValue): Promise<JsonValue> {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return Promise.all(obj.map(dereferenceObject));
  }

  if (isRefObject(obj)) {
    const configParams: GetVersionedConfigData = {
      name: obj.$ref.configName,
      version: calcConfigVersion(obj.$ref.version || 'latest'),
      shouldDereference: true,
    };
    const configResponse = await fetchConfigData(configParams);
    if (!configResponse) {
      throw new Error(`Failed to fetch config for ${configParams.name}`);
    }

    // Merge the dereferenced config with other properties
    const { $ref, ...rest } = obj;
    return { ...rest, ...(configResponse.config as JsonObject) };
  }

  const result: JsonObject = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = await dereferenceObject(value);
  }
  return result;
}

export const dereference = async (input: string): Promise<string> => {
  const parsedInput: JsonValue = JSON.parse(input);

  const dereferencedObject = await dereferenceObject(parsedInput);
  const modifiedInput = jsonFormatter(dereferencedObject);
  return modifiedInput;
};

function isRefObject(obj: JsonObject): obj is RefObject {
  return '$ref' in obj && typeof obj.$ref === 'object' && obj.$ref !== null && 'configName' in obj.$ref && 'version' in obj.$ref;
}

export async function fetchConfigData(config: GetVersionedConfigData): Promise<GetVersionedConfigResponse | undefined> {
  const queryHash = createGetVersionedConfigQueryHash(config);
  const cacheConfig = queryClient.getQueryCache().get<GetVersionedConfigResponse>(queryHash)?.state.data;
  const configResponse =
    cacheConfig ??
    (await queryClient.fetchQuery({
      queryKey: [getVersionedConfig.name, config.name, config.version],
      queryFn: () => getVersionedConfig(config),
      queryHash: queryHash,
    }));

  return configResponse;
}

export function createGetVersionedConfigQueryHash(config: GetVersionedConfigData): string {
  return `${getVersionedConfig.name}${config.name}${config.version}`;
}

export function calcConfigVersion(stringVersion: string): Version {
  if (stringVersion === 'latest') {
    return 'latest';
  }
  try {
    return parseInt(stringVersion);
  } catch (e) {
    return 0;
  }
}

const refRegex = /"\$ref"\s*:\s*(\{[^{}]*\})/g;

export function extractRefConfig(model: monaco.editor.ITextModel, position: monaco.Position): GetVersionedConfigData | null {
  const fullText = model.getValue();
  const matches = [...fullText.matchAll(refRegex)];

  for (const match of matches) {
    const matchStart = fullText.indexOf(match[0]);
    const matchEnd = matchStart + match[0].length;
    const cursorOffset = model.getOffsetAt(position);

    const isCursorWithinMatch = cursorOffset >= matchStart && cursorOffset <= matchEnd;

    if (isCursorWithinMatch) {
      const refObject = JSON.parse(match[1]);

      const refConfigData: GetVersionedConfigData = {
        name: refObject.configName,
        version: calcConfigVersion(refObject.version),
      };
      return refConfigData;
    }
  }
  return null;
}
