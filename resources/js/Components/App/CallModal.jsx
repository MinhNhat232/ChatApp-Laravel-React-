import { useEffect, useMemo, useRef } from "react";
import {
    MicrophoneIcon,
    PhoneIcon,
    PhoneXMarkIcon,
    SpeakerXMarkIcon,
    VideoCameraIcon,
    VideoCameraSlashIcon,
} from "@heroicons/react/24/solid";
import UserAvatar from "./UserAvatar";

const statusLabels = {
    idle: "",
    outgoing: "Calling…",
    incoming: "Incoming call",
    active: "In call",
};

const CallModal = ({
    state,
    localStream,
    remoteStream,
    isMuted,
    isCameraOff,
    durationLabel,
    showLocalPreview = true,
    onAccept,
    onReject,
    onHangup,
    onToggleMic,
    onToggleCamera,
}) => {
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const remoteAudioRef = useRef(null);

    const isVideoCall = state.callType === "video";
    const showModal = state.status !== "idle";
    const showLocalVideo = showLocalPreview || state.isCaller;

    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    useEffect(() => {
        if (isVideoCall) {
            if (remoteVideoRef.current && remoteStream) {
                remoteVideoRef.current.srcObject = remoteStream;
            }
        } else if (remoteAudioRef.current && remoteStream) {
            remoteAudioRef.current.srcObject = remoteStream;
        }
    }, [isVideoCall, remoteStream]);

    const callStatus = useMemo(() => statusLabels[state.status] || "", [state.status]);
    const callTitle = isVideoCall ? "Video call" : "Voice call";
    const infoLine = state.status === "active" ? durationLabel : callStatus;

    if (!showModal) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
            <div className="w-full max-w-3xl rounded-2xl bg-slate-900 p-6 text-slate-100 shadow-2xl">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                        <UserAvatar
                            user={state.conversation || { name: "Unknown" }}
                            profile
                        />
                        <div>
                            <p className="text-2xl font-semibold">
                                {state.conversation?.name || "Unknown"}
                            </p>
                            <p className="text-sm uppercase tracking-wide text-slate-400">
                                {callTitle} · {infoLine}
                            </p>
                        </div>
                    </div>

                    {isVideoCall ? (
                        <div className="relative mt-2 aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black">
                            <video
                                ref={remoteVideoRef}
                                autoPlay
                                playsInline
                                className={`h-full w-full object-cover transition-opacity duration-300 ${remoteStream ? "opacity-100" : "opacity-0"}`}
                            />
                            {!remoteStream && (
                                <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400">
                                    Waiting for other participant…
                                </div>
                            )}
                            {showLocalVideo && (
                                <video
                                    ref={localVideoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className={`absolute bottom-4 right-4 h-28 w-40 rounded-xl border border-white/20 object-cover shadow-lg transition-opacity duration-300 ${isCameraOff
                                            ? "opacity-30 grayscale"
                                            : "opacity-100"
                                        }`}
                                />
                            )}
                            {isCameraOff && (
                                <div className="absolute bottom-6 right-6 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                                    Camera off
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-white/10 bg-slate-800 p-6 text-center text-slate-200">
                            <p className="text-lg">Voice call in progress…</p>
                            <audio ref={remoteAudioRef} autoPlay className="hidden" />
                        </div>
                    )}

                    <div className="flex flex-wrap items-center justify-center gap-3">
                        {state.status === "incoming" && (
                            <>
                                <button
                                    onClick={onReject}
                                    className="flex items-center gap-2 rounded-full bg-red-600 px-6 py-3 font-semibold text-white shadow-lg hover:bg-red-500"
                                >
                                    <PhoneXMarkIcon className="h-6 w-6" />
                                    Decline
                                </button>
                                <button
                                    onClick={onAccept}
                                    className="flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 font-semibold text-white shadow-lg hover:bg-emerald-500"
                                >
                                    <PhoneIcon className="h-6 w-6" />
                                    Accept
                                </button>
                            </>
                        )}

                        {state.status !== "incoming" && (
                            <button
                                onClick={onHangup}
                                className="flex items-center gap-2 rounded-full bg-red-600 px-6 py-3 font-semibold text-white shadow-lg hover:bg-red-500"
                            >
                                <PhoneXMarkIcon className="h-6 w-6" />
                                Hang up
                            </button>
                        )}

                        {(state.status === "outgoing" || state.status === "active") && (
                            <div className="flex gap-3">
                                <button
                                    onClick={onToggleMic}
                                    className={`flex items-center gap-2 rounded-full px-5 py-3 font-semibold shadow-lg ${isMuted ? "bg-slate-700 text-slate-200" : "bg-slate-600 text-white"}`}
                                >
                                    {isMuted ? (
                                        <>
                                            <SpeakerXMarkIcon className="h-6 w-6" />
                                            Unmute
                                        </>
                                    ) : (
                                        <>
                                            <MicrophoneIcon className="h-6 w-6" />
                                            Mute
                                        </>
                                    )}
                                </button>
                                {isVideoCall && (
                                    <button
                                        onClick={onToggleCamera}
                                        className={`flex items-center gap-2 rounded-full px-5 py-3 font-semibold shadow-lg ${isCameraOff ? "bg-slate-700 text-slate-200" : "bg-slate-600 text-white"}`}
                                    >
                                        {isCameraOff ? (
                                            <>
                                                <VideoCameraSlashIcon className="h-6 w-6" />
                                                Camera Off
                                            </>
                                        ) : (
                                            <>
                                                <VideoCameraIcon className="h-6 w-6" />
                                                Camera On
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CallModal;

