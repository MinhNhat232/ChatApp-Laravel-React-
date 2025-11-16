import { usePage } from "@inertiajs/react";
import UserAvatar from "./UserAvatar";
import React from "react";
import ReactMarkdown from "react-markdown";
import { formatMessageDateLong, isAudio, isImage, isPDF, isVideo } from "@/helpers";
import MessageAttachment from "./MessageAttachment";
import MessageOptionsDropdown from "./MessageOptionDropdown";
import {
    PhoneArrowDownLeftIcon,
    PhoneXMarkIcon,
    VideoCameraIcon,
    PhoneIcon,
} from "@heroicons/react/24/solid";
import { useCall } from "@/CallContext";


const MessageItem = ({ message, attachmentClick, conversation }) => {
    const currentUser = usePage().props.auth.user;
    const isDeleted = !!message.deleted_at;
    const isCallSummary = message.type === "call_summary";
    const callMeta = message.meta || {};
    const isMediaMessage = message.attachments?.some(file =>
        isImage(file) || isVideo(file) || isAudio(file) || isPDF(file)
    );



    return (
        <div className={"chat " + (message.sender_id === currentUser.id
            ? "chat-end" : "chat-start"
        )}>
            <UserAvatar user={message.sender} />

            <div className="chat-header font-semibold text-sm text-white">
                {message.sender_id !== currentUser.id
                    ? message.sender.name
                    : ""}

                <time className="text-xs opacity-50 ml-2 text-gray-50">
                    {formatMessageDateLong(message.created_at)}
                </time>
            </div>

            <div
                className={
                    (isMediaMessage && !isDeleted && !isCallSummary
                        ? ""
                        : "chat-bubble relative ") +
                    (message.sender_id === currentUser.id ? "chat-bubble-info" : "")
                }
            >
                {message.sender_id == currentUser.id && !isDeleted && !isCallSummary && (
                    <MessageOptionsDropdown message={message} />
                )}
                <div className="chat-message">
                    <div className="chat-message-content">
                        {!isDeleted && !isCallSummary && (
                            <div className="markdown prose max-w-none">
                                <ReactMarkdown>{message.message}</ReactMarkdown>
                            </div>
                        )}
                        {isDeleted && (
                            <p className="text-sm italic text-gray-300">
                                {message.deleted_label || "This message was deleted"}
                            </p>
                        )}
                        {isCallSummary && !isDeleted && (
                            <CallSummary
                                meta={callMeta}
                                sender={message.sender}
                                currentUser={currentUser}
                                conversation={conversation}
                                timestamp={message.created_at}
                            />
                        )}
                    </div>
                    {!isDeleted && !isCallSummary && (
                        <MessageAttachment
                            attachments={message.attachments}
                            attachmentClick={attachmentClick} />
                    )}




                </div>

            </div>



        </div>

    );
};
const CallSummary = ({ meta = {}, sender, currentUser, conversation, timestamp }) => {
    const { startCall, callState } = useCall();
    const isVideo = meta.call_type === "video";
    const status = meta.status || "completed";
    const durationLabel = meta.formatted_duration;
    const initiatedByMe = meta.initiated_by === currentUser.id;
    const canCallBack = conversation?.is_user;
    const callTypeForCallback = isVideo ? "video" : "audio";

    let text = "";
    if (status === "completed") {
        text = `Call ended • ${durationLabel || ""}`.trim();
    } else if (status === "missed") {
        text = `Missed ${isVideo ? "video" : "voice"} call`;
    } else if (status === "canceled") {
        text = `${initiatedByMe ? "You" : sender?.name || "They"} canceled the call`;
    } else if (status === "declined") {
        text = `${initiatedByMe ? sender?.name || "They" : "You"} declined the call`;
    } else {
        text = `${isVideo ? "Video" : "Voice"} call`;
    }

    const Icon = (() => {
        if (status === "missed" || status === "declined") {
            return PhoneXMarkIcon;
        }
        if (isVideo) {
            return VideoCameraIcon;
        }
        if (status === "canceled") {
            return PhoneArrowDownLeftIcon;
        }
        return PhoneIcon;
    })();

    const handleCallBack = (typeOverride = callTypeForCallback) => {
        if (!conversation) {
            return;
        }
        startCall(conversation, typeOverride);
    };

    const timeLabel = timestamp ? formatMessageDateLong(timestamp) : "";
    const statusColor =
        status === "missed" || status === "declined"
            ? "bg-red-500/15 text-red-300"
            : status === "canceled"
                ? "bg-yellow-500/15 text-yellow-200"
                : "bg-emerald-500/15 text-emerald-200";

    return (
        <div className="flex items-center gap-2 text-sm text-gray-100">
            <div className="rounded-2xl bg-slate-800/70 p-4 shadow-inner flex-1">
                <div className="flex items-center gap-3">
                    <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${statusColor}`}>
                        <Icon className="h-5 w-5" />
                    </span>
                    <div className="flex-1">
                        <span className="font-semibold block">{text}</span>
                        <span className="text-xs text-gray-400">{timeLabel}</span>
                        {durationLabel && status === "completed" && (
                            <span className="text-xs text-gray-300 block">Duration: {durationLabel}</span>
                        )}
                    </div>
                    {canCallBack && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleCallBack("audio")}
                                disabled={callState.status !== "idle"}
                                className="inline-flex items-center gap-1 rounded-full border border-slate-500 px-3 py-1 text-xs font-semibold hover:bg-slate-700 disabled:opacity-40"
                            >
                                <PhoneIcon className="h-3.5 w-3.5" />
                                Voice call
                            </button>
                            <button
                                onClick={() => handleCallBack("video")}
                                disabled={callState.status !== "idle"}
                                className="inline-flex items-center gap-1 rounded-full border border-slate-500 px-3 py-1 text-xs font-semibold hover:bg-slate-700 disabled:opacity-40"
                            >
                                <VideoCameraIcon className="h-3.5 w-3.5" />
                                Video call
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
export default MessageItem;