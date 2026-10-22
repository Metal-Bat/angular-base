import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActorState } from '../../../core/auth/actor-state';
import { PersonalCollections } from '../../../core/resources/personal-collections';
import { ResourceLinks } from '../../../core/resources/resource-links';
import { FavoriteAction } from './favorite-action';

describe('Persisted favorite membership', () => {
  const mint = vi.fn();
  const favorites = vi.fn();
  const favorite = vi.fn();
  const unfavorite = vi.fn();
  const existing = {
    ref_id: 'favorite-revision',
    target: { locator: 'stable-form' },
  };
  beforeEach(() => {
    mint.mockReset().mockResolvedValue({ locator: 'stable-form' });
    favorites
      .mockReset()
      .mockResolvedValue({ items: [existing], totalPages: 1 });
    favorite.mockReset().mockResolvedValue(existing);
    unfavorite.mockReset().mockResolvedValue(undefined);
    TestBed.configureTestingModule({
      providers: [
        {
          provide: PersonalCollections,
          useValue: { favorites, favorite, unfavorite },
        },
        { provide: ResourceLinks, useValue: { mint } },
      ],
    });
  });
  async function setup(): Promise<ComponentFixture<FavoriteAction>> {
    const fixture = TestBed.createComponent(FavoriteAction);
    fixture.componentRef.setInput('kind', 'forms');
    fixture.componentRef.setInput('reference', 'target-new-revision');
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }
  it('matches stable identity after target revision and deletes the favorite reference', async () => {
    const fixture = await setup();
    const vm = fixture.componentInstance;
    expect(vm.saved()).toBe(true);
    expect(
      fixture.nativeElement
        .querySelector('button')
        .getAttribute('aria-pressed'),
    ).toBe('true');
    favorites.mockResolvedValue({ items: [], totalPages: 0 });
    await vm.toggle();
    expect(unfavorite).toHaveBeenCalledWith('favorite-revision');
    expect(favorite).not.toHaveBeenCalled();
    expect(vm.saved()).toBe(false);
  });
  it('does not display successful creation as persisted until authoritative reads confirm it', async () => {
    favorites.mockResolvedValue({ items: [], totalPages: 0 });
    const vm = (await setup()).componentInstance;
    await vm.toggle();
    expect(favorite).toHaveBeenCalledWith({
      kind: 'forms',
      ref_id: 'target-new-revision',
    });
    expect(vm.saved()).toBe(false);
  });
  it('blocks another intent after an unknown response until membership is refreshed', async () => {
    const vm = (await setup()).componentInstance;
    unfavorite.mockRejectedValue(Error('Connection lost'));
    await vm.toggle();
    expect(vm.ready()).toBe(false);
    await vm.toggle();
    expect(unfavorite).toHaveBeenCalledTimes(1);
    favorites.mockResolvedValue({ items: [], totalPages: 0 });
    await vm.refresh();
    expect(vm.ready()).toBe(true);
    expect(vm.saved()).toBe(false);
  });
  it('fences rapid clicks and late results after actor cleanup', async () => {
    const vm = (await setup()).componentInstance;
    let finish!: () => void;
    unfavorite.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const pending = vm.toggle();
    await vm.toggle();
    expect(unfavorite).toHaveBeenCalledTimes(1);
    TestBed.inject(ActorState).reset();
    finish();
    await pending;
    expect(vm.saved()).toBe(false);
    expect(vm.ready()).toBe(false);
    expect(mint).toHaveBeenCalledTimes(1);
  });
  it('reads later pages before reporting absence', async () => {
    favorites
      .mockResolvedValueOnce({ items: [], totalPages: 2 })
      .mockResolvedValueOnce({ items: [existing], totalPages: 2 });
    const vm = (await setup()).componentInstance;
    expect(favorites.mock.calls).toEqual([[1], [2]]);
    expect(vm.saved()).toBe(true);
  });
});
