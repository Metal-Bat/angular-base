import { FormVersion } from '../domain/form-version';

export type FormVersionReader = {
  readVersion(reference: string): Promise<FormVersion>;
};

// The caller chooses an exact version. Never substitute a newer definition version.
export async function readPinnedFormVersion(
  reader: FormVersionReader,
  reference: string,
): Promise<FormVersion> {
  const version = await reader.readVersion(reference);
  if (version.versionReference !== reference) {
    throw new Error(
      'The returned form version does not match the pinned reference.',
    );
  }
  return version;
}
