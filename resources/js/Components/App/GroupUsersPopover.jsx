import { Popover, PopoverButton, PopoverPanel, Transition } from "@headlessui/react";
import { Link } from "@inertiajs/react";
import { Fragment } from "react";
import UserAvatar from "./UserAvatar";
import { UsersIcon } from "@heroicons/react/24/solid";


export default function GroupUsersPopover({ users = [] }) {
    return (
        <Popover className="relative">
            {/* Sử dụng render prop pattern để truy cập trạng thái 'open' */}
            {({ open }) => (
                <>
                    <PopoverButton
                        className={`
                            ${open ? "text-gray-200" : "text-gray-400"}
                            hover:text-gray-200
                        `}
                    >
                        <UsersIcon className="w-4" />
                    </PopoverButton>

                    <Transition
                        as={Fragment}
                        // Hiệu ứng khi XUẤT HIỆN (Enter)
                        enter="transition ease-out duration-200"
                        enterFrom="opacity-0 translate-y-1"
                        enterTo="opacity-100 translate-y-0"

                        // Hiệu ứng khi BIẾN MẤT (Leave)
                        leave="transition ease-in duration-150"
                        leaveFrom="opacity-100 translate-y-0"
                        leaveTo="opacity-0 translate-y-1"
                    >
                        <PopoverPanel className="absolute right-0 z-10 mt-3 w-[200px] px-4 sm:px-0">
                            <div className="overflow-hidden rounded-lg shadow-lg ring-1 ring-black/5">
                                <div className="bg-gray-800 py-2">
                                    {/* Lặp qua danh sách users để tạo các đường dẫn */}
                                    {users.map((user) => (
                                        <Link
                                            href={route("chat.user", user.id)}
                                            key={user.id}
                                            className="flex items-center gap-2 py-2 px-3 hover:bg-black/30"
                                        >
                                            {/* Nội dung thông tin người dùng (ảnh đại diện, tên) sẽ ở đây */}
                                            <UserAvatar user={user} />
                                            <div className="text-xs text-gray-100">
                                                {user.name}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </PopoverPanel>
                    </Transition>
                </>
            )}
        </Popover>
    );
}