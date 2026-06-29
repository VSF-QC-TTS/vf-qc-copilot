declare module 'parse-curl' {
  export default function parseCurl(curl: string): {
    method: string;
    url: string;
    headers?: Record<string, string>;
    body?: string;
  };
}
