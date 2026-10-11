export interface paths {
  '/api/v1/inbox/events': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Stream private inbox updates
     * @description Recipient-only SSE invalidations over the persisted unified inbox. Requires an active bearer access token, user, session and registered client. No query parameters or user_id are accepted. Native EventSource needs an authenticated Node proxy; direct clients use streaming fetch with Authorization. Subscribe then refresh inbox/search and inbox/unread on inbox.resync, on reconnect and at least every 60 seconds. Last-Event-ID is an optional bounded reconnect hint, not an authorized replay cursor. inbox.changed contains only schema_version and notification_ref_id; its SSE id is the same reference. Deduplicate ids and coalesce refreshes. No subject, business data, password, URL or error is streamed. Heartbeat and authorization checks have a 15-second cadence; authorization probes are bounded to 3 seconds and changed events recheck authorization before sending. A stream lasts at most 300 seconds, receives at most 256 signals, and times out blocked sends after 5 seconds. Limit 3 streams per recipient and 200 per configured cache namespace across processes. No stream-long database session. Offline/missed signals remain in persisted search. Authentication or service failure after headers closes the stream; pre-stream errors use existing JSON envelopes. Success is text/event-stream, never a JSON success envelope. Private no-store/no-transform; proxies must disable buffering/compression and propagate disconnects. This backend contract does not establish browser or Node proxy acceptance.
     */
    get: operations['events_api_v1_inbox_events_get'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/inbox/report': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Report unified notifications
     * @description Authenticated recipient-only unified inbox version 1. Case, work_item, ai_approval, report and account destinations resolve current owner-authorized references on every read. Calendar/support/operation targets are reserved and unavailable until their producers exist. An unavailable, deleted, revoked, expired or cancelled target exposes no private subject, content or reference. Stored labels never confer authority. Search is bounded and deterministic with existing filters/order/page/size plus unread=true/false; report is the same paginated search, not a queued archive. Unread totals count live ACTIVE unread inbox rows, including redacted unavailable destinations. Mark-read changes only read metadata, requires a current optimistic ref (409 when stale), and never decides or acts on a workflow. Non-owned refs fail 403; missing/deleted refs fail 404. Null read bodies are rejected; actions accept an empty object. UTC timestamps; en/fa template locale is chosen when staged with en fallback. Private no-store success/page envelopes, existing 401/403/404/409/422 errors. Refresh refs from mutation responses. Optional email defaults off; mandatory notices ignore optional opt-out. No delivery is performed by these reads.
     */
    post: operations['search_api_v1_inbox_report_post'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/inbox/search': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Search unified notifications
     * @description Authenticated recipient-only unified inbox version 1. Case, work_item, ai_approval, report and account destinations resolve current owner-authorized references on every read. Calendar/support/operation targets are reserved and unavailable until their producers exist. An unavailable, deleted, revoked, expired or cancelled target exposes no private subject, content or reference. Stored labels never confer authority. Search is bounded and deterministic with existing filters/order/page/size plus unread=true/false; report is the same paginated search, not a queued archive. Unread totals count live ACTIVE unread inbox rows, including redacted unavailable destinations. Mark-read changes only read metadata, requires a current optimistic ref (409 when stale), and never decides or acts on a workflow. Non-owned refs fail 403; missing/deleted refs fail 404. Null read bodies are rejected; actions accept an empty object. UTC timestamps; en/fa template locale is chosen when staged with en fallback. Private no-store success/page envelopes, existing 401/403/404/409/422 errors. Refresh refs from mutation responses. Optional email defaults off; mandatory notices ignore optional opt-out. No delivery is performed by these reads.
     */
    post: operations['search_api_v1_inbox_search_post'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/inbox/unread': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Read unified unread total
     * @description Authenticated recipient-only unified inbox version 1. Case, work_item, ai_approval, report and account destinations resolve current owner-authorized references on every read. Calendar/support/operation targets are reserved and unavailable until their producers exist. An unavailable, deleted, revoked, expired or cancelled target exposes no private subject, content or reference. Stored labels never confer authority. Search is bounded and deterministic with existing filters/order/page/size plus unread=true/false; report is the same paginated search, not a queued archive. Unread totals count live ACTIVE unread inbox rows, including redacted unavailable destinations. Mark-read changes only read metadata, requires a current optimistic ref (409 when stale), and never decides or acts on a workflow. Non-owned refs fail 403; missing/deleted refs fail 404. Null read bodies are rejected; actions accept an empty object. UTC timestamps; en/fa template locale is chosen when staged with en fallback. Private no-store success/page envelopes, existing 401/403/404/409/422 errors. Refresh refs from mutation responses. Optional email defaults off; mandatory notices ignore optional opt-out. No delivery is performed by these reads.
     */
    get: operations['unread_api_v1_inbox_unread_get'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/inbox/{ref_id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Read unified notification
     * @description Authenticated recipient-only unified inbox version 1. Case, work_item, ai_approval, report and account destinations resolve current owner-authorized references on every read. Calendar/support/operation targets are reserved and unavailable until their producers exist. An unavailable, deleted, revoked, expired or cancelled target exposes no private subject, content or reference. Stored labels never confer authority. Search is bounded and deterministic with existing filters/order/page/size plus unread=true/false; report is the same paginated search, not a queued archive. Unread totals count live ACTIVE unread inbox rows, including redacted unavailable destinations. Mark-read changes only read metadata, requires a current optimistic ref (409 when stale), and never decides or acts on a workflow. Non-owned refs fail 403; missing/deleted refs fail 404. Null read bodies are rejected; actions accept an empty object. UTC timestamps; en/fa template locale is chosen when staged with en fallback. Private no-store success/page envelopes, existing 401/403/404/409/422 errors. Refresh refs from mutation responses. Optional email defaults off; mandatory notices ignore optional opt-out. No delivery is performed by these reads.
     */
    get: operations['detail_api_v1_inbox__ref_id__get'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/inbox/{ref_id}/read': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Mark unified notification read
     * @description Authenticated recipient-only unified inbox version 1. Case, work_item, ai_approval, report and account destinations resolve current owner-authorized references on every read. Calendar/support/operation targets are reserved and unavailable until their producers exist. An unavailable, deleted, revoked, expired or cancelled target exposes no private subject, content or reference. Stored labels never confer authority. Search is bounded and deterministic with existing filters/order/page/size plus unread=true/false; report is the same paginated search, not a queued archive. Unread totals count live ACTIVE unread inbox rows, including redacted unavailable destinations. Mark-read changes only read metadata, requires a current optimistic ref (409 when stale), and never decides or acts on a workflow. Non-owned refs fail 403; missing/deleted refs fail 404. Null read bodies are rejected; actions accept an empty object. UTC timestamps; en/fa template locale is chosen when staged with en fallback. Private no-store success/page envelopes, existing 401/403/404/409/422 errors. Refresh refs from mutation responses. Optional email defaults off; mandatory notices ignore optional opt-out. No delivery is performed by these reads.
     */
    post: operations['mark_read_api_v1_inbox__ref_id__read_post'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
}
export type webhooks = Record<string, never>;
export interface components {
  schemas: {
    /** AccountTarget */
    AccountTarget: {
      /** Available */
      available: boolean;
      /**
       * @description discriminator enum property added by openapi-typescript
       * @enum {string}
       */
      kind: 'account';
      /** Ref Id */
      ref_id?: string | null;
      /**
       * Route Key
       * @default me
       * @constant
       */
      route_key: 'me';
    };
    /** CalendarTarget */
    CalendarTarget: {
      /** Available */
      available: boolean;
      /**
       * @description discriminator enum property added by openapi-typescript
       * @enum {string}
       */
      kind: 'calendar';
      /** Ref Id */
      ref_id?: string | null;
      /**
       * Route Key
       * @default calendar_events
       * @constant
       */
      route_key: 'calendar_events';
    };
    /** CaseTarget */
    CaseTarget: {
      /** Available */
      available: boolean;
      /**
       * @description discriminator enum property added by openapi-typescript
       * @enum {string}
       */
      kind: 'case';
      /** Ref Id */
      ref_id?: string | null;
      /**
       * Route Key
       * @default business_requests
       * @constant
       */
      route_key: 'business_requests';
    };
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
    /**
     * FilterCriteria
     * @description One filter in the shared search wire format.
     */
    FilterCriteria: {
      /** Field Name */
      field_name: string;
      operation: components['schemas']['FilterOperation'];
      /** Value */
      value?: unknown;
    };
    /**
     * FilterOperation
     * @description Filter operators exposed by the shared search contract.
     * @enum {string}
     */
    FilterOperation:
      | 'equal'
      | 'notEqual'
      | 'startWith'
      | 'endsWith'
      | 'contains'
      | 'notContains'
      | 'between'
      | 'isNull'
      | 'isNotNull'
      | 'gt'
      | 'gte'
      | 'lt'
      | 'lte'
      | 'in'
      | 'nin';
    /** FutureTarget */
    FutureTarget: {
      /** Available */
      available: boolean;
      /**
       * @description discriminator enum property added by openapi-typescript
       * @enum {string}
       */
      kind: 'operation';
      /** Ref Id */
      ref_id?: string | null;
      /** Route Key */
      route_key?: null;
    };
    /** InboxDTO */
    InboxDTO: {
      /** Content */
      content: string | null;
      /**
       * Created At
       * Format: date-time
       */
      created_at: string;
      /** Locale */
      locale: string;
      /** Priority */
      priority: number;
      /** Read At */
      read_at: string | null;
      /** Ref Id */
      ref_id: string;
      /**
       * Schema Version
       * @default 1
       * @constant
       */
      schema_version: 1;
      /** Status */
      status: string;
      /** Subject */
      subject: string;
      /** Target */
      target:
        | components['schemas']['CaseTarget']
        | components['schemas']['WorkTarget']
        | components['schemas']['ReportTarget']
        | components['schemas']['AccountTarget']
        | components['schemas']['SupportTarget']
        | components['schemas']['CalendarTarget']
        | components['schemas']['FutureTarget'];
      /** Template Key */
      template_key: string;
      /** Template Version */
      template_version: string;
    };
    /** InboxQuery */
    InboxQuery: {
      /** Filters */
      filters?: components['schemas']['FilterCriteria'][];
      /**
       * Page
       * @default 1
       */
      page: number;
      /**
       * Size
       * @default 20
       */
      size: number;
      /** Sort Orders */
      sort_orders?: components['schemas']['SortOrder'][];
      /**
       * Unread
       * @description True limits to unread rows; false limits to read rows; omitted/null includes both.
       */
      unread?: boolean | null;
    };
    /** PageResponse[Page[InboxDTO]] */
    PageResponse_Page_InboxDTO__: {
      /**
       * Code
       * @default 200
       */
      code: number;
      /** Error */
      error?: null;
      /** Request Id */
      request_id: string;
      result: components['schemas']['Page_InboxDTO_'];
      /**
       * Success
       * @default true
       * @constant
       */
      success: true;
    };
    /** Page[InboxDTO] */
    Page_InboxDTO_: {
      /** Items */
      items?: components['schemas']['InboxDTO'][];
      /**
       * Page
       * @default 1
       */
      page: number;
      /**
       * Size
       * @default 20
       */
      size: number;
      /** Total */
      total: number;
      /**
       * Total Pages
       * @description Return the number of nonempty pages in the full result set.
       */
      readonly total_pages: number;
    };
    /** ReadCommand */
    ReadCommand: Record<string, never>;
    /** ReportTarget */
    ReportTarget: {
      /** Available */
      available: boolean;
      /**
       * @description discriminator enum property added by openapi-typescript
       * @enum {string}
       */
      kind: 'report';
      /** Ref Id */
      ref_id?: string | null;
      /**
       * Route Key
       * @default reports
       * @constant
       */
      route_key: 'reports';
    };
    /**
     * SortOperation
     * @description Sort direction for one field or a sequence of fields.
     * @enum {string}
     */
    SortOperation: 'asc' | 'desc';
    /**
     * SortOrder
     * @description Sort one field or multiple fields using the same direction.
     */
    SortOrder: {
      /** Field Name */
      field_name?: string | null;
      /** Multi Field */
      multi_field?: string[];
      /** @default asc */
      operation: components['schemas']['SortOperation'];
    };
    /** SuccessResponse[InboxDTO] */
    SuccessResponse_InboxDTO_: {
      /**
       * Code
       * @default 200
       */
      code: number;
      data: components['schemas']['InboxDTO'];
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
    /** SuccessResponse[UnreadDTO] */
    SuccessResponse_UnreadDTO_: {
      /**
       * Code
       * @default 200
       */
      code: number;
      data: components['schemas']['UnreadDTO'];
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
    /** SupportTarget */
    SupportTarget: {
      /** Available */
      available: boolean;
      /**
       * @description discriminator enum property added by openapi-typescript
       * @enum {string}
       */
      kind: 'support';
      /** Ref Id */
      ref_id?: string | null;
      /**
       * Route Key
       * @default support_incidents
       * @constant
       */
      route_key: 'support_incidents';
    };
    /** UnreadDTO */
    UnreadDTO: {
      /** Total */
      total: number;
    };
    /** WorkTarget */
    WorkTarget: {
      /** Available */
      available: boolean;
      /**
       * @description discriminator enum property added by openapi-typescript
       * @enum {string}
       */
      kind: 'ai_approval' | 'work_item';
      /** Ref Id */
      ref_id?: string | null;
      /**
       * Route Key
       * @default work_items
       * @constant
       */
      route_key: 'work_items';
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
  events_api_v1_inbox_events_get: {
    parameters: {
      query?: never;
      header?: {
        /** @description Optional caller-controlled client software identifier for audit and diagnostics; captured up to 1024 characters. Browsers supply their own value and may ignore manual Swagger overrides. Not trusted client identity or authorization. */
        'User-Agent'?: string | null;
        /** @description Reconnect hint only; always resynchronize from the persisted inbox. */
        'Last-Event-ID'?: string | null;
        /**
         * @description Optional RFC 9110 HTTP-date generated by native clients for advisory diagnostics. Browser JavaScript cannot set Date. Missing or invalid values do not reject the request.
         * @example Mon, 28 Sep 2026 12:00:00 GMT
         */
        Date?: string;
        /**
         * @description Optional preferred response language. English, Persian and Arabic are supported; regional tags use their base language and unsupported values fall back to English.
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
      /** @description Private SSE invalidations and heartbeat comments; no JSON envelope. */
      200: {
        headers: {
          'Cache-Control'?: 'private, no-store, no-transform';
          'X-Accel-Buffering'?: 'no';
          /** @description Present as check-device-time only when the configured apparent difference threshold is reached. */
          'X-Client-Date-Advisory'?: 'check-device-time';
          /** @description Signed server receipt minus client Date in seconds; includes transit and generation delay, so it is not exact clock skew. */
          'X-Client-Date-Delta-Seconds'?: number;
          /** @description Optional client Date reading: available, unavailable, or invalid. No request is rejected for this diagnostic. */
          'X-Client-Date-Status'?: 'available' | 'unavailable' | 'invalid';
          'X-Content-Type-Options'?: 'nosniff';
          /** @description Server UTC receipt timestamp. Response Date, when present, is generated by the HTTP server or proxy. */
          'X-Server-Received-At'?: string;
          [name: string]: unknown;
        };
        content: {
          /**
           * @example event: inbox.resync
           *     retry: 3000
           *     data: {"schema_version":1,"reason":"connected"}
           *
           *     : heartbeat
           */
          'text/event-stream': string;
        };
      };
      /** @description Pre-stream JSON error using the existing application envelope. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
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
        };
      };
      /** @description Pre-stream JSON error using the existing application envelope. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
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
        };
      };
      /** @description Pre-stream JSON error using the existing application envelope. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
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
        };
      };
      /** @description Pre-stream JSON error using the existing application envelope. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
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
        };
      };
      /** @description Pre-stream JSON error using the existing application envelope. */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
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
        };
      };
      /** @description Pre-stream JSON error using the existing application envelope. */
      413: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
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
        };
      };
      /** @description Pre-stream JSON error using the existing application envelope. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
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
        };
      };
      /** @description Pre-stream JSON error using the existing application envelope. */
      423: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
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
        };
      };
      /** @description Concurrent inbox stream limit reached. Retry after disconnecting another stream. */
      429: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
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
        };
      };
      /** @description Pre-stream JSON error using the existing application envelope. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
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
        };
      };
      /** @description Live signaling unavailable. Persisted inbox search remains authoritative. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
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
        };
      };
    };
  };
  search_api_v1_inbox_report_post: {
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
         * @description Optional preferred response language. English, Persian and Arabic are supported; regional tags use their base language and unsupported values fall back to English.
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
        'application/json': components['schemas']['InboxQuery'];
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
          'application/json': components['schemas']['PageResponse_Page_InboxDTO__'];
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
  search_api_v1_inbox_search_post: {
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
         * @description Optional preferred response language. English, Persian and Arabic are supported; regional tags use their base language and unsupported values fall back to English.
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
        'application/json': components['schemas']['InboxQuery'];
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
          'application/json': components['schemas']['PageResponse_Page_InboxDTO__'];
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
  unread_api_v1_inbox_unread_get: {
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
         * @description Optional preferred response language. English, Persian and Arabic are supported; regional tags use their base language and unsupported values fall back to English.
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
          'application/json': components['schemas']['SuccessResponse_UnreadDTO_'];
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
  detail_api_v1_inbox__ref_id__get: {
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
         * @description Optional preferred response language. English, Persian and Arabic are supported; regional tags use their base language and unsupported values fall back to English.
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
      path: {
        ref_id: string;
      };
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
          'application/json': components['schemas']['SuccessResponse_InboxDTO_'];
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
  mark_read_api_v1_inbox__ref_id__read_post: {
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
         * @description Optional preferred response language. English, Persian and Arabic are supported; regional tags use their base language and unsupported values fall back to English.
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
      path: {
        ref_id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['ReadCommand'];
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
          'application/json': components['schemas']['SuccessResponse_InboxDTO_'];
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
