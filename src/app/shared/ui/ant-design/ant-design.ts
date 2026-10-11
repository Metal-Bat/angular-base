import { DOCUMENT } from '@angular/common';
import { Directive, effect, inject } from '@angular/core';
import {
  ar_EG,
  en_US,
  fa_IR,
  NZ_I18N,
  NzI18nService,
} from 'ng-zorro-antd/i18n';
import { Locale } from '../../../core/localization/locale';

/** Apply to a boundary containing NG-ZORRO components; pair with CDK [dir]. */
@Directive({
  selector: '[appAntDesign]',
  host: { class: 'ant-design' },
  providers: [NzI18nService, { provide: NZ_I18N, useValue: en_US }],
})
export class AntDesign {
  constructor() {
    const document = inject(DOCUMENT);
    const locale = inject(Locale);
    const i18n = inject(NzI18nService);
    if (!document.getElementById('ant-design-styles')) {
      const link = document.createElement('link');
      link.id = 'ant-design-styles';
      link.rel = 'stylesheet';
      link.href = '/ui/ant-design.css';
      document.head.append(link);
    }
    effect(() => {
      i18n.setLocale(
        locale.language() === 'fa'
          ? fa_IR
          : locale.language() === 'ar'
            ? ar_EG
            : en_US,
      );
    });
  }
}
