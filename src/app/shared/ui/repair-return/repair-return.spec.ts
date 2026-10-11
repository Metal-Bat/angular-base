import { TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { SessionContext } from '../../../core/auth/session-context';
import { RepairReturn } from './repair-return';

describe('Repair return context lifetime', () => {
  it('tracks same-route context changes, bounds nodes and removes unauthorized destinations', () => {
    const query = new BehaviorSubject(convertToParamMap({}));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: query,
            snapshot: { queryParamMap: query.value },
          },
        },
      ],
    });
    const session = TestBed.inject(SessionContext);
    session.resolve({
      status: 'authenticated',
      permissions: ['workflows.manage'],
    });
    const vm = TestBed.createComponent(RepairReturn).componentInstance;
    expect(vm.context()).toBeNull();
    query.next(
      convertToParamMap({
        repair_definition: 'current-one',
        repair_node: 'review',
        repair_client: 'release-one',
      }),
    );
    expect(vm.context()).toEqual({
      selected: 'current-one',
      repair_node: 'review',
      client_release: 'release-one',
    });
    query.next(
      convertToParamMap({
        repair_definition: 'current-two',
        repair_node: 'x'.repeat(300),
      }),
    );
    expect(vm.context()?.selected).toBe('current-two');
    expect(vm.context()?.repair_node).toHaveLength(256);
    expect(vm.context()?.client_release).toBe('');
    query.next(convertToParamMap({ repair_definition: 'x'.repeat(513) }));
    expect(vm.context()).toBeNull();
    query.next(convertToParamMap({ repair_definition: 'current-two' }));
    session.updatePermissions([]);
    expect(vm.context()).toBeNull();
    session.clear();
    expect(vm.context()).toBeNull();
  });
});
