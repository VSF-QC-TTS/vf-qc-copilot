export function renderTemplate(template: string | null | undefined, vars: Record<string, unknown>): string | null {
  if (template == null) {
    return null;
  }
  return template.replace(/\{\{\s*([A-Za-z0-9_.-]+)\s*\}\}/g, (_match, key: string) => {
    const value = vars[key];
    return value == null ? '' : String(value);
  });
}
