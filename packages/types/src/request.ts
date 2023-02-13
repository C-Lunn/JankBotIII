import { z } from "zod";

export enum RequestKind {
    AcquireToken = 1,
    CheckQueue = 101,
    // StartQueue = 102,
    GetQueueContents = 103,
    Play = 201,
    Stop = 202,
    Pause = 203,
    Seek = 204,
}

export const request_schema = z.object({
    kind: z.nativeEnum(RequestKind),
    data: z.any(),
    ref: z.string(),
})

export type Request = z.infer<typeof request_schema>;

