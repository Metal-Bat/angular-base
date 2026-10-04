import {
  RuntimeCompatibility,
  RuntimeDocument,
} from '../domain/runtime-document';
export type RuntimePin = Pick<
  RuntimeDocument['identity'],
  'formVersion' | 'versionNumber' | 'design'
>;
export type RuntimeDocumentReader = {
  task(
    reference: string,
    key: string,
    pin?: RuntimePin,
  ): Promise<RuntimeCompatibility>;
  request(reference: string, pin?: RuntimePin): Promise<RuntimeCompatibility>;
};
export async function readPinnedRequest(
  reader: RuntimeDocumentReader,
  reference: string,
  pin: RuntimePin,
): Promise<RuntimeCompatibility> {
  const result = await reader.request(reference, pin);
  if (result.status === 'ready') {
    const identity = result.document.identity;
    if (
      identity.formVersion !== pin.formVersion ||
      identity.versionNumber !== pin.versionNumber ||
      identity.design !== pin.design
    ) {
      return { status: 'invalid', reason: 'pin' };
    }
  }
  return result;
}
