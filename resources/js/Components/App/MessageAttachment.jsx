import { isAudio, isImage, isPDF, isPreviewable, isVideo } from "@/helpers";
import { ArrowDownTrayIcon, PaperClipIcon, PlayCircleIcon } from "@heroicons/react/24/solid";


const MessageAttachment = ({ attachments = [], attachmentClick }) => {
    return (
        <>
            {attachments.length > 0 && (
                <div className="mt-2 flex flex-wrap justify-end gap-1">
                    {attachments.map((attachment, ind) => (
                        <div
                            onClick={(ev) => attachmentClick(attachments, ind)}
                            key={attachment.id}
                            className={`group flex flex-col items-center justify-center 
                                text-gray-500 relative cursor-pointer ` +
                                (isAudio(attachment)
                                    ? "w-84"
                                    : "w-32 aspect-square bg-blue-100")
                            }
                        >

                            {
                                !isAudio(attachment) && ( // Điều kiện ngược lại: hiển thị khi file KHÔNG phải là audio
                                    <a
                                        onClick={(ev) => ev.stopPropagation()}
                                        download
                                        href={attachment.url}
                                        className="z-20 opacity-100 group-hover:opacity-100 transition-all w-8 h-8 
                       flex items-center justify-center text-gray-100 bg-gray-700 rounded 
                       absolute right-0 top-0 cursor-pointer hover:bg-gray-800"
                                    >
                                        <ArrowDownTrayIcon className="w-4 h-4" />
                                    </a>
                                )}

                            {
                                isImage(attachment) && (
                                    <img
                                        src={attachment.url}
                                        className="object-contain aspect-square"
                                    />
                                )
                            }

                            {isVideo(attachment) && (
                                <div className="relative flex justify-center items-center">
                                    {/* Biểu tượng Play lớn nằm ở giữa */}
                                    <PlayCircleIcon className="z-20 absolute w-16 h-16 text-white opacity-70" />

                                    {/* Lớp phủ (Overlay) màu đen mờ */}
                                    <div className="absolute left-0 top-0 w-full h-full bg-black/50 z-10"></div>

                                    {/* Thẻ video HTML5 */}
                                    <video src={attachment.url}></video>
                                </div>
                            )}


                            {isAudio(attachment) && (
                                <div className="relative flex justify-center items-center">
                                    <audio
                                        src={attachment.url}
                                        controls
                                    >
                                    </audio>
                                </div>
                            )}


                            {isPDF(attachment) && (
                                <div className="relative flex justify-center items-center">
                                    {/* Lớp phủ để chặn tương tác? */}
                                    <div className="absolute left-0 top-0 right-0 bottom-0">
                                        {/* Có vẻ thiếu class ở đây */}
                                    </div>
                                    {/* Dùng iframe để nhúng và xem trước PDF */}
                                    <iframe
                                        src={attachment.url}
                                        className="w-full h-full"
                                    >
                                    </iframe>
                                </div>
                            )}
                            {!isPreviewable(attachment) && (
                                <a
                                    onClick={(ev) => ev.stopPropagation()}
                                    download
                                    href={attachment.url}
                                    className="flex flex-col justify-center items-center"
                                >
                                    <PaperClipIcon className="w-10 h-10 mb-3" />
                                    <small>{attachment.name}</small>
                                </a>
                            )}



                        </div>
                    ))}
                </div>
            )}
        </>
    );
};
export default MessageAttachment;