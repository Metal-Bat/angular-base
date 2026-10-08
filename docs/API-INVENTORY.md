# API operation inventory

Generated from the supplied [OpenAPI snapshot](reference/openapi.json) with `npm run api:inventory`. Do not edit by hand.

Snapshot: 302 operations, 401 schemas. Source hashes are in [manifest.json](reference/manifest.json).

Ticket mappings identify responsible delivery areas, not verified live behavior. Missing contracts BE-04–BE-09 are proposals and are not added to this inventory. Shared API/auth/error/history/report adapters apply across areas. Root health/internal routes are deployment surfaces, not ordinary user screens.

| API area | Operations | Backlog coverage |
| --- | ---: | --- |
| ai-agents | 19 | ADMIN-05, TASK-07 |
| audit-events | 3 | ADMIN-08 |
| auth | 9 | AUTH-01, AUTH-02, AUTH-04 |
| business-requests | 17 | REQ-02, REQ-03, REQ-04, REQ-05, FORM-04, FORM-06, FORM-07, FORM-08 |
| client-releases | 7 | ADMIN-03 |
| clients | 9 | ADMIN-03 |
| definition-library | 10 | STUDIO-09 |
| designer | 4 | STUDIO-07 |
| files | 2 | API-04, OPS-03 |
| form-component-versions | 9 | STUDIO-09 |
| form-components | 9 | STUDIO-09 |
| form-data-type-versions | 9 | STUDIO-09 |
| form-data-types | 9 | STUDIO-09 |
| form-versions | 10 | STUDIO-01, STUDIO-09 |
| forms | 15 | STUDIO-01, STUDIO-02, STUDIO-03 |
| health | 3 | ADMIN-08 |
| history | 1 | OPS-03 |
| images | 2 | API-04, OPS-03 |
| integration-connections | 13 | ADMIN-04 |
| notifications | 4 | OPS-01 |
| permissions | 9 | AUTH-03, ADMIN-01 |
| process-events | 1 | ADMIN-07 |
| processes | 11 | PROC-01, ADMIN-07 |
| reports | 5 | OPS-02 |
| request-types | 7 | BE-03, STUDIO-10 |
| roles | 7 | ADMIN-01 |
| sessions | 4 | AUTH-04 |
| step-types | 4 | STUDIO-07 |
| task-definitions | 5 | ADMIN-06 |
| task-executions | 7 | ADMIN-06 |
| task-schedules | 7 | ADMIN-06 |
| users | 11 | ADMIN-01 |
| work-groups | 11 | ADMIN-02 |
| work-items | 28 | TASK-01, TASK-02, TASK-03, TASK-04, TASK-05, TASK-06, FORM-04, FORM-06, FORM-07 |
| workflow-versions | 11 | STUDIO-05, STUDIO-06, STUDIO-08 |
| workflows | 10 | STUDIO-05, STUDIO-08 |

## ai-agents

Backlog: ADMIN-05, TASK-07.

| Method | Exact path | Operation ID |
| --- | --- | --- |
| POST | `/api/v1/ai-agents/search` | `search_api_v1_ai_agents_search_post` |
| POST | `/api/v1/ai-agents/report` | `report_api_v1_ai_agents_report_post` |
| POST | `/api/v1/ai-agents` | `create_api_v1_ai_agents_post` |
| POST | `/api/v1/ai-agents/select` | `select_agents_api_v1_ai_agents_select_post` |
| POST | `/api/v1/ai-agents/providers/select` | `select_providers_api_v1_ai_agents_providers_select_post` |
| GET | `/api/v1/ai-agents/providers/{provider_key}/metadata` | `provider_metadata_api_v1_ai_agents_providers__provider_key__metadata_get` |
| POST | `/api/v1/ai-agents/connections/select` | `select_connections_api_v1_ai_agents_connections_select_post` |
| POST | `/api/v1/ai-agents/connections/{connection_ref}/models/select` | `select_models_api_v1_ai_agents_connections__connection_ref__models_select_post` |
| POST | `/api/v1/ai-agents/models/suggestions` | `model_suggestions_api_v1_ai_agents_models_suggestions_post` |
| GET | `/api/v1/ai-agents/connections/{connection_ref}/models/{model_id}/metadata` | `model_metadata_api_v1_ai_agents_connections__connection_ref__models__model_id__metadata_get` |
| GET | `/api/v1/ai-agents/processes/{process_ref}/executions/{execution_ref}/budget` | `budget_status_api_v1_ai_agents_processes__process_ref__executions__execution_ref__budget_get` |
| GET | `/api/v1/ai-agents/work-items/{work_item_ref}/tool-approval` | `tool_approval_detail_api_v1_ai_agents_work_items__work_item_ref__tool_approval_get` |
| POST | `/api/v1/ai-agents/work-items/{work_item_ref}/tool-approval` | `decide_tool_approval_api_v1_ai_agents_work_items__work_item_ref__tool_approval_post` |
| GET | `/api/v1/ai-agents/{ref_id}` | `detail_api_v1_ai_agents__ref_id__get` |
| PUT | `/api/v1/ai-agents/{ref_id}` | `update_api_v1_ai_agents__ref_id__put` |
| DELETE | `/api/v1/ai-agents/{ref_id}` | `delete_api_v1_ai_agents__ref_id__delete` |
| POST | `/api/v1/ai-agents/{ref_id}/history` | `history_api_v1_ai_agents__ref_id__history_post` |
| POST | `/api/v1/ai-agents/{ref_id}/publish` | `publish_api_v1_ai_agents__ref_id__publish_post` |
| POST | `/api/v1/ai-agents/{ref_id}/choices/select` | `select_choices_api_v1_ai_agents__ref_id__choices_select_post` |

## audit-events

Backlog: ADMIN-08.

| Method | Exact path | Operation ID |
| --- | --- | --- |
| POST | `/api/v1/admin/audit-events/search` | `list_audit_events_api_v1_admin_audit_events_search_post` |
| GET | `/api/v1/admin/audit-events/{ref_id}` | `get_audit_event_api_v1_admin_audit_events__ref_id__get` |
| POST | `/api/v1/admin/audit-events/report` | `report_audit_events_api_v1_admin_audit_events_report_post` |

## auth

Backlog: AUTH-01, AUTH-02, AUTH-04.

| Method | Exact path | Operation ID |
| --- | --- | --- |
| POST | `/api/v1/auth/login` | `login_api_v1_auth_login_post` |
| POST | `/api/v1/auth/token` | `token_api_v1_auth_token_post` |
| POST | `/api/v1/auth/refresh` | `refresh_api_v1_auth_refresh_post` |
| POST | `/api/v1/auth/logout` | `logout_api_v1_auth_logout_post` |
| POST | `/api/v1/auth/logout-all` | `logout_all_api_v1_auth_logout_all_post` |
| POST | `/api/v1/auth/forgot-password` | `forgot_password_api_v1_auth_forgot_password_post` |
| POST | `/api/v1/auth/reset-password` | `reset_password_api_v1_auth_reset_password_post` |
| POST | `/api/v1/auth/change-password` | `change_password_api_v1_auth_change_password_post` |
| GET | `/api/v1/auth/me` | `me_api_v1_auth_me_get` |

## business-requests

Backlog: REQ-02, REQ-03, REQ-04, REQ-05, FORM-04, FORM-06, FORM-07, FORM-08.

| Method | Exact path | Operation ID |
| --- | --- | --- |
| POST | `/api/v1/business-requests/search` | `search_requests_api_v1_business_requests_search_post` |
| GET | `/api/v1/business-requests/{ref_id}` | `get_request_api_v1_business_requests__ref_id__get` |
| PUT | `/api/v1/business-requests/{ref_id}` | `update_request_api_v1_business_requests__ref_id__put` |
| POST | `/api/v1/business-requests/report` | `report_requests_api_v1_business_requests_report_post` |
| POST | `/api/v1/business-requests` | `create_request_api_v1_business_requests_post` |
| POST | `/api/v1/business-requests/{ref_id}/collections/edit` | `edit_request_collection_api_v1_business_requests__ref_id__collections_edit_post` |
| POST | `/api/v1/business-requests/{ref_id}/overrides` | `override_calculation_api_v1_business_requests__ref_id__overrides_post` |
| POST | `/api/v1/business-requests/{ref_id}/resume-presentation` | `resume_request_presentation_api_v1_business_requests__ref_id__resume_presentation_post` |
| POST | `/api/v1/business-requests/{ref_id}/submit` | `submit_request_api_v1_business_requests__ref_id__submit_post` |
| GET | `/api/v1/business-requests/{ref_id}/attachments` | `list_attachments_api_v1_business_requests__ref_id__attachments_get` |
| POST | `/api/v1/business-requests/{ref_id}/attachments` | `add_attachment_api_v1_business_requests__ref_id__attachments_post` |
| PUT | `/api/v1/business-requests/{ref_id}/attachments` | `reorder_attachments_api_v1_business_requests__ref_id__attachments_put` |
| PUT | `/api/v1/business-requests/{ref_id}/attachments/{attachment_ref_id}` | `replace_attachment_api_v1_business_requests__ref_id__attachments__attachment_ref_id__put` |
| DELETE | `/api/v1/business-requests/{ref_id}/attachments/{attachment_ref_id}` | `remove_attachment_api_v1_business_requests__ref_id__attachments__attachment_ref_id__delete` |
| GET | `/api/v1/business-requests/{ref_id}/attachments/{attachment_ref_id}/content` | `download_attachment_api_v1_business_requests__ref_id__attachments__attachment_ref_id__content_get` |
| POST | `/api/v1/business-requests/{ref_id}/cancel` | `cancel_request_api_v1_business_requests__ref_id__cancel_post` |
| POST | `/api/v1/business-requests/{ref_id}/options` | `request_options_api_v1_business_requests__ref_id__options_post` |

## client-releases

Backlog: ADMIN-03.

| Method | Exact path | Operation ID |
| --- | --- | --- |
| POST | `/api/v1/client-releases/search` | `search_releases_api_v1_client_releases_search_post` |
| GET | `/api/v1/client-releases/{ref_id}` | `get_release_api_v1_client_releases__ref_id__get` |
| POST | `/api/v1/client-releases/{ref_id}/history` | `release_history_api_v1_client_releases__ref_id__history_post` |
| POST | `/api/v1/client-releases/report` | `report_releases_api_v1_client_releases_report_post` |
| POST | `/api/v1/client-releases` | `create_release_api_v1_client_releases_post` |
| POST | `/api/v1/client-releases/select` | `select_releases_api_v1_client_releases_select_post` |
| POST | `/api/v1/client-releases/{ref_id}/disable` | `disable_release_api_v1_client_releases__ref_id__disable_post` |

## clients

Backlog: ADMIN-03.

| Method | Exact path | Operation ID |
| --- | --- | --- |
| POST | `/api/v1/clients/search` | `search_clients_api_v1_clients_search_post` |
| GET | `/api/v1/clients/{ref_id}` | `get_client_api_v1_clients__ref_id__get` |
| PUT | `/api/v1/clients/{ref_id}` | `update_client_api_v1_clients__ref_id__put` |
| DELETE | `/api/v1/clients/{ref_id}` | `delete_client_api_v1_clients__ref_id__delete` |
| POST | `/api/v1/clients/{ref_id}/history` | `client_history_api_v1_clients__ref_id__history_post` |
| POST | `/api/v1/clients/report` | `report_clients_api_v1_clients_report_post` |
| POST | `/api/v1/clients` | `create_client_api_v1_clients_post` |
| POST | `/api/v1/clients/select` | `select_clients_api_v1_clients_select_post` |
| POST | `/api/v1/clients/{ref_id}/rotate-secret` | `rotate_client_secret_api_v1_clients__ref_id__rotate_secret_post` |

## definition-library

Backlog: STUDIO-09.

| Method | Exact path | Operation ID |
| --- | --- | --- |
| POST | `/api/v1/designer/library/search` | `search_library_api_v1_designer_library_search_post` |
| POST | `/api/v1/designer/library/select` | `select_library_api_v1_designer_library_select_post` |
| POST | `/api/v1/designer/library/{kind}/{ref_id}/dependencies` | `dependencies_api_v1_designer_library__kind___ref_id__dependencies_post` |
| POST | `/api/v1/designer/library/{kind}/{ref_id}/where-used` | `where_used_api_v1_designer_library__kind___ref_id__where_used_post` |
| POST | `/api/v1/designer/library/{kind}/{ref_id}/compare` | `compare_api_v1_designer_library__kind___ref_id__compare_post` |
| POST | `/api/v1/designer/library/{kind}/{ref_id}/guidance` | `guidance_api_v1_designer_library__kind___ref_id__guidance_post` |
| POST | `/api/v1/designer/library/templates` | `create_template_api_v1_designer_library_templates_post` |
| POST | `/api/v1/designer/library/upgrade-preview` | `upgrade_preview_api_v1_designer_library_upgrade_preview_post` |
| POST | `/api/v1/designer/library/upgrade-apply` | `upgrade_apply_api_v1_designer_library_upgrade_apply_post` |
| POST | `/api/v1/designer/library/form-versions/{ref_id}/explanation` | `explanation_api_v1_designer_library_form_versions__ref_id__explanation_post` |

## designer

Backlog: STUDIO-07.

| Method | Exact path | Operation ID |
| --- | --- | --- |
| POST | `/api/v1/designer/catalog` | `catalog_api_v1_designer_catalog_post` |
| POST | `/api/v1/designer/selectors/{kind}` | `selector_api_v1_designer_selectors__kind__post` |
| POST | `/api/v1/designer/completion` | `completion_api_v1_designer_completion_post` |
| POST | `/api/v1/designer/field-inventory` | `field_inventory_api_v1_designer_field_inventory_post` |

## files

Backlog: API-04, OPS-03.

| Method | Exact path | Operation ID |
| --- | --- | --- |
| POST | `/api/v1/media/files` | `upload_file_api_v1_media_files_post` |
| GET | `/api/v1/media/files/{ref_id}` | `download_file_api_v1_media_files__ref_id__get` |

## form-component-versions

Backlog: STUDIO-09.

| Method | Exact path | Operation ID |
| --- | --- | --- |
| POST | `/api/v1/form-component-versions/search` | `search_versions_api_v1_form_component_versions_search_post` |
| GET | `/api/v1/form-component-versions/{ref_id}` | `detail_version_api_v1_form_component_versions__ref_id__get` |
| PUT | `/api/v1/form-component-versions/{ref_id}` | `update_version_api_v1_form_component_versions__ref_id__put` |
| DELETE | `/api/v1/form-component-versions/{ref_id}` | `delete_version_api_v1_form_component_versions__ref_id__delete` |
| POST | `/api/v1/form-component-versions/{ref_id}/history` | `history_version_api_v1_form_component_versions__ref_id__history_post` |
| POST | `/api/v1/form-component-versions/report` | `report_versions_api_v1_form_component_versions_report_post` |
| POST | `/api/v1/form-component-versions` | `create_version_api_v1_form_component_versions_post` |
| POST | `/api/v1/form-component-versions/{ref_id}/publish` | `publish_api_v1_form_component_versions__ref_id__publish_post` |
| POST | `/api/v1/form-component-versions/{ref_id}/retire` | `retire_api_v1_form_component_versions__ref_id__retire_post` |

## form-components

Backlog: STUDIO-09.

| Method | Exact path | Operation ID |
| --- | --- | --- |
| POST | `/api/v1/form-components/search` | `search_api_v1_form_components_search_post` |
| GET | `/api/v1/form-components/{ref_id}` | `detail_api_v1_form_components__ref_id__get` |
| PUT | `/api/v1/form-components/{ref_id}` | `update_api_v1_form_components__ref_id__put` |
| DELETE | `/api/v1/form-components/{ref_id}` | `delete_api_v1_form_components__ref_id__delete` |
| POST | `/api/v1/form-components/{ref_id}/history` | `history_api_v1_form_components__ref_id__history_post` |
| POST | `/api/v1/form-components/report` | `report_api_v1_form_components_report_post` |
| POST | `/api/v1/form-components` | `create_api_v1_form_components_post` |
| POST | `/api/v1/form-components/{ref_id}/grants` | `grant_api_v1_form_components__ref_id__grants_post` |
| DELETE | `/api/v1/form-components/{ref_id}/grants/{grant_ref_id}` | `revoke_grant_api_v1_form_components__ref_id__grants__grant_ref_id__delete` |

## form-data-type-versions

Backlog: STUDIO-09.

| Method | Exact path | Operation ID |
| --- | --- | --- |
| POST | `/api/v1/form-data-type-versions/search` | `search_versions_api_v1_form_data_type_versions_search_post` |
| GET | `/api/v1/form-data-type-versions/{ref_id}` | `detail_version_api_v1_form_data_type_versions__ref_id__get` |
| PUT | `/api/v1/form-data-type-versions/{ref_id}` | `update_version_api_v1_form_data_type_versions__ref_id__put` |
| DELETE | `/api/v1/form-data-type-versions/{ref_id}` | `delete_version_api_v1_form_data_type_versions__ref_id__delete` |
| POST | `/api/v1/form-data-type-versions/{ref_id}/history` | `history_version_api_v1_form_data_type_versions__ref_id__history_post` |
| POST | `/api/v1/form-data-type-versions/report` | `report_versions_api_v1_form_data_type_versions_report_post` |
| POST | `/api/v1/form-data-type-versions` | `create_version_api_v1_form_data_type_versions_post` |
| POST | `/api/v1/form-data-type-versions/{ref_id}/publish` | `publish_api_v1_form_data_type_versions__ref_id__publish_post` |
| POST | `/api/v1/form-data-type-versions/{ref_id}/retire` | `retire_api_v1_form_data_type_versions__ref_id__retire_post` |

## form-data-types

Backlog: STUDIO-09.

| Method | Exact path | Operation ID |
| --- | --- | --- |
| POST | `/api/v1/form-data-types/search` | `search_api_v1_form_data_types_search_post` |
| GET | `/api/v1/form-data-types/{ref_id}` | `detail_api_v1_form_data_types__ref_id__get` |
| PUT | `/api/v1/form-data-types/{ref_id}` | `update_api_v1_form_data_types__ref_id__put` |
| DELETE | `/api/v1/form-data-types/{ref_id}` | `delete_api_v1_form_data_types__ref_id__delete` |
| POST | `/api/v1/form-data-types/{ref_id}/history` | `history_api_v1_form_data_types__ref_id__history_post` |
| POST | `/api/v1/form-data-types/report` | `report_api_v1_form_data_types_report_post` |
| POST | `/api/v1/form-data-types` | `create_api_v1_form_data_types_post` |
| POST | `/api/v1/form-data-types/{ref_id}/grants` | `grant_api_v1_form_data_types__ref_id__grants_post` |
| DELETE | `/api/v1/form-data-types/{ref_id}/grants/{grant_ref_id}` | `revoke_grant_api_v1_form_data_types__ref_id__grants__grant_ref_id__delete` |

## form-versions

Backlog: STUDIO-01, STUDIO-09.

| Method | Exact path | Operation ID |
| --- | --- | --- |
| POST | `/api/v1/form-versions/search` | `search_versions_api_v1_form_versions_search_post` |
| GET | `/api/v1/form-versions/{ref_id}` | `get_versions_api_v1_form_versions__ref_id__get` |
| PUT | `/api/v1/form-versions/{ref_id}` | `update_versions_api_v1_form_versions__ref_id__put` |
| DELETE | `/api/v1/form-versions/{ref_id}` | `delete_versions_api_v1_form_versions__ref_id__delete` |
| POST | `/api/v1/form-versions/{ref_id}/history` | `history_versions_api_v1_form_versions__ref_id__history_post` |
| POST | `/api/v1/form-versions/report` | `report_versions_api_v1_form_versions_report_post` |
| POST | `/api/v1/form-versions` | `create_versions_api_v1_form_versions_post` |
| POST | `/api/v1/form-versions/{ref_id}/publish` | `publish_form_api_v1_form_versions__ref_id__publish_post` |
| POST | `/api/v1/form-versions/{ref_id}/reuse-upgrade-preview` | `preview_reuse_upgrade_api_v1_form_versions__ref_id__reuse_upgrade_preview_post` |
| POST | `/api/v1/form-versions/{ref_id}/retire` | `retire_form_api_v1_form_versions__ref_id__retire_post` |

## forms

Backlog: STUDIO-01, STUDIO-02, STUDIO-03.

| Method | Exact path | Operation ID |
| --- | --- | --- |
| POST | `/api/v1/forms/search` | `search_forms_api_v1_forms_search_post` |
| GET | `/api/v1/forms/{ref_id}` | `get_forms_api_v1_forms__ref_id__get` |
| PUT | `/api/v1/forms/{ref_id}` | `update_forms_api_v1_forms__ref_id__put` |
| DELETE | `/api/v1/forms/{ref_id}` | `delete_forms_api_v1_forms__ref_id__delete` |
| POST | `/api/v1/forms/{ref_id}/history` | `history_forms_api_v1_forms__ref_id__history_post` |
| POST | `/api/v1/forms/report` | `report_forms_api_v1_forms_report_post` |
| POST | `/api/v1/forms` | `create_forms_api_v1_forms_post` |
| POST | `/api/v1/forms/validate` | `validate_form_api_v1_forms_validate_post` |
| POST | `/api/v1/forms/preview` | `preview_form_api_v1_forms_preview_post` |
| POST | `/api/v1/forms/copy-component` | `copy_component_api_v1_forms_copy_component_post` |
| POST | `/api/v1/forms/behavior-preview` | `preview_behavior_api_v1_forms_behavior_preview_post` |
| POST | `/api/v1/forms/render-schema` | `render_meta_schema_api_v1_forms_render_schema_post` |
| POST | `/api/v1/forms/field-catalog` | `get_field_catalog_api_v1_forms_field_catalog_post` |
| POST | `/api/v1/forms/options` | `preview_options_api_v1_forms_options_post` |
| POST | `/api/v1/forms/navigation-preview` | `preview_navigation_api_v1_forms_navigation_preview_post` |

## health

Backlog: ADMIN-08.

| Method | Exact path | Operation ID |
| --- | --- | --- |
| GET | `/health` | `liveness_health_get` |
| GET | `/ready` | `ready_ready_get` |
| GET | `/internal/{service_name}` | `internal_health_internal__service_name__get` |

## history

Backlog: OPS-03.

| Method | Exact path | Operation ID |
| --- | --- | --- |
| POST | `/api/v1/admin/history/{entity_name}/search` | `query_history_api_v1_admin_history__entity_name__search_post` |

## images

Backlog: API-04, OPS-03.

| Method | Exact path | Operation ID |
| --- | --- | --- |
| POST | `/api/v1/media/images` | `upload_image_api_v1_media_images_post` |
| GET | `/api/v1/media/images/{ref_id}` | `download_image_api_v1_media_images__ref_id__get` |

## integration-connections

Backlog: ADMIN-04.

| Method | Exact path | Operation ID |
| --- | --- | --- |
| POST | `/api/v1/integration-connections/select` | `select_connections_api_v1_integration_connections_select_post` |
| POST | `/api/v1/integration-connections/search` | `search_api_v1_integration_connections_search_post` |
| GET | `/api/v1/integration-connections/{ref_id}` | `detail_api_v1_integration_connections__ref_id__get` |
| PUT | `/api/v1/integration-connections/{ref_id}` | `update_api_v1_integration_connections__ref_id__put` |
| DELETE | `/api/v1/integration-connections/{ref_id}` | `delete_api_v1_integration_connections__ref_id__delete` |
| POST | `/api/v1/integration-connections/{ref_id}/history` | `history_api_v1_integration_connections__ref_id__history_post` |
| POST | `/api/v1/integration-connections/report` | `report_api_v1_integration_connections_report_post` |
| POST | `/api/v1/integration-connections` | `create_api_v1_integration_connections_post` |
| POST | `/api/v1/integration-connections/{ref_id}/rotate` | `rotate_api_v1_integration_connections__ref_id__rotate_post` |
| POST | `/api/v1/integration-connections/{ref_id}/verify` | `verify_api_v1_integration_connections__ref_id__verify_post` |
| POST | `/api/v1/integration-connections/{ref_id}/revoke` | `revoke_api_v1_integration_connections__ref_id__revoke_post` |
| POST | `/api/v1/integration-connections/{ref_id}/grants` | `grant_api_v1_integration_connections__ref_id__grants_post` |
| DELETE | `/api/v1/integration-connections/{ref_id}/grants/{grant_ref_id}` | `remove_grant_api_v1_integration_connections__ref_id__grants__grant_ref_id__delete` |

## notifications

Backlog: OPS-01.

| Method | Exact path | Operation ID |
| --- | --- | --- |
| POST | `/api/v1/notifications/search` | `search_notifications_api_v1_notifications_search_post` |
| POST | `/api/v1/notifications/report` | `report_notifications_api_v1_notifications_report_post` |
| GET | `/api/v1/notifications/{ref_id}` | `notification_detail_api_v1_notifications__ref_id__get` |
| POST | `/api/v1/notifications/{ref_id}/read` | `mark_notification_read_api_v1_notifications__ref_id__read_post` |

## permissions

Backlog: AUTH-03, ADMIN-01.

| Method | Exact path | Operation ID |
| --- | --- | --- |
| POST | `/api/v1/auth/permissions/search` | `current_permissions_api_v1_auth_permissions_search_post` |
| POST | `/api/v1/auth/permissions/report` | `report_current_permissions_api_v1_auth_permissions_report_post` |
| POST | `/api/v1/admin/permissions` | `create_permission_api_v1_admin_permissions_post` |
| POST | `/api/v1/admin/permissions/search` | `list_permissions_api_v1_admin_permissions_search_post` |
| POST | `/api/v1/admin/permissions/report` | `report_permissions_api_v1_admin_permissions_report_post` |
| GET | `/api/v1/admin/permissions/{ref_id}` | `get_permission_api_v1_admin_permissions__ref_id__get` |
| PUT | `/api/v1/admin/permissions/{ref_id}` | `update_permission_api_v1_admin_permissions__ref_id__put` |
| DELETE | `/api/v1/admin/permissions/{ref_id}` | `delete_permission_api_v1_admin_permissions__ref_id__delete` |
| POST | `/api/v1/admin/permissions/{ref_id}/history` | `permission_history_api_v1_admin_permissions__ref_id__history_post` |

## process-events

Backlog: ADMIN-07.

| Method | Exact path | Operation ID |
| --- | --- | --- |
| POST | `/api/v1/process-events/{event_type}/deliver` | `deliver_process_event_api_v1_process_events__event_type__deliver_post` |

## processes

Backlog: PROC-01, ADMIN-07.

| Method | Exact path | Operation ID |
| --- | --- | --- |
| POST | `/api/v1/processes/{ref_id}/recover` | `recover_process_api_v1_processes__ref_id__recover_post` |
| GET | `/api/v1/processes/{ref_id}` | `get_process_api_v1_processes__ref_id__get` |
| POST | `/api/v1/processes/{ref_id}/timeline` | `get_process_timeline_api_v1_processes__ref_id__timeline_post` |
| POST | `/api/v1/processes/{ref_id}/timeline/report` | `report_process_timeline_api_v1_processes__ref_id__timeline_report_post` |
| POST | `/api/v1/processes/{ref_id}/resume` | `resume_process_api_v1_processes__ref_id__resume_post` |
| POST | `/api/v1/processes/{ref_id}/pause` | `pause_process_api_v1_processes__ref_id__pause_post` |
| POST | `/api/v1/processes/{ref_id}/cancel` | `cancel_process_api_v1_processes__ref_id__cancel_post` |
| POST | `/api/v1/processes/{ref_id}/retry` | `retry_process_api_v1_processes__ref_id__retry_post` |
| POST | `/api/v1/processes/{ref_id}/compensate` | `compensate_process_api_v1_processes__ref_id__compensate_post` |
| POST | `/api/v1/processes/{ref_id}/timeout` | `timeout_process_api_v1_processes__ref_id__timeout_post` |
| POST | `/api/v1/processes/{ref_id}/scheduled-actions/search` | `search_scheduled_actions_api_v1_processes__ref_id__scheduled_actions_search_post` |

## reports

Backlog: OPS-02.

| Method | Exact path | Operation ID |
| --- | --- | --- |
| POST | `/api/v1/reports/search` | `search_reports_api_v1_reports_search_post` |
| GET | `/api/v1/reports/{ref_id}` | `get_report_api_v1_reports__ref_id__get` |
| DELETE | `/api/v1/reports/{ref_id}` | `delete_report_api_v1_reports__ref_id__delete` |
| GET | `/api/v1/reports/{ref_id}/download` | `download_report_api_v1_reports__ref_id__download_get` |
| POST | `/api/v1/reports/{ref_id}/history` | `report_history_api_v1_reports__ref_id__history_post` |

## request-types

Backlog: BE-03, STUDIO-10.

| Method | Exact path | Operation ID |
| --- | --- | --- |
| POST | `/api/v1/request-types/search` | `search_types_api_v1_request_types_search_post` |
| GET | `/api/v1/request-types/{ref_id}` | `get_type_api_v1_request_types__ref_id__get` |
| PUT | `/api/v1/request-types/{ref_id}` | `update_type_api_v1_request_types__ref_id__put` |
| DELETE | `/api/v1/request-types/{ref_id}` | `delete_type_api_v1_request_types__ref_id__delete` |
| POST | `/api/v1/request-types/{ref_id}/history` | `history_type_api_v1_request_types__ref_id__history_post` |
| POST | `/api/v1/request-types/report` | `report_types_api_v1_request_types_report_post` |
| POST | `/api/v1/request-types` | `create_type_api_v1_request_types_post` |

## roles

Backlog: ADMIN-01.

| Method | Exact path | Operation ID |
| --- | --- | --- |
| POST | `/api/v1/admin/roles` | `create_role_api_v1_admin_roles_post` |
| POST | `/api/v1/admin/roles/search` | `search_roles_api_v1_admin_roles_search_post` |
| POST | `/api/v1/admin/roles/report` | `report_roles_api_v1_admin_roles_report_post` |
| GET | `/api/v1/admin/roles/{ref_id}` | `get_role_api_v1_admin_roles__ref_id__get` |
| PUT | `/api/v1/admin/roles/{ref_id}` | `update_role_api_v1_admin_roles__ref_id__put` |
| DELETE | `/api/v1/admin/roles/{ref_id}` | `delete_role_api_v1_admin_roles__ref_id__delete` |
| POST | `/api/v1/admin/roles/{ref_id}/history` | `role_history_api_v1_admin_roles__ref_id__history_post` |

## sessions

Backlog: AUTH-04.

| Method | Exact path | Operation ID |
| --- | --- | --- |
| POST | `/api/v1/auth/sessions/search` | `list_sessions_api_v1_auth_sessions_search_post` |
| POST | `/api/v1/auth/sessions/report` | `report_sessions_api_v1_auth_sessions_report_post` |
| GET | `/api/v1/auth/sessions/{ref_id}` | `get_session_api_v1_auth_sessions__ref_id__get` |
| DELETE | `/api/v1/auth/sessions/{ref_id}` | `revoke_session_api_v1_auth_sessions__ref_id__delete` |

## step-types

Backlog: STUDIO-07.

| Method | Exact path | Operation ID |
| --- | --- | --- |
| POST | `/api/v1/step-types/search` | `search_step_types_api_v1_step_types_search_post` |
| GET | `/api/v1/step-types/{ref_id}` | `get_step_type_api_v1_step_types__ref_id__get` |
| POST | `/api/v1/step-types/{ref_id}/publish` | `publish_step_type_api_v1_step_types__ref_id__publish_post` |
| POST | `/api/v1/step-types/select` | `select_step_types_api_v1_step_types_select_post` |

## task-definitions

Backlog: ADMIN-06.

| Method | Exact path | Operation ID |
| --- | --- | --- |
| POST | `/api/v1/tasks/definitions/search` | `search_task_definitions_api_v1_tasks_definitions_search_post` |
| POST | `/api/v1/tasks/definitions/report` | `report_task_definitions_api_v1_tasks_definitions_report_post` |
| GET | `/api/v1/tasks/definitions/select` | `select_task_definitions_api_v1_tasks_definitions_select_get` |
| GET | `/api/v1/tasks/definitions/{ref_id}` | `get_task_definition_api_v1_tasks_definitions__ref_id__get` |
| POST | `/api/v1/tasks/definitions/{ref_id}/history` | `task_definition_history_api_v1_tasks_definitions__ref_id__history_post` |

## task-executions

Backlog: ADMIN-06.

| Method | Exact path | Operation ID |
| --- | --- | --- |
| GET | `/api/v1/tasks/queues/select` | `select_task_queues_api_v1_tasks_queues_select_get` |
| POST | `/api/v1/tasks/run` | `run_task_api_v1_tasks_run_post` |
| POST | `/api/v1/tasks/executions/search` | `search_executions_api_v1_tasks_executions_search_post` |
| POST | `/api/v1/tasks/executions/report` | `report_executions_api_v1_tasks_executions_report_post` |
| GET | `/api/v1/tasks/executions/{ref_id}` | `get_execution_api_v1_tasks_executions__ref_id__get` |
| POST | `/api/v1/tasks/executions/{task_id}/retry` | `retry_execution_api_v1_tasks_executions__task_id__retry_post` |
| POST | `/api/v1/tasks/executions/{task_id}/revoke` | `revoke_execution_api_v1_tasks_executions__task_id__revoke_post` |

## task-schedules

Backlog: ADMIN-06.

| Method | Exact path | Operation ID |
| --- | --- | --- |
| POST | `/api/v1/tasks/schedules` | `create_schedule_api_v1_tasks_schedules_post` |
| POST | `/api/v1/tasks/schedules/search` | `search_schedules_api_v1_tasks_schedules_search_post` |
| POST | `/api/v1/tasks/schedules/report` | `report_schedules_api_v1_tasks_schedules_report_post` |
| GET | `/api/v1/tasks/schedules/{ref_id}` | `get_schedule_api_v1_tasks_schedules__ref_id__get` |
| PUT | `/api/v1/tasks/schedules/{ref_id}` | `update_schedule_api_v1_tasks_schedules__ref_id__put` |
| DELETE | `/api/v1/tasks/schedules/{ref_id}` | `delete_schedule_api_v1_tasks_schedules__ref_id__delete` |
| POST | `/api/v1/tasks/schedules/{ref_id}/history` | `schedule_history_api_v1_tasks_schedules__ref_id__history_post` |

## users

Backlog: ADMIN-01.

| Method | Exact path | Operation ID |
| --- | --- | --- |
| POST | `/api/v1/admin/users` | `create_user_api_v1_admin_users_post` |
| POST | `/api/v1/admin/users/search` | `list_admin_users_api_v1_admin_users_search_post` |
| POST | `/api/v1/admin/users/report` | `report_admin_users_api_v1_admin_users_report_post` |
| GET | `/api/v1/admin/users/{ref_id}` | `get_admin_user_api_v1_admin_users__ref_id__get` |
| PUT | `/api/v1/admin/users/{ref_id}` | `update_user_api_v1_admin_users__ref_id__put` |
| DELETE | `/api/v1/admin/users/{ref_id}` | `delete_user_api_v1_admin_users__ref_id__delete` |
| POST | `/api/v1/admin/users/{ref_id}/history` | `user_history_api_v1_admin_users__ref_id__history_post` |
| POST | `/api/v1/admin/users/{ref_id}/restore` | `restore_user_api_v1_admin_users__ref_id__restore_post` |
| POST | `/api/v1/admin/users/{ref_id}/roles` | `assign_role_api_v1_admin_users__ref_id__roles_post` |
| POST | `/api/v1/admin/users/{ref_id}/reset-password` | `reset_user_password_api_v1_admin_users__ref_id__reset_password_post` |
| POST | `/api/v1/admin/users/select` | `select_users_api_v1_admin_users_select_post` |

## work-groups

Backlog: ADMIN-02.

| Method | Exact path | Operation ID |
| --- | --- | --- |
| POST | `/api/v1/admin/work-groups/search` | `search_groups_api_v1_admin_work_groups_search_post` |
| GET | `/api/v1/admin/work-groups/{ref_id}` | `get_group_api_v1_admin_work_groups__ref_id__get` |
| PUT | `/api/v1/admin/work-groups/{ref_id}` | `update_group_api_v1_admin_work_groups__ref_id__put` |
| DELETE | `/api/v1/admin/work-groups/{ref_id}` | `delete_group_api_v1_admin_work_groups__ref_id__delete` |
| POST | `/api/v1/admin/work-groups/{ref_id}/history` | `group_history_api_v1_admin_work_groups__ref_id__history_post` |
| POST | `/api/v1/admin/work-groups/report` | `report_groups_api_v1_admin_work_groups_report_post` |
| POST | `/api/v1/admin/work-groups` | `create_group_api_v1_admin_work_groups_post` |
| POST | `/api/v1/admin/work-groups/select` | `select_groups_api_v1_admin_work_groups_select_post` |
| POST | `/api/v1/admin/work-groups/{ref_id}/members` | `add_member_api_v1_admin_work_groups__ref_id__members_post` |
| POST | `/api/v1/admin/work-groups/{ref_id}/members/deactivate` | `deactivate_member_api_v1_admin_work_groups__ref_id__members_deactivate_post` |
| DELETE | `/api/v1/admin/work-groups/{ref_id}/members/{user_ref_id}` | `remove_member_api_v1_admin_work_groups__ref_id__members__user_ref_id__delete` |

## work-items

Backlog: TASK-01, TASK-02, TASK-03, TASK-04, TASK-05, TASK-06, FORM-04, FORM-06, FORM-07.

| Method | Exact path | Operation ID |
| --- | --- | --- |
| POST | `/api/v1/work-items/search` | `search_work_items_api_v1_work_items_search_post` |
| GET | `/api/v1/work-items/{ref_id}` | `get_work_item_api_v1_work_items__ref_id__get` |
| GET | `/api/v1/work-items/{ref_id}/view` | `get_work_item_view_api_v1_work_items__ref_id__view_get` |
| POST | `/api/v1/work-items/{ref_id}/feedback/{feedback_key}/resolve` | `resolve_work_item_feedback_api_v1_work_items__ref_id__feedback__feedback_key__resolve_post` |
| GET | `/api/v1/work-items/{ref_id}/attachments` | `list_work_item_attachments_api_v1_work_items__ref_id__attachments_get` |
| POST | `/api/v1/work-items/{ref_id}/attachments` | `add_work_item_attachment_api_v1_work_items__ref_id__attachments_post` |
| PUT | `/api/v1/work-items/{ref_id}/attachments` | `reorder_work_item_attachments_api_v1_work_items__ref_id__attachments_put` |
| PUT | `/api/v1/work-items/{ref_id}/attachments/{attachment_ref_id}` | `replace_work_item_attachment_api_v1_work_items__ref_id__attachments__attachment_ref_id__put` |
| DELETE | `/api/v1/work-items/{ref_id}/attachments/{attachment_ref_id}` | `remove_work_item_attachment_api_v1_work_items__ref_id__attachments__attachment_ref_id__delete` |
| GET | `/api/v1/work-items/{ref_id}/attachments/{attachment_ref_id}/content` | `download_work_item_attachment_api_v1_work_items__ref_id__attachments__attachment_ref_id__content_get` |
| POST | `/api/v1/work-items/{ref_id}/claim` | `claim_work_item_api_v1_work_items__ref_id__claim_post` |
| POST | `/api/v1/work-items/{ref_id}/release` | `release_work_item_api_v1_work_items__ref_id__release_post` |
| POST | `/api/v1/work-items/{ref_id}/start` | `start_work_item_api_v1_work_items__ref_id__start_post` |
| POST | `/api/v1/work-items/{ref_id}/collections/edit` | `edit_work_item_collection_api_v1_work_items__ref_id__collections_edit_post` |
| POST | `/api/v1/work-items/{ref_id}/overrides` | `override_calculation_api_v1_work_items__ref_id__overrides_post` |
| POST | `/api/v1/work-items/{ref_id}/save` | `save_work_item_api_v1_work_items__ref_id__save_post` |
| POST | `/api/v1/work-items/{ref_id}/complete` | `complete_work_item_api_v1_work_items__ref_id__complete_post` |
| POST | `/api/v1/work-items/{ref_id}/reject` | `reject_work_item_api_v1_work_items__ref_id__reject_post` |
| POST | `/api/v1/work-items/{ref_id}/return` | `return_work_item_api_v1_work_items__ref_id__return_post` |
| POST | `/api/v1/work-items/{ref_id}/forward` | `forward_work_item_api_v1_work_items__ref_id__forward_post` |
| POST | `/api/v1/work-items/{ref_id}/cancel` | `cancel_work_item_api_v1_work_items__ref_id__cancel_post` |
| POST | `/api/v1/work-items/{ref_id}/expire` | `expire_work_item_api_v1_work_items__ref_id__expire_post` |
| POST | `/api/v1/work-items/{ref_id}/comment` | `comment_on_work_item_api_v1_work_items__ref_id__comment_post` |
| POST | `/api/v1/work-items/{ref_id}/read` | `read_work_item_api_v1_work_items__ref_id__read_post` |
| POST | `/api/v1/work-items/{ref_id}/pin` | `pin_work_item_api_v1_work_items__ref_id__pin_post` |
| POST | `/api/v1/work-items/{ref_id}/archive` | `archive_work_item_api_v1_work_items__ref_id__archive_post` |
| POST | `/api/v1/work-items/{ref_id}/watch` | `watch_work_item_api_v1_work_items__ref_id__watch_post` |
| POST | `/api/v1/work-items/{ref_id}/options` | `work_item_options_api_v1_work_items__ref_id__options_post` |

## workflow-versions

Backlog: STUDIO-05, STUDIO-06, STUDIO-08.

| Method | Exact path | Operation ID |
| --- | --- | --- |
| POST | `/api/v1/workflow-versions/search` | `search_versions_api_v1_workflow_versions_search_post` |
| POST | `/api/v1/workflow-versions/report` | `report_versions_api_v1_workflow_versions_report_post` |
| POST | `/api/v1/workflow-versions` | `create_version_api_v1_workflow_versions_post` |
| GET | `/api/v1/workflow-versions/{ref_id}` | `get_version_api_v1_workflow_versions__ref_id__get` |
| PUT | `/api/v1/workflow-versions/{ref_id}` | `update_version_api_v1_workflow_versions__ref_id__put` |
| DELETE | `/api/v1/workflow-versions/{ref_id}` | `delete_version_api_v1_workflow_versions__ref_id__delete` |
| GET | `/api/v1/workflow-versions/{ref_id}/graph` | `get_graph_api_v1_workflow_versions__ref_id__graph_get` |
| PUT | `/api/v1/workflow-versions/{ref_id}/graph` | `replace_graph_api_v1_workflow_versions__ref_id__graph_put` |
| POST | `/api/v1/workflow-versions/{ref_id}/history` | `version_history_api_v1_workflow_versions__ref_id__history_post` |
| POST | `/api/v1/workflow-versions/{ref_id}/publish` | `publish_version_api_v1_workflow_versions__ref_id__publish_post` |
| POST | `/api/v1/workflow-versions/{ref_id}/retire` | `retire_version_api_v1_workflow_versions__ref_id__retire_post` |

## workflows

Backlog: STUDIO-05, STUDIO-08.

| Method | Exact path | Operation ID |
| --- | --- | --- |
| POST | `/api/v1/workflows/validate` | `validate_graph_api_v1_workflows_validate_post` |
| POST | `/api/v1/workflows/search` | `search_workflows_api_v1_workflows_search_post` |
| POST | `/api/v1/workflows/report` | `report_workflows_api_v1_workflows_report_post` |
| POST | `/api/v1/workflows` | `create_workflow_api_v1_workflows_post` |
| GET | `/api/v1/workflows/{ref_id}` | `get_workflow_api_v1_workflows__ref_id__get` |
| PUT | `/api/v1/workflows/{ref_id}` | `update_workflow_api_v1_workflows__ref_id__put` |
| DELETE | `/api/v1/workflows/{ref_id}` | `delete_workflow_api_v1_workflows__ref_id__delete` |
| POST | `/api/v1/workflows/{ref_id}/history` | `workflow_history_api_v1_workflows__ref_id__history_post` |
| POST | `/api/v1/workflows/{ref_id}/grants` | `add_grant_api_v1_workflows__ref_id__grants_post` |
| DELETE | `/api/v1/workflows/{ref_id}/grants/{grant_ref_id}` | `remove_grant_api_v1_workflows__ref_id__grants__grant_ref_id__delete` |
