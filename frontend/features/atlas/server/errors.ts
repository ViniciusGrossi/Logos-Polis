export type AtlasErrorCode = "INVALID_QUERY" | "UNAUTHENTICATED" | "SNAPSHOT_UNAVAILABLE" | "SNAPSHOT_INVALID" | "ELECTION_UNAVAILABLE" | "INCOMPATIBLE_COMPARISON" | "CANDIDATE_UNAVAILABLE" | "TERRITORY_NOT_FOUND" | "INDICATOR_UNAVAILABLE" | "OFFICES_UNAVAILABLE" | "INTERNAL_ERROR";

export class AtlasError extends Error {
  constructor(public readonly code: AtlasErrorCode, message: string, public readonly status = 400) {
    super(message);
    this.name = "AtlasError";
  }
}
