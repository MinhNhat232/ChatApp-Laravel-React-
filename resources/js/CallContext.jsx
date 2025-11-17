import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { usePage } from "@inertiajs/react";
import { useEventBus } from "@/EventBus";
import CallModal from "@/Components/App/CallModal";

const CallContext = createContext();

const serializeDescription = (description) => ({
    type: description.type,
    sdp: btoa(description.sdp),
});

const deserializeDescription = (payload) => {
    if (!payload) {
        return null;
    }

    return {
        type: payload.type,
        sdp: atob(payload.sdp),
    };
};

const formatDuration = (totalSeconds) => {
    const seconds = Math.max(0, totalSeconds);
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const mm = String(mins).padStart(2, "0");
    const ss = String(secs).padStart(2, "0");

    if (hrs > 0) {
        return `${String(hrs).padStart(2, "0")}:${mm}:${ss}`;
    }

    return `${mm}:${ss}`;
};

const initialCallState = {
    status: "idle",
    callId: null,
    callType: "audio",
    conversation: null,
    isCaller: false,
    remoteDescription: null,
};

const rtcConfig = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
    ],
};

export const CallProvider = ({ children }) => {
    const { emit } = useEventBus();
    const page = usePage();

    const [callState, setCallState] = useState(initialCallState);
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [callDuration, setCallDuration] = useState(0);

    const conversationsRef = useRef(page.props.conversations || []);
    const peerConnectionRef = useRef(null);
    const callStateRef = useRef(callState);
    const localStreamRef = useRef(null);
    const remoteStreamRef = useRef(null);
    const pendingCandidatesRef = useRef([]);
    const remoteDescriptionRef = useRef(null);
    const callDurationRef = useRef(0);
    const callTimerRef = useRef(null);
    const callStartTimestampRef = useRef(null);
    const callSummaryLoggedRef = useRef(false);

    useEffect(() => {
        conversationsRef.current = page.props.conversations || [];
    }, [page.props.conversations]);

    useEffect(() => {
        callStateRef.current = callState;
    }, [callState]);

    useEffect(() => {
        callDurationRef.current = callDuration;
    }, [callDuration]);

    useEffect(() => {
        if (callState.status === "active") {
            callStartTimestampRef.current = Date.now();
            setCallDuration(0);
            callTimerRef.current = setInterval(() => {
                if (!callStartTimestampRef.current) {
                    return;
                }
                const elapsed = Math.floor((Date.now() - callStartTimestampRef.current) / 1000);
                setCallDuration(elapsed);
            }, 1000);
        } else {
            if (callTimerRef.current) {
                clearInterval(callTimerRef.current);
                callTimerRef.current = null;
            }
            callStartTimestampRef.current = null;
            setCallDuration(0);
        }

        return () => {
            if (callTimerRef.current && callState.status !== "active") {
                clearInterval(callTimerRef.current);
                callTimerRef.current = null;
            }
        };
    }, [callState.status]);

    const resetState = useCallback(() => {
        setCallState(initialCallState);
        setLocalStream(null);
        setRemoteStream(null);
        setIsMuted(false);
        setIsCameraOff(false);
        pendingCandidatesRef.current = [];
        remoteDescriptionRef.current = null;
        callSummaryLoggedRef.current = false;
    }, []);

    const cleanupCall = useCallback(() => {
        if (peerConnectionRef.current) {
            peerConnectionRef.current.ontrack = null;
            peerConnectionRef.current.onicecandidate = null;
            peerConnectionRef.current.onconnectionstatechange = null;
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => track.stop());
            localStreamRef.current = null;
        }

        if (remoteStreamRef.current) {
            remoteStreamRef.current.getTracks().forEach((track) => track.stop());
            remoteStreamRef.current = null;
        }

        resetState();
    }, [resetState]);

    const postSignal = useCallback(({ callId, callType, signalType, payload = {}, conversation }) => {
        if (!conversation || !callId) {
            return Promise.resolve();
        }

        return axios.post(route("calls.signal"), {
            call_id: callId,
            call_type: callType,
            signal_type: signalType,
            payload,
            is_group: !!conversation.is_group,
            target_id: conversation.id,
        });
    }, []);

    const applyPendingCandidates = useCallback(async () => {
        const pc = peerConnectionRef.current;
        if (!pc || !pc.remoteDescription) {
            return;
        }

        const candidates = [...pendingCandidatesRef.current];
        pendingCandidatesRef.current = [];

        for (const candidate of candidates) {
            try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (error) {
                console.error("Error adding ICE candidate", error);
            }
        }
    }, []);

    const createPeerConnection = useCallback(() => {
        const pc = new RTCPeerConnection(rtcConfig);

        pc.ontrack = (event) => {
            const [stream] = event.streams;
            if (stream) {
                remoteStreamRef.current = stream;
                setRemoteStream(stream);
            }
        };

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                const current = callStateRef.current;
                postSignal({
                    callId: current.callId,
                    callType: current.callType,
                    signalType: "candidate",
                    payload: { candidate: event.candidate },
                    conversation: current.conversation,
                });
            }
        };

        pc.onconnectionstatechange = () => {
            if (["failed", "disconnected"].includes(pc.connectionState)) {
                cleanupCall();
                emit("toast.show", "Call disconnected");
            }
        };

        peerConnectionRef.current = pc;
        return pc;
    }, [cleanupCall, emit, postSignal]);

    const buildConversationFromSignal = useCallback((signal) => {
        if (signal.group_id) {
            return (
                conversationsRef.current.find(
                    (conversation) => conversation.is_group && conversation.id === signal.group_id,
                ) ?? {
                    id: signal.group_id,
                    name: `Group #${signal.group_id}`,
                    is_group: true,
                    is_user: false,
                }
            );
        }

        return (
            conversationsRef.current.find(
                (conversation) => conversation.is_user && conversation.id === signal.sender.id,
            ) ?? {
                id: signal.sender.id,
                name: signal.sender.name,
                avatar_url: signal.sender.avatar_url,
                is_group: false,
                is_user: true,
            }
        );
    }, []);

    const ensureMediaPermissions = async (callType) => {
        if (!navigator?.mediaDevices?.getUserMedia) {
            throw new Error("Your browser does not support voice/video calls");
        }

        return navigator.mediaDevices.getUserMedia({
            audio: true,
            video: callType === "video",
        });
    };

    const startCall = useCallback(
        async (conversation, callType = "audio") => {
            if (!conversation) {
                return;
            }

            if (callStateRef.current.status !== "idle") {
                emit("toast.show", "Another call is already active");
                return;
            }

            try {
                const stream = await ensureMediaPermissions(callType);
                localStreamRef.current = stream;
                setLocalStream(stream);
                setIsMuted(false);
                setIsCameraOff(false);

                const callId = uuidv4();
                const pc = createPeerConnection();
                stream.getTracks().forEach((track) => pc.addTrack(track, stream));

                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                const offerDescription = serializeDescription(offer);

                setCallState({
                    status: "outgoing",
                    callId,
                    callType,
                    conversation,
                    isCaller: true,
                    remoteDescription: null,
                });

                await postSignal({
                    callId,
                    callType,
                    signalType: "offer",
                    payload: offerDescription,
                    conversation,
                });
            } catch (error) {
                console.error(error);
                emit("toast.show", error.message || "Unable to start the call");
                cleanupCall();
            }
        },
        [cleanupCall, createPeerConnection, emit, postSignal],
    );

    const acceptCall = useCallback(async () => {
        if (callStateRef.current.status !== "incoming") {
            return;
        }

        try {
            const current = callStateRef.current;
            const stream = await ensureMediaPermissions(current.callType);
            localStreamRef.current = stream;
            setLocalStream(stream);
            setIsMuted(false);
            setIsCameraOff(false);

            const pc = createPeerConnection();
            stream.getTracks().forEach((track) => pc.addTrack(track, stream));

            const remoteDescriptionPayload = current.remoteDescription || remoteDescriptionRef.current;
            if (remoteDescriptionPayload) {
                const remoteDescription = deserializeDescription(remoteDescriptionPayload);
                await pc.setRemoteDescription(new RTCSessionDescription(remoteDescription));
            }

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            const answerDescription = serializeDescription(answer);

            setCallState((prev) => ({
                ...prev,
                status: "active",
            }));

            await postSignal({
                callId: current.callId,
                callType: current.callType,
                signalType: "answer",
                payload: answerDescription,
                conversation: current.conversation,
            });

            await applyPendingCandidates();
        } catch (error) {
            console.error(error);
            emit("toast.show", error.message || "Unable to join the call");
            cleanupCall();
        }
    }, [applyPendingCandidates, cleanupCall, createPeerConnection, emit, postSignal]);

    const logCallSummary = useCallback(
        async ({ reason }) => {
            if (callSummaryLoggedRef.current) {
                return;
            }
            const current = callStateRef.current;
            if (!current?.conversation) {
                return;
            }

            const callLabel = current.callType === "video" ? "Video call" : "Voice call";
            const duration = callDurationRef.current;
            let message = "";

            if (reason === "completed") {
                message = `Call ended • ${formatDuration(duration)}`;
            } else if (reason === "missed") {
                message = `Missed ${callLabel.toLowerCase()}`;
            } else if (reason === "canceled") {
                message = `Canceled ${callLabel.toLowerCase()}`;
            } else if (reason === "declined") {
                message = `Declined ${callLabel.toLowerCase()}`;
            }

            if (!message) {
                return;
            }

            const summaryMeta = {
                call_type: current.callType,
                status: reason,
                duration_seconds: duration,
                formatted_duration: formatDuration(duration),
                initiated_by: page.props.auth.user?.id,
            };

            const payload = new FormData();
            payload.append("message", message);
            payload.append("type", "call_summary");
            payload.append("meta", JSON.stringify(summaryMeta));


            if (current.conversation.is_user) {
                payload.append("receiver_id", current.conversation.id);
            } else if (current.conversation.is_group) {
                payload.append("group_id", current.conversation.id);
            } else {
                return;
            }

            try {
                const { data: summaryMessage } = await axios.post(route("message.store"), payload);
                emit("message.created", summaryMessage);
                callSummaryLoggedRef.current = true;
            } catch (error) {
                console.error("Unable to log call summary", error);
                emit("toast.show", "Unable to log call summary");
            }
        },
        [emit],
    );

    const rejectCall = useCallback(async () => {
        if (callStateRef.current.status !== "incoming") {
            cleanupCall();
            return;
        }

        const current = callStateRef.current;
        await postSignal({
            callId: current.callId,
            callType: current.callType,
            signalType: "reject",
            conversation: current.conversation,
        });

        await logCallSummary({ reason: "declined" });
        cleanupCall();
    }, [cleanupCall, logCallSummary, postSignal]);

    const hangUp = useCallback(async () => {
        if (callStateRef.current.status === "idle") {
            return;
        }

        const current = callStateRef.current;

        const signalType = current.status === "outgoing" ? "cancel" : "hangup";

        await postSignal({
            callId: current.callId,
            callType: current.callType,
            signalType,
            conversation: current.conversation,
        });

        let summaryReason = "canceled";
        if (current.status === "active") {
            summaryReason = "completed";
        } else if (current.status === "outgoing") {
            summaryReason = "missed";
        }

        await logCallSummary({ reason: summaryReason });
        cleanupCall();
    }, [cleanupCall, logCallSummary, postSignal]);

    const toggleMute = useCallback(() => {
        if (!localStreamRef.current) {
            return;
        }

        const nextValue = !isMuted;
        localStreamRef.current.getAudioTracks().forEach((track) => {
            track.enabled = !nextValue;
        });
        setIsMuted(nextValue);
    }, [isMuted]);

    const toggleCamera = useCallback(() => {
        if (!localStreamRef.current || callStateRef.current.callType !== "video") {
            return;
        }

        const nextValue = !isCameraOff;
        localStreamRef.current.getVideoTracks().forEach((track) => {
            track.enabled = !nextValue;
        });
        setIsCameraOff(nextValue);
    }, [isCameraOff]);

    const busyMessage = {
        busy: "is already on another call",
        reject: "declined the call",
        cancel: "cancelled the call",
        hangup: "ended the call",
    };

    const handleIncomingSignal = useCallback(
        async (signal) => {
            const conversation = buildConversationFromSignal(signal);

            switch (signal.signal_type) {
                case "offer": {
                    if (callStateRef.current.status !== "idle") {
                        await postSignal({
                            callId: signal.call_id,
                            callType: signal.call_type,
                            signalType: "busy",
                            conversation,
                        });
                        return;
                    }

                    remoteDescriptionRef.current = signal.payload ?? null;

                    setCallState({
                        status: "incoming",
                        callId: signal.call_id,
                        callType: signal.call_type,
                        conversation,
                        isCaller: false,
                        remoteDescription: signal.payload ?? null,
                    });
                    break;
                }
                case "answer": {
                    const pc = peerConnectionRef.current;
                    if (pc && signal.payload?.sdp) {
                        if (pc.signalingState !== "have-local-offer") {
                            console.warn(
                                "[Call] Ignoring answer because signalingState=",
                                pc.signalingState,
                            );
                            break;
                        }

                        const description = deserializeDescription(signal.payload);
                        await pc.setRemoteDescription(new RTCSessionDescription(description));
                        await applyPendingCandidates();
                        setCallState((prev) => ({
                            ...prev,
                            status: "active",
                        }));
                    }
                    break;
                }
                case "candidate": {
                    if (!signal.payload?.candidate) {
                        return;
                    }

                    if (peerConnectionRef.current && peerConnectionRef.current.remoteDescription) {
                        try {
                            await peerConnectionRef.current.addIceCandidate(
                                new RTCIceCandidate(signal.payload.candidate),
                            );
                        } catch (error) {
                            console.error("Unable to add ICE candidate", error);
                        }
                    } else {
                        pendingCandidatesRef.current.push(signal.payload.candidate);
                    }
                    break;
                }
                case "hangup":
                case "reject":
                case "cancel":
                case "busy": {
                    let reason = "canceled";
                    if (signal.signal_type === "hangup" && callStateRef.current.status === "active") {
                        reason = "completed";
                    } else if (signal.signal_type === "reject") {
                        reason = "declined";
                    } else if (signal.signal_type === "busy") {
                        reason = "missed";
                    }

                    // Giảm bớt toast để tránh spam, chỉ log lỗi trong console
                    if (busyMessage[signal.signal_type]) {
                        console.debug("[Call]", busyMessage[signal.signal_type], conversation);
                    }
                    await logCallSummary({ reason });
                    cleanupCall();
                    break;
                }
                default:
                    break;
            }
        },
        [applyPendingCandidates, buildConversationFromSignal, cleanupCall, emit, postSignal],
    );

    useEffect(() => {
        return () => {
            cleanupCall();
        };
    }, [cleanupCall]);

    const callDurationLabel = formatDuration(callDuration);

    return (
        <CallContext.Provider
            value={{
                callState,
                localStream,
                remoteStream,
                isMuted,
                isCameraOff,
                callDuration,
                callDurationLabel,
                startCall,
                acceptCall,
                rejectCall,
                hangUp,
                toggleMute,
                toggleCamera,
                handleIncomingSignal,
            }}
        >
            {children}
                <CallModal
                    state={callState}
                    localStream={localStream}
                    remoteStream={remoteStream}
                    isMuted={isMuted}
                    isCameraOff={isCameraOff}
                    durationLabel={callDurationLabel}
                    showLocalPreview={!callState.isCaller}
                    onAccept={acceptCall}
                    onReject={rejectCall}
                    onHangup={hangUp}
                    onToggleMic={toggleMute}
                    onToggleCamera={toggleCamera}
                />
        </CallContext.Provider>
    );
};

export const useCall = () => useContext(CallContext);

