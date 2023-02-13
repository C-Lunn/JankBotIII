import { z } from "zod";

export enum ResponseKind {
    Ok = 0,
    InvalidRequest = 999
}

export const response_schema = z.object({
    kind: z.nativeEnum(ResponseKind),
    ref: z.string(),
    data: z.any(),
});

export type Response = z.infer<typeof response_schema>