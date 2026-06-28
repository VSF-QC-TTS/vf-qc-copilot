export function parseJsonObject(value: string | null | undefined): Record<string, unknown> {
  if (!value?.trim()) {
    return {};
  }
  const parsed = JSON.parse(value) as unknown;
  if (parsed === null || Array.isArray(parsed) || typeof parsed !== 'object') {
    return {};
  }
  return parsed as Record<string, unknown>;
}

export function stringifyJson(value: unknown): string {
  return JSON.stringify(value ?? {});
}

export function readPath(source: unknown, path: string | null | undefined): unknown {
  if (!path || path === '$') {
    return source;
  }
  if (!path.startsWith('$.')) {
    return undefined;
  }
  return path
    .slice(2)
    .split('.')
    .reduce<unknown>((current, segment) => {
      if (current === null || typeof current !== 'object') {
        return undefined;
      }
      return (current as Record<string, unknown>)[segment];
    }, source);
}
