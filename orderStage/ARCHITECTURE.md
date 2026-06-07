# orderStage Architecture

## Layers

| Layer | Path | Responsibility |
|-------|------|----------------|
| **core** | `orderStage/core/` | Pure SSOT logic — no UI, no direct DOM |
| **storage** | `orderStage/storage/` | LocalDB + overlay persistence |
| **runtime** | `orderStage/runtime/` | Session, load, render orchestration |
| **ui** | `orderStage/orderData/parts/` | HTML rendering only |
| **ui controllers** | `orderStage/orderData/js/` | Stepper, dialogs, item actions |

## Data Flow

```
Load → OrderSessionContext / main-loader
Normalize → orderParseStatus → OrderStatusService.syncStepIdToOrderRoot
Mutate → OrderStatusService (status JSON only)
Persist → OrderRepository (ONLY write gateway)
Sync merge → OrderSyncCoordinator.mergeRemoteWithLocal + OrderOverlayStorage
Render → OrderRenderCoordinator.renderAll
UI rules → OrderWorkflowRules.getUiCapabilities
```

## SSOT Rules

1. `order_status.step_id` is canonical; `current_step_id` is derived.
2. Never call `orderSaveToLocalDB` or Firestore from `parts/*`.
3. Never read `step_id` inline in parts — use `getUiCapabilities`.
4. Run `npm run order-stage:test` and `npm run order-stage:check` after changes.
