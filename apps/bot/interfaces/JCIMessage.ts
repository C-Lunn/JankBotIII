enum JCIMessageType {
    AUTHENTICATE_CHALLENGE, // server to client
    AUTHENTICATE_RESPONSE, // client to server
    SESSION_SETUP, // server to client
    QUEUE_CONTROL, // client to server
    QUEUE,
    QUEUE_CHANGE,
    QUEUE_MOVE,
    QUEUE_MOVE_REQUEST,
    QUEUE_REMOVE,
    QUEUE_REMOVE_REQUEST,
    QUEUE_ADD,
    QUEUE_ADD_REQUEST,
    QUEUE_INDEX_UPDATE,
    NO_QUEUE,
    PLAYING_STATUS_UPDATE,
    SEEK_REQUEST,
    PLAY_REQUEST,
    PAUSE_REQUEST,
    STAGE_STATUS_UPDATE,
    START_STAGE_REQUEST,
    ERROR
}


interface JCIMessage {
    timestamp: number;
    type: JCIMessageType;
}

interface AuthenticateChallenge extends JCIMessage {
    type: JCIMessageType.AUTHENTICATE_CHALLENGE;
}

interface AuthenticateResponse extends JCIMessage {
    type: JCIMessageType.AUTHENTICATE_RESPONSE;
    otp: string;
}

interface UserInfo {
    id: string;
    username: string;
    server_nick?: string;
    avatar_url?: string;
}

interface QueueEntry {
    index: number,
    title: string,
    user_is_present: boolean,
    duration: number,
    url: string
    submitted_by: UserInfo
}

interface QueueMsg extends JCIMessage {
    type: JCIMessageType.QUEUE;
    queue: QueueEntry[],
    active_index: number
}

interface QueueChangeMsg extends JCIMessage {
    type: JCIMessageType.QUEUE_CHANGE;
    delta: {
        index: number,
        title?: string,
        user_is_present?: boolean,
        duration?: number,
        url?: string
        submitted_by?: UserInfo
    }
}

interface QueueMoveMsg extends JCIMessage {
    type: JCIMessageType.QUEUE_MOVE;
    from: number;
    to: number;
}

interface QueueMoveRequestMsg extends JCIMessage {
    type: JCIMessageType.QUEUE_MOVE_REQUEST;
    from: number;
    to: number;
}

interface QueueRemoveMsg extends JCIMessage {
    type: JCIMessageType.QUEUE_REMOVE;
    index: number;
}

interface QueueRemoveRequestMsg extends JCIMessage {
    type: JCIMessageType.QUEUE_REMOVE_REQUEST;
    index: number;
}

interface QueueAddMsg extends JCIMessage {
    type: JCIMessageType.QUEUE_ADD;
    entry: QueueEntry;
}

interface QueueAddRequestMsg extends JCIMessage {
    type: JCIMessageType.QUEUE_ADD_REQUEST;
    url: string;
}

interface QueueIndexUpdateMsg extends JCIMessage {
    type: JCIMessageType.QUEUE_INDEX_UPDATE;
    index: number;
}

interface NoQueueMsg extends JCIMessage {
    type: JCIMessageType.NO_QUEUE;
}

interface PlayingStatusUpdateMsg extends JCIMessage {
    type: JCIMessageType.PLAYING_STATUS_UPDATE;
    is_playing: boolean;
    present_duration: number;
}

interface SessionSetupMsg extends JCIMessage {
    type: JCIMessageType.SESSION_SETUP;
    session_id: string;
    stage_status: 'active' | 'inactive';
    queue?: QueueEntry[];
}

interface SeekRequestMsg extends JCIMessage {
    type: JCIMessageType.SEEK_REQUEST;
    position: number;
}

interface PlayRequestMsg extends JCIMessage {
    type: JCIMessageType.PLAY_REQUEST;
}

interface PauseRequestMsg extends JCIMessage {
    type: JCIMessageType.PAUSE_REQUEST;
}

interface ErrorMsg extends JCIMessage {
    type: JCIMessageType.ERROR;
    error: string;
}

interface StageStatusUpdateMsg extends JCIMessage {
    type: JCIMessageType.STAGE_STATUS_UPDATE;
    stage_status: 'active' | 'inactive';
}

interface StartStageRequestMsg extends JCIMessage {
    type: JCIMessageType.START_STAGE_REQUEST;
}

type JCIRequest = AuthenticateResponse | QueueMoveRequestMsg | QueueRemoveRequestMsg | QueueAddRequestMsg | SeekRequestMsg | PlayRequestMsg | PauseRequestMsg;

type JCIResponse = AuthenticateChallenge | ErrorMsg | SessionSetupMsg | QueueMsg | QueueChangeMsg | QueueMoveMsg | QueueRemoveMsg | QueueAddMsg | QueueIndexUpdateMsg | NoQueueMsg | PlayingStatusUpdateMsg;

type JCIRequestOrResponse = JCIRequest | JCIResponse;

export {
    JCIMessageType,
    JCIMessage,
    AuthenticateChallenge,
    AuthenticateResponse,
    QueueMsg,
    QueueChangeMsg,
    QueueMoveMsg,
    QueueMoveRequestMsg,
    QueueRemoveMsg,
    QueueRemoveRequestMsg,
    QueueAddMsg,
    QueueAddRequestMsg,
    QueueIndexUpdateMsg,
    NoQueueMsg,
    PlayingStatusUpdateMsg,
    SessionSetupMsg,
    SeekRequestMsg,
    PlayRequestMsg,
    PauseRequestMsg,
    JCIRequest,
    JCIResponse,
    JCIRequestOrResponse,
    ErrorMsg
}

