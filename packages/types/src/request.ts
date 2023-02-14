import { z } from "zod";

export enum RequestKind {
    // meta
    AcquireToken = 1,
    CheckQueue = 101,
    GetQueueContents = 103,
    // player controls
    Play = 201,
    Stop = 202,
    Pause = 203,
    Seek = 204,
    SkipToPosition = 205,
    Next = 206,
    Prev = 207,
    // gramophone stuff
    ImportThread = 301,
    EnableDJMode = 302,
    DisableDJMode = 303,
}

export const request_schema = z.object({
    kind: z.nativeEnum(RequestKind),
    data: z.any(),
    ref: z.string(),
})

export type Request = z.infer<typeof request_schema>;

