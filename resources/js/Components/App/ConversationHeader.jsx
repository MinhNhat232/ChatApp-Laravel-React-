import { ArrowLeftIcon, PencilSquareIcon, PhoneIcon, TrashIcon, VideoCameraIcon } from "@heroicons/react/24/solid";
import { Link, usePage } from "@inertiajs/react";
import UserAvatar from "./UserAvatar";
import GroupAvatar from "./GroupAvatar";
import axios from "axios";
import GroupDescriptionPopover from "./GroupDescriptionPopover";
import GroupUsersPopover from "./GroupUsersPopover";
import { useEventBus } from "@/EventBus";
import { useCall } from "@/CallContext";



const ConversationHeader = ({ selectedConversation }) => {
    const authUser = usePage().props.auth.user;
    const { emit } = useEventBus();
    const { startCall, callState } = useCall();
    console.log("🧩 Selected conversation:", selectedConversation);


    const onDeleteGroup = () => {
        if (!window.confirm("Are you sure you want to delete this group ?")) {
            return;
        }

        axios.delete(route("group.destroy", selectedConversation.id))
            .then((res) => {
                console.log("Group Delete", res);
                console.log("Group Delete", res.data.message);
                emit("toast.show", res.data.message);
            }).catch((err) => {
                console.log(err);
            })
    }
    return (
        <>
            {selectedConversation && (
                <div className="p-3 flex justify-between items-center border-b border-slate-700">
                    <div className="flex items-center gap-3">
                        <Link
                            href={route("dashboard")}
                            className="inline-block sm:hidden"
                        >
                            <ArrowLeftIcon className="w-6" />
                        </Link>
                        {selectedConversation.is_user && (
                            <UserAvatar user={selectedConversation} />
                        )}
                        {selectedConversation.is_group && <GroupAvatar />}
                        <div>

                            <h3 className="text-gray-100">{selectedConversation.name}</h3>
                            {selectedConversation.is_group && (
                                <p className="text-xs text-gray-300">
                                    {selectedConversation.users.length} members
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-3">
                        {selectedConversation.is_user && (
                            <>
                                <div className="tooltip tooltip-left" data-tip="Voice Call">
                                    <button
                                        onClick={() => startCall(selectedConversation, "audio")}
                                        disabled={callState.status !== "idle"}
                                        className="text-gray-400 hover:text-gray-200 disabled:cursor-not-allowed disabled:text-gray-600"
                                    >
                                        <PhoneIcon className="w-4" />
                                    </button>
                                </div>
                                <div className="tooltip tooltip-left" data-tip="Video Call">
                                    <button
                                        onClick={() => startCall(selectedConversation, "video")}
                                        disabled={callState.status !== "idle"}
                                        className="text-gray-400 hover:text-gray-200 disabled:cursor-not-allowed disabled:text-gray-600"
                                    >
                                        <VideoCameraIcon className="w-4" />
                                    </button>
                                </div>
                            </>
                        )}

                        {selectedConversation.is_group && (
                            <>
                            <GroupDescriptionPopover
                                description={selectedConversation.description}
                            />
                            <GroupUsersPopover
                                users={selectedConversation.users}
                            />
                            {selectedConversation.owner_id == authUser.id && (
                                <>
                                    <div
                                        className="tooltip tooltip-left"
                                        data-tip="Edit Group"
                                    >
                                        <button
                                            onClick={(ev) => emit(
                                                "GroupModal.show",
                                                selectedConversation
                                            )}
                                            className="text-gray-400 hover:text-gray-200">
                                            <PencilSquareIcon className="w-4" />
                                        </button>
                                    </div>

                                    <div className="tooltip tooltip-left"
                                        data-tip="Delete Group">
                                        <button onClick={onDeleteGroup}
                                            className="text-gray-400 hover:text-gray-200">
                                            <TrashIcon className="w-4" />
                                        </button>
                                    </div>
                                </>
                            )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );

};

export default ConversationHeader;