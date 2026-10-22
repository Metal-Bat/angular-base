export function startStudioBrowserFixture(options?: {
  assetRoot?: string;
  conditionalWorkflow?: boolean;
  dataMapping?: boolean;
  subprocessMapping?: boolean;
  collapsedWorkflow?: boolean;
  typedChoice?: boolean;
  inlineAttachments?: boolean;
  sharedRecords?: boolean;
  administrationDetails?: boolean;
  attachmentReceipt?: "absent" | "committed" | null;
  density?: "comfortable" | "compact";
}): Promise<{
  origin: string;
  close(): Promise<void>;
}>;
