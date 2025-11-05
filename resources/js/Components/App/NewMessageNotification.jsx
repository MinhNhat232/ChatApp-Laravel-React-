
import { useEventBus } from "@/EventBus";
import { Link } from "@inertiajs/react";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid"
import UserAvatar from "./UserAvatar";

export default function NewMessageNotification({ }) {
    const [toasts, setToasts] = useState([]);
    const { on } = useEventBus();

    useEffect(() => {
        on('newMessageNotification', ({ message, user, group_id }) => {
            const uuid = uuidv4();

            setToasts((oldToasts) => [...oldToasts, { message, uuid, user, group_id }]);

            setTimeout(() => {
                setToasts((oldToasts) => oldToasts.filter((toasts) => toasts.uuid !== uuid));
            }, 5000);
        });
    }, [on]);
    return (
        <div className="toast toast-top toast-center min-w-[280px]">
            {toasts.map((toast, index) => (
                <div
                    key={toast.uuid}
                    className="alert alert-success py-3 px-4 text-gray-100 rounded-md"
                >

                    <Link
                        href={
                            // Nếu có group_id, chuyển hướng đến chat nhóm
                            toast.group_id
                                ? route("chat.group", toast.group_id)
                                // Ngược lại, chuyển hướng đến chat riêng với người dùng
                                : route("chat.user", toast.user.id)
                        }
                        className="flex items-center gap-2"
                    >
                        {/* Avatar của người gửi thông báo */}
                        <UserAvatar user={toast.user} />

                        {/* Nội dung tin nhắn */}
                        <span>{toast.message}</span>
                    </Link>
                </div>
            ))}
        </div>
    );
}


