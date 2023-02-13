import { z } from "zod";

export enum ResponseKind {
    Ok = 0,
    Empty = 1,
    NoQueue = 2,
    NoData = 3,
    InvalidRequest = 999
}

export const response_schema = z.object({
    kind: z.nativeEnum(ResponseKind),
    ref: z.string(),
    data: z.any(),
});

export type Response = z.infer<typeof response_schema>