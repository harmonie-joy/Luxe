# Pilot Demo Checklist

This walkthrough demonstrates the verified idea/drafting path: Creator Home →
an explicitly accepted BrandVoice version → a persisted Project/ContentItem →
saved checkpoint and resume → the next action. It is a functional pilot
walkthrough, not proof of release readiness or founder design acceptance.

## Before the session

- [ ] Use a non-production environment and an authorized test account and
  Workspace. Use synthetic content only.
- [ ] Confirm a relevant BrandVoice version is available for the participant
  to review. An active version is not automatically accepted; acceptance must
  be explicit and apply to the exact version used by the item.
- [ ] Choose a small fictional task. Do not use real creator, client, or
  customer material.
- [ ] Have the [feedback template](FEEDBACK_TEMPLATE.md) ready for manual
  notes. Do not enter feedback or creator content into analytics or the app.

## Walkthrough

1. Sign in and open Creator Home (`/dashboard`). Confirm the expected test
   Workspace is active and the item list is available.
2. Review the intended BrandVoice version. If it has not already been
   explicitly accepted, have the participant accept that exact version before
   creating the item. Do not treat activation alone as approval.
3. Open the content-item creation flow (`/content-items/new`) and create a
   Project/ContentItem for the fictional task. Confirm it appears as saved
   work. Do not create another item if the result is uncertain; first check
   Creator Home.
4. On the item, enter a short goal, stage, decision, open question, and next
   action using synthetic information. Save a checkpoint and confirm the UI
   reports that the save succeeded.
5. Refresh the item. Confirm the saved checkpoint fields and the item are
   still present, and that the item remains bound to the accepted BrandVoice
   version.
6. Sign out, sign in again in a fresh session, and resume the item from Creator
   Home. Confirm the saved context and next action are available.
7. Ask the participant whether the next action is clear and whether the
   workflow fits the task. Record feedback in the template without copying
   post text, credentials, or other sensitive material.

## If a step fails

- If Creator Home or the item is unavailable, stop and check the test account,
  Workspace, and service status. Record the step as blocked; do not report the
  walkthrough as passed.
- If creation has an uncertain result or the connection drops, check Creator
  Home for the saved item before retrying. Replaying a create request can make
  a duplicate.
- If checkpoint save fails or reports a revision conflict, keep the current
  edits on screen and explain the available deliberate reload/discard choice.
  There is no automatic conflict merge; do not choose for the participant.
- If the exact BrandVoice version has not been accepted, pause creation until
  the participant reviews and explicitly accepts it.
- Record the blocker and its impact in the feedback template. Do not claim a
  successful save, resume, or broader product capability that was not
  observed.

For the verified behavior and its evidence, see the
[IA-1 real-service verification report](../qa/IA1_REAL_BROWSER_VERIFICATION.md)
and [screen traceability](../ux/SCREEN_TRACEABILITY.md).
