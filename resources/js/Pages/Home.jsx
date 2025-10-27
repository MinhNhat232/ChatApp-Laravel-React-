import ConversationHeader from '@/Components/App/ConversationHeader';
import MessageInput from '@/Components/App/MessageInput';
import MessageItem from '@/Components/App/MessageItem';
import { useEventBus } from '@/EventBus';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ChatLayout from '@/Layouts/ChatLayout';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';
import { Head } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';


function Home({ selectedConversation = null, messages = null }) {
    const [localMessage, setLocalMessage] = useState([]);
    const messagesCtrRef = useRef(null);
    const { on } = useEventBus();

    const messageCreated = (message) => {
        console.log("📩 Event received:", message); // ✅ LOG THÊM 1

        if (selectedConversation && selectedConversation.is_group && selectedConversation.id === message.group_id) {
            console.log("✅ Add message to group:", message.group_id); // ✅ LOG THÊM 2
            setLocalMessage((prevMessages) => [...prevMessages, message]);
        }
        if (selectedConversation && selectedConversation.is_user && (selectedConversation.id === message.sender_id || selectedConversation.id === message.receiver_id)) {
            console.log("✅ Add message to private:", message.sender_id, message.receiver_id); // ✅ LOG THÊM 3
            setLocalMessage((prevMessages) => [...prevMessages, message]);
        }
    };


    useEffect(() => {
        setTimeout(() => {
            if (messagesCtrRef.current) {
                messagesCtrRef.current.scrollTop = messagesCtrRef.current.scrollHeight;
            }
        }, 10);

        console.log("🎧 Listening for event: message.created");
        const offCreated = on('message.created', messageCreated);

        return () => {
            offCreated();
        };
    }, [selectedConversation]);


    useEffect(() => {
        setLocalMessage(messages ? messages.data.reverse() : []);
    }, [messages]);

    return (
        <>
            {!messages && (
                <div className='flex flex-col gap-8 justify-center items-center text-center
            h-full opacity-35'>
                    <div className='text-2xl md:text-4xl p-16 text-slate-200'>
                        Please select conversation

                    </div>
                    <ChatBubbleLeftRightIcon className='w-32 h-32 inline-block text-slate-200' />
                </div>
            )}
            {messages && (
                <>
                    <ConversationHeader
                        selectedConversation={selectedConversation}
                    />
                    <div ref={messagesCtrRef} className='flex-1 overflow-y-auto p-5'>
                        {localMessage.length === 0 && (
                            <div className='flex justify-center items-center h-full'>
                                <div className='text-lg text-slate-200'>
                                    No messages found
                                </div>
                            </div>
                        )}

                        // File: Home.jsx (Quanh dòng 79)

                        {localMessage.length > 0 && (
                            <div className='flex-1 flex flex-col'>
                                {localMessage
                                    .filter(message => message && message.id) // ✅ Thêm hàm filter này
                                    .map((message) => (
                                        <MessageItem
                                            key={message.id}
                                            message={message}
                                        />
                                    ))}
                            </div>
                        )}

                    </div>
                    <MessageInput
                        conversation={selectedConversation}
                        onMessageSent={(msg) => setLocalMessage((prev) => [...prev, msg])}
                    />
                </>
            )}

        </>
    )
}



Home.layout = (page) => {
    return (
        <AuthenticatedLayout user={page.props.auth.user}>
            <ChatLayout children={page} />
        </AuthenticatedLayout>
    )

}

export default Home;
