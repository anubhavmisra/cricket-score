---
target: match view
total_score: 26
p0_count: 0
p1_count: 3
p2_count: 2
timestamp: 2026-06-20T04-24-47Z
slug: src-components-match-view-tsx
---
# Critique: Match View

Target: `src/components/match-view.tsx` (Scoreboard, BallPad, ShareLinkBar, modals)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Offline banner works; no sync-success or live/stale indicator |
| 2 | Match System / Real World | 3 | Cricket terms fit; "W" and "RR" assume scorer literacy |
| 3 | User Control and Freedom | 3 | Undo + modal cancel; no way to lock scoring after unlock |
| 4 | Consistency and Standards | 3 | Token system cohesive; reconnect banner unlike other alerts |
| 5 | Error Prevention | 2 | Ball taps commit instantly; wicket grid is easy to mis-tap |
| 6 | Recognition Rather Than Recall | 2 | "W" for wicket; abbreviations without inline hints |
| 7 | Flexibility and Efficiency | 2 | Mobile-first taps work; no scorer accelerators |
| 8 | Aesthetic and Minimalist Design | 3 | Score-first hierarchy lands; share bar adds top chrome while scoring |
| 9 | Error Recovery | 3 | Undo + offline queue; silent sync failure path |
| 10 | Help and Documentation | 2 | No contextual help for abbreviations or first-time scoring |
| **Total** | | **26/40** | **Acceptable** |

## Anti-Patterns Verdict

**LLM assessment: Pass (with reservations).** The surface no longer reads as AI slop. Pitch-green tokens, flat scorecard, sentence-case labels, and a single divided card beat the generic gray scaffold. It still feels like a competent mobile utility rather than a distinctive cricket product, which is acceptable for this register.

**Deterministic scan:** 0 findings across match-view, scoreboard, ball-pad, share-link-bar, pin-unlock-modal, start-second-innings-flow.

**Browser visualization:** Not run (no browser automation available in this session). Assessment based on source review only.

## Overall Impression

The match view finally puts the score where it belongs: sticky, large, readable in sunlight. The scorer path is usable one-handed. The biggest gap is trust feedback: users cannot tell when the score is live, syncing, or stale, and the ball pad commits too eagerly for a high-stakes task.

## What's Working

1. **Sticky live score header** keeps runs/wickets/overs visible while scrolling details or reaching the ball pad.
2. **Ball pad placement and sizing** (48px targets, bottom of screen) matches the field scorer persona from PRODUCT.md.
3. **Progressive 2nd innings flow** (striker → non-striker → bowler modals) breaks a complex setup into one decision at a time.

## Priority Issues

**[P1] Wicket control labeled only "W"**
- **Why:** Novice scorers and spectators handed the phone must decode a single letter under pressure.
- **Fix:** Label "Wicket" or use "Wkt" with `aria-label="Record wicket"`.
- **Suggested command:** `/impeccable clarify`

**[P1] No feedback when offline deliveries sync successfully**
- **Why:** Scorers need to know queued balls reached the server before trusting the shared link.
- **Fix:** Transient success toast/banner: "Synced 3 balls" after `syncDeliveries` completes.
- **Suggested command:** `/impeccable harden`

**[P1] Ball pad commits on first tap with no mis-tap guard**
- **Why:** A wrong run in a tight over is a common field mistake; undo exists but is easy to miss mid-flow.
- **Fix:** Optional confirm for 4/6/wicket, or brief undo snackbar after each ball.
- **Suggested command:** `/impeccable shape`

**[P2] "Reconnecting…" does not communicate data freshness**
- **Why:** Viewers cannot tell if the score is stale or still updating.
- **Fix:** Pair with last-updated timestamp or pulsing live dot when poll succeeds.
- **Suggested command:** `/impeccable harden`

**[P2] Share link bar competes with scoring focus**
- **Why:** After unlock, the scorer rarely needs copy-link at the top of every scroll.
- **Fix:** Collapse share bar once scoring starts, or move to overflow menu.
- **Suggested command:** `/impeccable distill`

## Persona Red Flags

**Casey (Distracted Mobile):** Share link + offline banner stack above the score before the scorer reaches the pad. Wicket picker forces 6-tile decision mid-interruption with no progress indicator (step 2 of 2).

**Marcus (Club Scorer):** Scoring unlock persists in localStorage with no "Stop scoring" control, so handing the phone to a parent shows the full ball pad. Forced bowler picker every over is correct cricket but breaks rhythm; no skip for same bowler continuing.

**Jordan (First-Timer):** "RR 8.42" and "(12.3 ov)" appear without explanation. "W" on the red button does not read as an action label. No confirmation that a tapped run was recorded except score changing on next poll.

## Minor Observations

- Fall of wickets becomes a dense inline paragraph on wicket-heavy innings.
- `Start scoring` sits below the full scorecard; viewers scroll past stats to find the CTA.
- Match completed state hides ball pad but leaves no summary CTA (share result, new match).
- Recording state dims the pad but gives no text ("Saving…") for low-vision users.

## Questions to Consider

- Should every ball show a 2-second undo chip instead of a full-width undo button?
- Would a collapsed "Share" row free vertical space for the score during live overs?
- What if viewers saw "Updated 3s ago" beside the team names?
