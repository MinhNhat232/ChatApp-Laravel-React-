import { useState, Fragment } from "react";
import NewMessageInput from "./NewMessageInput";
import { FaceSmileIcon, HandThumbUpIcon, PaperAirplaneIcon, PaperClipIcon, PhotoIcon, XCircleIcon } from "@heroicons/react/24/solid";
import axios from "axios";
import { useEventBus } from "@/EventBus";
import EmojiPicker from "emoji-picker-react";
import { Popover, Transition } from "@headlessui/react";

import AttachmentPreview from "./AttachmentPreview";
import { isAudio, isImage } from "@/helpers";
import CustomAudioPlayer from "./CustomAudioPlayer";
import AudioRecorder from "./AudioRecorder";


const MessageInput = ({ conversation = null, onMessageSent }) => {
    const [newMessage, setNewMessage] = useState("");
    const [inputErrorMessage, setInputErrorMessage] = useState("");
    const [messageSending, setMessageSending] = useState(false);
    const [chosenFiles, setChosenFiles] = useState([]);
    const [uploadProgress, setUploadProgress] = useState(0);
    const { emit } = useEventBus();

    const onFileChange = (e) => {
        const files = e.target.files;

        const updatedFiles = [...files].map((file) => {
            return {
                file: file,
                url: URL.createObjectURL(file),
            };
        });
        e.target.value = null;

        setChosenFiles((prevFiles) => {
            return [...prevFiles, ...updatedFiles];
        });
    }

    const onSendClick = () => {

        if (messageSending) {
            return;
        }

        if (newMessage.trim() === "" && chosenFiles.length === 0) {
            setInputErrorMessage("Please provide a message or upload attachments");

            setTimeout(() => {
                setInputErrorMessage("");
            }, 3000)
            return;
        }
        const formData = new FormData();
        chosenFiles.forEach((file) => {
            formData.append("attachments[]", file.file);
        })
        formData.append("message", newMessage);
        if (conversation.is_user) {
            formData.append("receiver_id", conversation.id);
        } else if (conversation.is_group) {
            formData.append("group_id", conversation.id);
        } else {
            console.error("Missing conversation type");
            return;
        }

        setMessageSending(true);

        axios
            .post(route("message.store"), formData, {
                onUploadProgress: (progressEvent) => {
                    const progress = Math.round(
                        (progressEvent.loaded / progressEvent.total) * 100
                    );
                    // ... (Thiếu phần lưu giá trị 'progress' vào state hoặc nơi khác)
                    console.log(progress);
                    setUploadProgress(progress);
                },
            })
            .then((response) => {
                const msg = response.data;
                console.log("Dữ liệu tin nhắn từ Server:", msg);
                console.log("🟢 [DEBUG] Message ID:", msg.id);
                setNewMessage("");
                setMessageSending(false);
                onMessageSent(msg);
                setUploadProgress(0);
                setChosenFiles([]);

            })
            .catch((error) => {
                setMessageSending(false);
                setChosenFiles([]);
                const message = error?.response?.data?.message;
                setInputErrorMessage(
                    message || "An error occurred while sending message"
                );
            });
    };

    const onLikeClick = () => {
        if (messageSending) {
            return;
        }
        const data = {
            message: "👍",
        }

        if (conversation.is_user) {
            data["receiver_id"] = conversation.id;
        } else if (conversation.is_group) {
            data["group_id"] = conversation.id;
        }

        axios.post(route("message.store"), data)
    };

    const recordedAudioReady = (file, url) => {
        setChosenFiles((prevFiles) => [...prevFiles, { file, url }]);
    };


    return (
        <div className="border-t border-slate-700 py-3 px-2">
            {/* HÀNG TRÊN: input + nút gửi */}
            <div className="flex items-center gap-2">
                {/* BÊN TRÁI: Gửi file, ảnh, audio */}
                <div className="flex items-center gap-2">
                    <button className="p-1 text-gray-400 hover:text-gray-300 relative">
                        <PaperClipIcon className="w-6" />
                        <input
                            type="file"
                            multiple
                            onChange={onFileChange}
                            className="absolute inset-0 z-20 opacity-0 cursor-pointer"
                        />
                    </button>

                    <button className="p-1 text-gray-400 hover:text-gray-300 relative">
                        <PhotoIcon className="w-6" />
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={onFileChange}
                            className="absolute inset-0 z-20 opacity-0 cursor-pointer"
                        />
                    </button>

                    <AudioRecorder fileReady={recordedAudioReady} />
                </div>

                {/* Ô NHẬP TIN NHẮN */}
                <div className="flex-1 flex items-center relative">
                    <NewMessageInput
                        value={newMessage}
                        onSend={onSendClick}
                        onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <button
                        onClick={onSendClick}
                        disabled={messageSending}
                        className="bg-blue-500 rounded-l-none px-3 py-2 flex items-center gap-1 hover:bg-blue-600 transition"
                    >
                        <PaperAirplaneIcon className="w-5" />
                        <span className="hidden sm:inline">Send</span>
                    </button>
                </div>

                {/* BÊN PHẢI: Emoji + Like */}
                <div className="flex items-center gap-2">
                    <Popover className="relative">
                        <Popover.Button className="p-1 text-gray-400 hover:text-gray-300">
                            <FaceSmileIcon className="w-6 h-6" />
                        </Popover.Button>
                        <Popover.Panel className="absolute z-10 right-0 bottom-full">
                            <EmojiPicker
                                theme="dark"
                                onEmojiClick={(ev) => setNewMessage(newMessage + ev.emoji)}
                            />
                        </Popover.Panel>
                    </Popover>

                    <button
                        onClick={onLikeClick}
                        className="p-1 text-gray-400 hover:text-gray-300"
                    >
                        <HandThumbUpIcon className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* HÀNG DƯỚI: progress, lỗi, preview */}
            <div className="mt-2">
                {!!uploadProgress && (
                    <progress
                        className="progress progress-info w-full"
                        value={uploadProgress}
                        max="100"
                    ></progress>
                )}

                {inputErrorMessage && (
                    <p className="text-xs text-red-400 mt-1">{inputErrorMessage}</p>
                )}

                {/* HIỂN THỊ FILE / ẢNH / AUDIO */}
                {chosenFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                        {chosenFiles.map((file) => (
                            <div
                                key={file.file.name}
                                className={
                                    "relative flex justify-between cursor-pointer " +
                                    (isImage(file.file) ? " w-[70px]" : "")
                                }
                            >
                                {/* Hình ảnh */}
                                {isImage(file.file) && (
                                    <img
                                        src={file.url}
                                        alt=""
                                        className="w-20 h-20 object-cover rounded-md"
                                    />
                                )}

                                {/* Âm thanh */}
                                {isAudio(file.file) && (
                                    <CustomAudioPlayer file={file} showVolume={false} />
                                )}

                                {/* File khác */}
                                {!isAudio(file.file) && !isImage(file.file) && (
                                    <AttachmentPreview file={file} />
                                )}

                                {/* Nút xoá */}
                                <button
                                    onClick={() =>
                                        setChosenFiles(
                                            chosenFiles.filter(
                                                (f) => f.file.name !== file.file.name
                                            )
                                        )
                                    }
                                    className="absolute w-6 h-6 rounded-full bg-gray-800 -right-2 -top-2 text-gray-300 hover:text-gray-100 z-10"
                                >
                                    <XCircleIcon className="w-6" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );


}
export default MessageInput;