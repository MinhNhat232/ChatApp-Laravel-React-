import { Popover, PopoverButton, PopoverPanel, Transition } from "@headlessui/react";
import { ExclamationCircleIcon } from "@heroicons/react/24/solid";
import { Fragment } from "react";

export default function GroupDescriptionPopover({ description }) {
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
                        <ExclamationCircleIcon className="w-4" />
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
                        <PopoverPanel className="absolute right-0 z-20 mt-3 w-[300px] px-4 sm:px-0">
                            <div className="overflow-hidden rounded-lg shadow-lg ring-1 ring-black/5">
                                <div className="bg-gray-800 p-4">
                                    <h2 className="text-lg mb-3 text-gray-100">
                                        Description
                                    </h2>
                                    {/* Hiển thị mô tả nếu 'description' có giá trị */}
                                    {description && (
                                        <div className="text-xs text-gray-100">
                                            {description}
                                        </div>
                                    )}
                                    {!description && (
                                        <div className="text-xs text-gray-500 text-center py-4">
                                            No description is defined.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </PopoverPanel>
                    </Transition>
                </>
            )}
        </Popover>
    );
}