import { describe, it, expect } from "vitest";
import { deriveInningsState } from "./derive-score";
import type { DeliveryInput, InningsConfig } from "./types";

const config: InningsConfig = {
  maxOvers: 20,
  maxWickets: 10,
  openingStrikerId: "s1",
  openingNonStrikerId: "s2",
  openingBowlerId: "b1",
};

function delivery(partial: Partial<DeliveryInput> & Pick<DeliveryInput, "sequence">): DeliveryInput {
  return {
    overNumber: 0,
    ballInOver: 1,
    runsOffBat: 0,
    extraRuns: 0,
    isWicket: false,
    strikerId: "s1",
    nonStrikerId: "s2",
    bowlerId: "b1",
    ...partial,
  };
}

describe("deriveInningsState", () => {
  it("computes runs and legal balls for a simple over", () => {
    const deliveries: DeliveryInput[] = [
      delivery({ sequence: 1, runsOffBat: 1, ballInOver: 1 }),
      delivery({ sequence: 2, runsOffBat: 4, ballInOver: 2, strikerId: "s2", nonStrikerId: "s1" }),
      delivery({ sequence: 3, runsOffBat: 0, ballInOver: 3, strikerId: "s2", nonStrikerId: "s1" }),
      delivery({ sequence: 4, runsOffBat: 0, ballInOver: 4, strikerId: "s2", nonStrikerId: "s1" }),
      delivery({ sequence: 5, runsOffBat: 0, ballInOver: 5, strikerId: "s2", nonStrikerId: "s1" }),
      delivery({ sequence: 6, runsOffBat: 2, ballInOver: 6, strikerId: "s2", nonStrikerId: "s1" }),
    ];

    const state = deriveInningsState(deliveries, config);

    expect(state.totalRuns).toBe(7);
    expect(state.wickets).toBe(0);
    expect(state.legalBalls).toBe(6);
    expect(state.oversDisplay).toBe("1.0");
  });
});
