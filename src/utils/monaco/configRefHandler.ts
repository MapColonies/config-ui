import * as monaco from 'monaco-editor';
import { jsonFormatter } from '../jsonFormatter';
import { GetVersionedConfigData } from '../../api/client';
import { calcConfigVersion, fetchConfigData } from '../../api/services/configDataFetcher';

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

export const isConfigRef = (text: string): boolean => {
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

async function dereferenceObject(obj: JsonValue, depth: number = 0): Promise<JsonValue> {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return Promise.all(obj.map(async (item) => dereferenceObject(item, depth + 1)));
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
    // Recursively dereference the fetched config
    const dereferencedConfig = await dereferenceObject(configResponse.config as JsonObject, depth + 1);
    // Merge the dereferenced config with other properties
    const { $ref, ...rest } = obj;
    const result = await dereferenceObject({ ...(dereferencedConfig as JsonObject), ...rest }, depth + 1);
    return result;
  }

  const result: JsonObject = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = await dereferenceObject(value, depth + 1);
  }
  return result;
}

export const dereferenceConfig = async (input: string): Promise<string> => {
  const parsedInput: JsonValue = JSON.parse(input);
  const dereferencedObject = await dereferenceObject(parsedInput);
  const modifiedInput = jsonFormatter(dereferencedObject);
  return modifiedInput;
};

function isRefObject(obj: JsonObject): obj is RefObject {
  return '$ref' in obj && typeof obj.$ref === 'object' && obj.$ref !== null && 'configName' in obj.$ref && 'version' in obj.$ref;
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
