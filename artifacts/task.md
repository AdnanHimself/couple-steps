## Phase 1: Unified Abstraction Layer
- [x] Create `src/services/HealthService.ts` interface
- [x] Define common data types (StepData, HistoryData)
- [x] Set up `Platform.select` routing

## Phase 1: Unified Abstraction Layer
- [x] Create `src/services/HealthService.ts` interface
- [x] Define common data types (StepData, HistoryData)
- [x] Set up `Platform.select` routing

## Phase 2: Android Health Connect (Re-Integration)
- [x] Fix `PedometerService.ts` permission handling (via AndroidHealthConnect.ts)
- [x] Implement robust error handling for SecurityExceptions
- [x] Add "Open Health Connect Settings" UI flow
- [x] Verify background updates (via system polling)
- [x] Verify Cross-Platform Flow (Android & iOS)
- [ ] Test Fallback to Native Sensor (Foreground)
- [ ] Test Permission Denied flows

## Phase 3: Feature Completion & Polish (MVP)
- [x] **Stats:** Weekly (7-day) and Daily (Hourly) views with toggle
- [x] **Challenges:** Migrate to Database (Supabase)
- [x] **Challenges:** Solo & Couple challenge selection
- [x] **UI:** Fix Bottom Sheet transparency and touch handling
- [x] **UI:** Polish Navigation Bar and Dashboard
- [x] **Sync:** Hybrid Step Tracking (Native + Health Connect)

## Post-MVP / Roadmap
- [ ] **Notifications:** Push Notifications (FCM/APNs) for nudges & challenges
- [ ] **Sharing:** Deep Linking for easier partner coupling
- [ ] **Profile:** Edit Avatar/Name, Unit toggle (km/miles)
- [ ] **Offline:** Robust offline support and sync queue
- [ ] **Social:** Chat features (Reactions, Images) - *Deferred*
- [ ] **iOS:** HealthKit Background Sync
