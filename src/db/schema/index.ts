import { getDriver } from "../driver";
import * as postgres from "./postgres";
import * as sqlite from "./sqlite";

const active = getDriver() === "sqlite" ? sqlite : postgres;

/** Runtime table refs for the active driver; typed as SQLite (structurally identical). */
export const matches = active.matches as typeof sqlite.matches;
export const players = active.players as typeof sqlite.players;
export const innings = active.innings as typeof sqlite.innings;
export const deliveries = active.deliveries as typeof sqlite.deliveries;
export const scorerSessions = active.scorerSessions as typeof sqlite.scorerSessions;
export const matchLikes = active.matchLikes as typeof sqlite.matchLikes;
export const matchComments = active.matchComments as typeof sqlite.matchComments;
