import { signal, WritableSignal } from '@angular/core';
import { ApiFailure } from '../../../../core/transport/api-failure';
import { TestBed } from '@angular/core/testing';
import { ActorState } from '../../../../core/auth/actor-state';
import { FORM_RESOURCES } from '../../bindings';
import { Attachment } from '../../application/form-resources';
import { readRuntimeDocument } from '../../infrastructure/runtime-document-adapter';
import { runtimeFixture } from '../../testing/runtime-fixtures';
import { AttachmentControl } from './attachment-control';

async function setup(): Promise<{
  fixture: ReturnType<typeof TestBed.createComponent<AttachmentControl>>;
  resolve: (items: readonly Attachment[]) => void;
  upload: ReturnType<typeof vi.fn>;
  read: ReturnType<typeof vi.fn>;
  owner: WritableSignal<string>;
}> {
  let resolve!: (items: readonly Attachment[]) => void;
  const pending = new Promise<readonly Attachment[]>((done) => {
    resolve = done;
  });
  const upload = vi.fn(async () => undefined);
  const read = vi.fn(() => pending);
  const owner = signal('case-one');
  TestBed.configureTestingModule({
    providers: [
      {
        provide: FORM_RESOURCES,
        useValue: {
          ownerKey: owner,
          attachments: read,
          upload,
          transferBusy: (): boolean => false,
          pendingAttachment: (): null => null,
          progress: (): null => null,
        },
      },
    ],
  });
  const result = readRuntimeDocument(runtimeFixture());
  if (result.status !== 'ready') {
    throw new Error('Invalid runtime fixture');
  }
  const fixture = TestBed.createComponent(AttachmentControl);
  fixture.componentRef.setInput('document', result.document);
  fixture.componentRef.setInput('path', '/amount');
  fixture.componentRef.setInput('writable', true);
  fixture.componentRef.setInput('node', {
    component: 'attachment_collection',
    key: 'documents',
    scope: '/properties/amount',
    label: 'Stored label',
    renderer: 'default',
    children: [],
    display: {
      accessibility: {
        label: 'Supporting documents',
        description: 'Private case evidence.',
      },
      localized_text: { help: 'Attach your receipt.' },
      options: {},
    },
  });
  await fixture.whenStable();
  return { fixture, resolve, upload, read, owner };
}

describe('Private attachment presentation', () => {
  it('uses resolved accessible labels and help', async () => {
    const { fixture } = await setup();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('legend')?.textContent).toBe(
      'Supporting documents',
    );
    expect(element.textContent).toContain('Attach your receipt.');
    expect(element.textContent).toContain('Private case evidence.');
    const hint = element.querySelector('[id$="-hint"]');
    expect(hint).not.toBeNull();
    expect(
      element.querySelector('fieldset')?.getAttribute('aria-describedby'),
    ).toBe(hint?.id);
  });
  it('clears private captions and ignores late attachment reads after actor reset', async () => {
    const { fixture, resolve } = await setup();
    const vm = fixture.componentInstance;
    vm.caption.set('Private caption');
    TestBed.inject(ActorState).reset();
    resolve([
      {
        ref: 'private',
        kind: 'file',
        path: '/amount',
        caption: 'Private receipt',
        contentType: 'text/plain',
        size: 10,
        position: 0,
      },
    ]);
    await fixture.whenStable();
    expect(vm.caption()).toBe('');
    expect(vm.attachments()).toEqual([]);
    expect(vm.loading()).toBe(false);
    expect(fixture.nativeElement.textContent).not.toContain('Private receipt');
  });
  it('keeps a caption across current-reference rotation, but clears it on field change', async () => {
    const { fixture } = await setup();
    const vm = fixture.componentInstance;
    vm.caption.set('Unsent receipt caption');
    const document = vm.document();
    fixture.componentRef.setInput('document', {
      ...document,
      identity: {
        ...document.identity,
        resource: 'rotated-current',
        submission: 'rotated-submission',
      },
    });
    await fixture.whenStable();
    expect(vm.caption()).toBe('Unsent receipt caption');
    fixture.componentRef.setInput('path', '/other-documents');
    fixture.componentRef.setInput('node', {
      ...vm.node(),
      scope: '/properties/other-documents',
    });
    await fixture.whenStable();
    expect(vm.caption()).toBe('');
  });
  it('keeps confirmed content during revision refresh and accepts the newest list', async () => {
    const { fixture, resolve, read } = await setup();
    const vm = fixture.componentInstance;
    const saved: Attachment = {
      ref: 'old',
      kind: 'image',
      path: '/amount',
      caption: 'Current image',
      contentType: 'image/png',
      size: 4,
      position: 0,
    };
    resolve([saved]);
    await vi.waitFor(() => expect(vm.attachments()).toEqual([saved]));
    vm.caption.set('Replacement caption');
    vm.kind.set('image');
    let newer!: (items: readonly Attachment[]) => void;
    read.mockReturnValueOnce(
      new Promise<readonly Attachment[]>((done) => {
        newer = done;
      }),
    );
    const document = vm.document();
    fixture.componentRef.setInput('document', {
      ...document,
      identity: { ...document.identity, resource: 'new-revision' },
    });
    await fixture.whenStable();
    expect(vm.loading()).toBe(true);
    expect(vm.attachments()).toEqual([saved]);
    expect(vm.caption()).toBe('Replacement caption');
    expect(vm.kind()).toBe('image');
    fixture.componentRef.setInput('node', {
      ...vm.node(),
      display: { ...vm.node().display },
    });
    await fixture.whenStable();
    expect(vm.kind()).toBe('image');
    await vm.locale.set('fa');
    await fixture.whenStable();
    expect(vm.kind()).toBe('image');
    newer([]);
    await vi.waitFor(() => expect(vm.attachments()).toEqual([]));
    expect(vm.caption()).toBe('Replacement caption');
  });
  it('clears private state on a changed local owner and refuses late prior-owner content', async () => {
    const { fixture, resolve, read, owner } = await setup();
    const vm = fixture.componentInstance;
    vm.caption.set('Private caption');
    read.mockReturnValueOnce(
      new Promise<readonly Attachment[]>(() => undefined),
    );
    owner.set('case-two');
    await fixture.whenStable();
    resolve([
      {
        ref: 'old',
        kind: 'file',
        path: '/amount',
        caption: 'Old case',
        contentType: 'text/plain',
        size: 3,
        position: 0,
      },
    ]);
    await Promise.resolve();
    expect(vm.caption()).toBe('');
    expect(vm.attachments()).toEqual([]);
  });
  it('retains confirmed content on transient failure but clears it after current authorization is denied', async () => {
    const { fixture, resolve, read } = await setup();
    const vm = fixture.componentInstance;
    const saved: Attachment = {
      ref: 'old',
      kind: 'file',
      path: '/amount',
      caption: 'Private receipt',
      contentType: 'text/plain',
      size: 3,
      position: 0,
    };
    resolve([saved]);
    await vi.waitFor(() => expect(vm.attachments()).toEqual([saved]));
    for (const [revision, failure] of [
      ['network', Error('Offline')],
      ['denied', new ApiFailure(403, 100, null, [])],
    ] as const) {
      read.mockRejectedValueOnce(failure);
      const document = vm.document();
      fixture.componentRef.setInput('document', {
        ...document,
        identity: { ...document.identity, resource: revision },
      });
      await fixture.whenStable();
      await vi.waitFor(() => expect(vm.loading()).toBe(false));
      expect(vm.attachments()).toEqual(revision === 'network' ? [saved] : []);
    }
    expect(vm.accessLost()).toBe(true);
    expect(vm.disabled()).toBe(true);
  });
  it('does not dispatch scalar media through the collection association command', async () => {
    const { fixture, resolve, upload } = await setup();
    resolve([]);
    const vm = fixture.componentInstance;
    fixture.componentRef.setInput('node', { ...vm.node(), component: 'media' });
    await fixture.whenStable();
    await vm.uploadFile(
      new File(['image'], 'image.png', { type: 'image/png' }),
    );
    expect(upload).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain(
      'Inline media is unavailable for this field.',
    );
  });
});
