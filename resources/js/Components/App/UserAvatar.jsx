const UserAvatar = ({ user, online = null, profile = false }) => {
    // 1. Chỉ định class 'online' hoặc 'offline'
    const onlineClass =
        online === true ? "online" : online === false ? "offline" : "";

    // 2. Class kích thước (avatar có các kích thước tích hợp sẵn như 'w-8', 'w-40',...)
    const sizeClass = profile ? "w-40" : "w-11";

    return (
        // *QUAN TRỌNG:* Class 'avatar' và 'online/offline' phải ở cùng một thẻ DIV
        <div className={`avatar ${onlineClass}`}>
            <div className={`rounded-full ${sizeClass} flex`}>
                {user.avatar_url ? (
                    // Hiển thị ảnh
                    <img src={user.avatar_url} alt="User Avatar" />
                ) : (
                    // Hiển thị chữ cái đầu nếu không có ảnh
                    <div className="bg-gray-400 text-gray-800 flex items-center justify-center h-full w-full rounded-full">
                        <span className="text-sm font-semibold">
                            {user.name?.substring(0, 1)}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserAvatar;