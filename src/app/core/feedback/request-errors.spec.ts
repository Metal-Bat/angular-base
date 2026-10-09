import { TestBed } from '@angular/core/testing';
import { ActorState } from '../auth/actor-state';
import { ApiFailure } from '../transport/api-failure';
import { RequestErrors, safeRequestReference } from './request-errors';
describe('Safe returned failure references', () => {
  it('allows bounded machine references and never accepts arbitrary text or URLs', () => {
    expect(safeRequestReference('req-001:part')).toBe('req-001:part');
    for (const value of [
      'https://private/path',
      '<script>',
      'contains spaces',
      'a'.repeat(129),
      null,
    ]) {
      expect(safeRequestReference(value)).toBeNull();
    }
  });
  it('classifies actions without inventing incident identifiers or preserving actor state', () => {
    const errors = TestBed.inject(RequestErrors);
    errors.show(new ApiFailure(503, null, 'returned-001', []));
    expect(errors.notice()).toMatchObject({
      kind: 'technical',
      code: '',
      requestReference: 'returned-001',
    });
    errors.show(new ApiFailure(409, 'CONFLICT', null, []));
    expect(errors.notice()).toMatchObject({
      kind: 'stale',
      requestReference: null,
    });
    errors.show(
      new ApiFailure(422, 'FIELDS', null, [
        { pointer: '/secret', code: 'invalid' },
      ]),
    );
    expect(errors.notice()?.kind).toBe('validation');
    expect(JSON.stringify(errors.notice())).not.toContain('/secret');
    errors.show(new ApiFailure(503, 'UNKNOWN', 'id', [], true));
    expect(errors.notice()?.kind).toBe('uncertain');
    TestBed.inject(ActorState).reset();
    expect(errors.notice()).toBeNull();
    errors.show(new ApiFailure(503, 'private payload with spaces', null, []));
    expect(errors.notice()).toBeNull();
  });
});
