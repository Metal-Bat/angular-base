import { choiceRequest } from './choice-request';
describe('Frozen resource selection requests', () => {
  it('requires a release parent and keeps it in query rather than selector path', () => {
    expect(() => choiceRequest('client_releases', {}, {}, 'en')).toThrow(
      'client',
    );
    const request = choiceRequest(
      'client_releases',
      { page: 2, size: 20 },
      { client_ref_id: 'parent' },
      'en',
    );
    expect(request.id).toBe(
      'select_releases_api_v1_client_releases_select_post',
    );
    expect(request.input.query).toEqual({
      response_format: 'page',
      client_ref_id: 'parent',
    });
    expect(request.input.body).toEqual({ page: 2, size: 20 });
  });
  it('distinguishes library roots, published pins and canonical connection kinds', () => {
    expect(
      choiceRequest(
        'components',
        { page: 1, size: 20, search: 'Form' },
        {},
        'fa',
      ).roots,
    ).toBe(true);
    expect(
      choiceRequest('components', { page: 1, size: 20 }, {}, 'en').input.body[
        'filters'
      ],
    ).toEqual([{ field_name: 'is_active', operation: 'equal', value: true }]);
    const version = choiceRequest(
      'component_versions',
      { page: 1, size: 20 },
      {},
      'fa',
    );
    expect(version.roots).toBe(false);
    expect(version.input.body['kind']).toBe('component');
    expect(version.input.body['locale']).toBe('fa');
    expect(() =>
      choiceRequest('connections', {}, { kind: 'service' }, 'en'),
    ).toThrow('kind');
    expect(
      choiceRequest('connections', {}, { kind: 'SERVICE' }, 'en').input.query[
        'kind'
      ],
    ).toBe('SERVICE');
    expect(choiceRequest('step_versions', {}, {}, 'en').id).toBe(
      'select_step_types_api_v1_step_types_select_post',
    );
    expect(() => choiceRequest('unregistered', {}, {}, 'en')).toThrow(
      'unavailable',
    );
  });
});
