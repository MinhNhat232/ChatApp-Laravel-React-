import { router, useForm, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import Modal from "../Modal";
import InputLabel from "../InputLabel";
import TextInput from "../TextInput";
import InputError from "../InputError";
import TextAreaInput from "../TextAreaInput";
import UserPicker from "./UserPicker";
import { useEventBus } from "@/EventBus";
import SecondaryButton from "../SecondaryButton";
import PrimaryButton from "../PrimaryButton";

export default function GroupModal({ show = false, onClose = () => { } }) {

    const page = usePage();
    const conversations = page.props.conversations;
    const { on, emit } = useEventBus();
    const [group, setGroup] = useState({});

    const { data, setData, processing, reset, post, put, errors } = useForm({
        id: "",
        name: "",
        description: "",
        user_ids: [],
    });

    // Lọc danh sách conversations để lấy ra những conversation KHÔNG phải là nhóm
    const users = conversations.filter((c) => !c.is_group);

    const createOrUpdateGroup = (e) => {
        e.preventDefault();
        console.log("🚀 Submitting group form data:", data);
        if (group.id) {
            put(route("group.update", group.id), {
                onSuccess: () => {
                    router.reload({ only: ['conversations'] });
                    closeModal();
                    emit("toast.show", `Group "${data.name}" was updated`);
                },
            });
            return;
        }
        post(route("group.store"), {
            onSuccess: () => {
                router.reload({ only: ['conversations'] });
                emit("toast.show", `Group "${data.name}" was created`)
                closeModal();
            },
        });
    };

    const closeModal = () => {
        reset();
        onClose();
    };

    useEffect(() => {
        // Đăng ký lắng nghe sự kiện khi component được mount
        return on("GroupModal.show", (group) => {
            // 1. Cập nhật dữ liệu form bằng setData
            setData({
                name: group.name,
                description: group.description,
                user_ids: group.users
                    // Lọc bỏ người sở hữu (owner) khỏi danh sách user_ids
                    .filter((u) => group.owner_id != u.id)
                    // Ánh xạ các đối tượng user còn lại thành mảng chỉ chứa user ID
                    .map((u) => u.id),
            });

            // 2. Cập nhật state group
            setGroup(group);
        });
    }, [on]); // Dependency array: useEffect chạy lại khi biến 'on' thay đổi

    return (
        <Modal show={show} onClose={closeModal}>
            <form onSubmit={createOrUpdateGroup} className="p-6 overflow-y-auto">
                <h2 className="text-xl font-medium text-gray-900 dark:text-gray-100">
                    {group.id ? `Edit Group "${group.name}"` : "Create new group"}
                </h2>

                <div className="mt-8">
                    <InputLabel htmlFor="name" value="Name" />
                    <TextInput
                        id="name"
                        className="mt-1 block w-full"
                        value={data.name}
                        // disabled={!group.id}
                        onChange={(e) => setData("name", e.target.value)}
                        required
                        isFocused />

                    <InputError className="mt-2" message={errors.name} />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="description" value="Description" />
                    <TextAreaInput
                        id="description"
                        rows="3"
                        className="mt-1 block w-full"
                        value={data.description || ""}
                        onChange={(e) => setData("description", e.target.value)}
                    />

                    <InputError className="mt-2" message={errors.description} />
                </div>

                <div className="mt-4">
                    <InputLabel value="Select Users" />

                    <UserPicker
                        value={
                            // Lọc danh sách 'users' để xác định những người dùng ĐÃ được chọn
                            users.filter(
                                (u) =>
                                    // Loại trừ người sở hữu nhóm (owner)
                                    group.owner_id != u.id &&
                                    // Bao gồm những người dùng có ID nằm trong mảng data.user_ids
                                    data.user_ids.includes(u.id)
                            ) || [] // Nếu kết quả filter là null/undefined, trả về mảng rỗng
                        }
                        options={users} // Toàn bộ danh sách người dùng để hiển thị trong Combobox
                        onSelect={(users) => {
                            const ids = users.map((u) => u.id);
                            console.log("✅ Selected users:", ids); // Kiểm tra khi chọn user
                            setData("user_ids", ids);
                        }}

                    />

                    <InputError className="mt-2" message={errors.user_ids} />
                </div>

                <div className="mt-6 flex justify-end">
                    <SecondaryButton onClick={closeModal}>
                        Cancel
                    </SecondaryButton>

                    <PrimaryButton
                        className="ms-3"
                        disabled={processing}
                    >
                        {/* Thay đổi văn bản nút tùy theo đang tạo mới hay cập nhật */}
                        {group.id ? "Update" : "Create"}
                    </PrimaryButton>
                </div>

            </form>
        </Modal>

    );
} // Dấu ngoặc nhọn kết thúc của function component
