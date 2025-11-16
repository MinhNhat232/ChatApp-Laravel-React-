import { UsersIcon } from "@heroicons/react/24/solid";

const GroupAvatar = () => {
    return (
        <div className="avatar placeholder" aria-label="Group Avatar">
            <div className="bg-gray-400 text-gray-800 rounded-full w-11 h-11 flex items-center justify-center">
                <UsersIcon className="w-4 h-4" />
            </div>
        </div>
    );
};

export default GroupAvatar;
