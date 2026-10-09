export interface paths {
  '/api/v1/me/preferences': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Read personal workspace preferences
     * @description Read only the authenticated user's preferences. Missing settings return typed defaults and a version-zero reference without inserting a row. No other actor identifier is accepted. Returns private, no-store JSON. Authentication and user deactivation follow existing auth rules.
     */
    get: operations['read_preferences_api_v1_me_preferences_get'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    /**
     * Apply personal workspace preferences
     * @description Atomically update self settings with the current ref_id from GET. Omitted groups and nested fields are preserved; null resets an entire supplied group to documented defaults. Nested scalar nulls and unknown keys are rejected with 422. Wrong-owner references return non-disclosing 404; stale references return 409 without applying changes. A no-op keeps the current reference. Returns a fresh reference after change. Locale supports en/fa, Gregorian calendar and valid IANA zones; settings never grant screen permissions.
     */
    patch: operations['apply_preferences_api_v1_me_preferences_patch'];
    trace?: never;
  };
}
export type webhooks = Record<string, never>;
export interface components {
  schemas: {
    /**
     * ErrorResponse
     * @description Localized failure with a stable application error number.
     */
    ErrorResponse: {
      /** Code */
      code: number;
      /** Data */
      data?: {
        [key: string]: unknown;
      } | null;
      /** Error */
      error: string;
      /** Request Id */
      request_id: string;
      /**
       * Success
       * @default false
       * @constant
       */
      success: false;
    };
    /** SuccessResponse[PreferencesDTO] */
    SuccessResponse_PreferencesDTO_: {
      /**
       * Code
       * @default 200
       */
      code: number;
      data: components['schemas']['PreferencesDTO'];
      /** Error */
      error?: null;
      /** Request Id */
      request_id: string;
      /**
       * Success
       * @default true
       * @constant
       */
      success: true;
    };
    /** PreferencesDTO */
    PreferencesDTO: {
      /** @description Appearance settings. */
      appearance?: components['schemas']['AppearancePreferences'];
      /** @description Language, timezone, calendar and display digits. */
      locale?: components['schemas']['LocalePreferences'];
      notifications?: components['schemas']['NotificationPreferences'];
      /**
       * Ref Id
       * @description Current self-owned optimistic reference; version zero represents unsaved defaults.
       */
      ref_id: string;
      /**
       * Schema Version
       * @description Version of the typed personal settings contract.
       * @default 1
       * @constant
       */
      schema_version: 1;
      /** @description Personal workspace defaults. */
      workspace?: components['schemas']['WorkspacePreferences'];
    };
    /** WorkspacePreferences */
    WorkspacePreferences: {
      /**
       * Landing Key
       * @description Allowlisted landing route key; a preference grants no screen permission.
       * @default requests
       * @enum {string}
       */
      landing_key: 'requests' | 'work_items' | 'studio' | 'dashboard';
      /**
       * Page Size
       * @description Default list page size, from 1 through 100 items.
       * @default 20
       */
      page_size: number;
    };
    /** NotificationPreferences */
    NotificationPreferences: {
      /**
       * Email Enabled
       * @description Opt in to optional application email; mandatory security and approval notices remain enabled.
       * @default false
       */
      email_enabled: boolean;
    };
    /** LocalePreferences */
    LocalePreferences: {
      /**
       * Calendar
       * @description Gregorian calendar only; Persian language does not select a different calendar.
       * @default gregory
       * @constant
       */
      calendar: 'gregory';
      /**
       * Language
       * @description Preferred presentation language; canonical data stays unchanged.
       * @default en
       * @enum {string}
       */
      language: 'en' | 'fa';
      /**
       * Numbering
       * @description Preferred display digits; stored numbers keep their canonical format.
       * @default latn
       * @enum {string}
       */
      numbering: 'latn' | 'arabext';
      /**
       * Timezone
       * @description Valid IANA timezone for presentation; timestamps remain UTC.
       * @default UTC
       */
      timezone: string;
    };
    /** AppearancePreferences */
    AppearancePreferences: {
      /**
       * Density
       * @description Workspace control density.
       * @default comfortable
       * @enum {string}
       */
      density: 'comfortable' | 'compact';
      /**
       * Theme Key
       * @description Approved workspace palette key, shared with the frontend.
       * @default blue
       * @enum {string}
       */
      theme_key:
        'blue' | 'indigo' | 'violet' | 'emerald' | 'teal' | 'rose' | 'amber';
      /**
       * Theme Mode
       * @description Appearance mode; system follows the device preference.
       * @default system
       * @enum {string}
       */
      theme_mode: 'light' | 'dark' | 'system';
    };
    /**
     * PreferencesPatch
     * @example {
     *       "appearance": {
     *         "theme_mode": "dark"
     *       },
     *       "locale": {
     *         "language": "fa",
     *         "timezone": "Asia/Tehran"
     *       },
     *       "ref_id": "current-reference-from-read"
     *     }
     */
    PreferencesPatch: {
      /** @description Omitted preserves appearance; null resets this group; an object merges only supplied fields. */
      appearance?: components['schemas']['AppearancePreferences'] | null;
      /** @description Omitted preserves locale; null resets this group; an object merges only supplied fields. */
      locale?: components['schemas']['LocalePreferences'] | null;
      /** @description Omitted preserves notification preferences; null resets optional email to disabled. */
      notifications?: components['schemas']['NotificationPreferences'] | null;
      /**
       * Ref Id
       * @description Expected reference from the latest preferences read; stale writes return a conflict.
       */
      ref_id: string;
      /** @description Omitted preserves workspace; null resets this group; an object merges only supplied fields. */
      workspace?: components['schemas']['WorkspacePreferences'] | null;
    };
  };
  responses: never;
  parameters: never;
  requestBodies: never;
  headers: never;
  pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
  read_preferences_api_v1_me_preferences_get: {
    parameters: {
      query?: never;
      header?: {
        /** @description Optional caller-controlled client software identifier for audit and diagnostics; captured up to 1024 characters. Browsers supply their own value and may ignore manual Swagger overrides. Not trusted client identity or authorization. */
        'User-Agent'?: string | null;
        /**
         * @description Optional RFC 9110 HTTP-date generated by native clients for advisory diagnostics. Browser JavaScript cannot set Date. Missing or invalid values do not reject the request.
         * @example Mon, 28 Sep 2026 12:00:00 GMT
         */
        Date?: string;
        /**
         * @description Optional preferred response language. English and Farsi are supported; regional tags use their base language and unsupported values fall back to English.
         * @example fa-IR
         */
        'Accept-Language'?: string;
        /** @description Optional UUIDv7 correlation identifier. Missing or invalid values are replaced with a generated UUIDv7; the effective value is returned in X-Request-ID. */
        'X-Request-ID'?: string;
        /**
         * @description Optional caller-supplied reason recorded in audit history. It is not an authorization credential.
         * @example Correcting a submitted request
         */
        'X-Audit-Reason'?: string;
      };
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          /** @description Protected actor-specific response; persistent caching is prohibited. */
          'Cache-Control'?: 'private, no-store';
          /** @description Present as check-device-time only when the configured apparent difference threshold is reached. */
          'X-Client-Date-Advisory'?: 'check-device-time';
          /** @description Signed server receipt minus client Date in seconds; includes transit and generation delay, so it is not exact clock skew. */
          'X-Client-Date-Delta-Seconds'?: number;
          /** @description Optional client Date reading: available, unavailable, or invalid. No request is rejected for this diagnostic. */
          'X-Client-Date-Status'?: 'available' | 'unavailable' | 'invalid';
          /** @description Server UTC receipt timestamp. Response Date, when present, is generated by the HTTP server or proxy. */
          'X-Server-Received-At'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['SuccessResponse_PreferencesDTO_'];
        };
      };
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Not Found */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Conflict */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Content Too Large */
      413: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Unprocessable Content */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Locked */
      423: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Too Many Requests */
      429: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Service Unavailable */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
    };
  };
  apply_preferences_api_v1_me_preferences_patch: {
    parameters: {
      query?: never;
      header?: {
        /** @description Optional caller-controlled client software identifier for audit and diagnostics; captured up to 1024 characters. Browsers supply their own value and may ignore manual Swagger overrides. Not trusted client identity or authorization. */
        'User-Agent'?: string | null;
        /**
         * @description Optional RFC 9110 HTTP-date generated by native clients for advisory diagnostics. Browser JavaScript cannot set Date. Missing or invalid values do not reject the request.
         * @example Mon, 28 Sep 2026 12:00:00 GMT
         */
        Date?: string;
        /**
         * @description Optional preferred response language. English and Farsi are supported; regional tags use their base language and unsupported values fall back to English.
         * @example fa-IR
         */
        'Accept-Language'?: string;
        /** @description Optional UUIDv7 correlation identifier. Missing or invalid values are replaced with a generated UUIDv7; the effective value is returned in X-Request-ID. */
        'X-Request-ID'?: string;
        /**
         * @description Optional caller-supplied reason recorded in audit history. It is not an authorization credential.
         * @example Correcting a submitted request
         */
        'X-Audit-Reason'?: string;
      };
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['PreferencesPatch'];
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          /** @description Protected actor-specific response; persistent caching is prohibited. */
          'Cache-Control'?: 'private, no-store';
          /** @description Present as check-device-time only when the configured apparent difference threshold is reached. */
          'X-Client-Date-Advisory'?: 'check-device-time';
          /** @description Signed server receipt minus client Date in seconds; includes transit and generation delay, so it is not exact clock skew. */
          'X-Client-Date-Delta-Seconds'?: number;
          /** @description Optional client Date reading: available, unavailable, or invalid. No request is rejected for this diagnostic. */
          'X-Client-Date-Status'?: 'available' | 'unavailable' | 'invalid';
          /** @description Server UTC receipt timestamp. Response Date, when present, is generated by the HTTP server or proxy. */
          'X-Server-Received-At'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['SuccessResponse_PreferencesDTO_'];
        };
      };
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Not Found */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Conflict */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Content Too Large */
      413: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Unprocessable Content */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Locked */
      423: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Too Many Requests */
      429: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Service Unavailable */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
    };
  };
}
