import { usePage } from "@inertiajs/react";
import UserAvatar from "./UserAvatar";
import React from "react";
import ReactMarkdown from "react-markdown";
import { formatMessageDateLong, isAudio, isImage, isPDF, isVideo } from "@/helpers";
import MessageAttachment from "./MessageAttachment";
import MessageOptionsDropdown from "./MessageOptionDropdown";


const MessageItem = ({ message, attachmentClick }) => {
    const currentUser = usePage().props.auth.user;
    const isMediaMessage = message.attachments?.some(file =>
        isImage(file) || isVideo(file) || isAudio(file) || isPDF(file)
    );



    return (
        <div
            className={
                "chat flex items-end gap-3 " + // ép căn đáy và cách đều avatar-bubble
                (message.sender_id === currentUser.id ? "chat-end flex-row-reverse" : "chat-start")
            }
        >
            {/* Avatar */}
            <div className="flex-shrink-0 self-end">
                <UserAvatar user={message.sender} />
            </div>

            {/* Nội dung */}
            <div>
                <div className="chat-header font-semibold text-sm text-white mb-1 flex items-center gap-1">
                    {message.sender_id !== currentUser.id ? message.sender.name : ""}
                    <time className="text-xs opacity-50 text-gray-50">
                        {formatMessageDateLong(message.created_at)}
                    </time>
                </div>

                <div
                    className={
                        isMediaMessage
                            ? ""
                            : "chat-bubble relative " +
                            (message.sender_id === currentUser.id ? "chat-bubble-info" : "")
                    }
                >
                    {message.sender_id == currentUser.id && (
                        <MessageOptionsDropdown message={message} />
                    )}

                    <div className="chat-message">
                        <div className="chat-message-content">
                            <div className="markdown prose max-w-none">
                                <ReactMarkdown>{message.message}</ReactMarkdown>
                            </div>
                        </div>

                        <MessageAttachment
                            attachments={message.attachments}
                            attachmentClick={attachmentClick}
                        />
                    </div>
                </div>
            </div>
        </div>
    );


};
export default MessageItem;