export function startStudioBrowserFixture(): Promise<{
  origin: string;
  close(): Promise<void>;
}>;
