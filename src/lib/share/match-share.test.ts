import { describe, it, expect } from "vitest";
import { buildMatchShareUrl, buildShareResultText } from "./match-share";
import type { MatchState } from "@/components/scoreboard";

function makeState(overrides: Partial<MatchState["match"]> = {}): MatchState {
  return {
    match: {
      id: "match-1",
      teamAName: "Northside",
      teamBName: "Riverside",
      tossWinner: "a",
      electedTo: "bat",
      createdByUserId: "user-1",
      status: "completed",
      createdAt: new Date(),
      ...overrides,
    },
    players: [],
    innings: [
      {
        innings: {
          id: "inn-1",
          matchId: "match-1",
          inningsNumber: 1,
          battingTeam: "a",
          target: null,
        },
        state: {
          totalRuns: 150,
          wickets: 5,
          legalBalls: 120,
          oversDisplay: "20.0",
          runRate: 7.5,
          isComplete: true,
          isFreeHit: false,
          strikerId: "s1",
          nonStrikerId: "s2",
          bowlerId: "b1",
          batsmanStats: {},
          bowlerStats: {},
          fallOfWickets: [],
        },
        deliveries: [],
      },
      {
        innings: {
          id: "inn-2",
          matchId: "match-1",
          inningsNumber: 2,
          battingTeam: "b",
          target: 151,
        },
        state: {
          totalRuns: 148,
          wickets: 10,
          legalBalls: 118,
          oversDisplay: "19.4",
          runRate: 7.46,
          isComplete: true,
          isFreeHit: false,
          strikerId: "s3",
          nonStrikerId: "s4",
          bowlerId: "b2",
          batsmanStats: {},
          bowlerStats: {},
          fallOfWickets: [],
        },
        deliveries: [],
      },
    ],
  };
}

describe("buildMatchShareUrl", () => {
  it("builds a match URL from origin and id", () => {
    expect(buildMatchShareUrl("abc-123", "https://score.test")).toBe(
      "https://score.test/m/abc-123",
    );
  });
});

describe("buildShareResultText", () => {
  it("includes teams, winner, margin, and link", () => {
    const text = buildShareResultText(
      makeState(),
      "https://score.test/m/match-1",
    );

    expect(text).toContain("Northside vs Riverside");
    expect(text).toContain("Northside won by 2 runs");
    expect(text).toContain("https://score.test/m/match-1");
  });
});
