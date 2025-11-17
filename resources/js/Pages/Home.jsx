import AttachmentPreviewModal from '@/Components/App/AttachmentPreviewModal';
import ConversationHeader from '@/Components/App/ConversationHeader';
import MessageInput from '@/Components/App/MessageInput';
import MessageItem from '@/Components/App/MessageItem';
import { useEventBus } from '@/EventBus';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ChatLayout from '@/Layouts/ChatLayout';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';


function Home({ selectedConversation = null }) {
    const [localMessage, setLocalMessage] = useState([]);
    const [noMoreMessages, setNoMoreMessage] = useState(false);
    const [scrollFromBottom, setScrollFromBottom] = useState(0);
    const [showAttachmentPreview, setShowAttachmentPreview] = useState(false);
    const [previewAttachment, setPreviewAttachment] = useState({});
    const [messagesLoading, setMessagesLoading] = useState(false);
    const messagesCtrRef = useRef(null);
    const loadMoreIntersect = useRef(null);
    const { on } = useEventBus();

    const fetchMessages = useCallback(
        async ({ beforeId = null, replace = false } = {}) => {
            if (!selectedConversation) {
                return;
            }

            setMessagesLoading(true);

            try {
                const params = {};
                if (beforeId) {
                    params.before_id = beforeId;
                }

                const type = selectedConversation.is_group ? 'group' : 'user';
                const url = route('api.conversation.messages', {
                    type,
                    id: selectedConversation.id,
                });

                const { data } = await axios.get(url, { params });
                const payload = data.data.reverse();

                setLocalMessage((prev) => {
                    if (replace) {
                        return payload;
                    }
                    const merged = [...payload, ...prev];
                    const unique = new Map();
                    merged.forEach((msg) => {
                        if (msg?.id) {
                            unique.set(msg.id, msg);
                        }
                    });
                    return [...unique.values()];
                });

                if (payload.length === 0) {
                    setNoMoreMessage(true);
                }
            } catch (error) {
                console.error('Unable to load messages', error);
            } finally {
                setMessagesLoading(false);
            }
        },
        [selectedConversation],
    );

    const messageCreated = (message) => {
        const related =
            (selectedConversation?.is_group && selectedConversation.id === message.group_id) ||
            (selectedConversation?.is_user &&
                (selectedConversation.id === message.sender_id ||
                    selectedConversation.id === message.receiver_id));

        if (related) {
            setLocalMessage((prevMessages) => {
                const exists = prevMessages.find((m) => m.id === message.id);
                if (exists) {
                    return prevMessages.map((m) => (m.id === message.id ? message : m));
                }
                return [...prevMessages, message];
            });
        }
    };


    const messageDeleted = (message) => {
        const related =
            (selectedConversation?.is_group && selectedConversation.id === message.group_id) ||
            (selectedConversation?.is_user &&
                (selectedConversation.id === message.sender_id ||
                    selectedConversation.id === message.receiver_id));

        if (!related) {
            return;
        }

        setLocalMessage((prevMessages) =>
            prevMessages.map((m) =>
                m.id === message.id
                    ? {
                        ...m,
                        ...message,
                    }
                    : m,
            ),
        );
    };



    const loadMoreMessages = useCallback(() => {
        if (noMoreMessages || messagesLoading || localMessage.length === 0) {
            return;
        }

        const firstMessage = localMessage[0];
        fetchMessages({ beforeId: firstMessage.id });
    }, [fetchMessages, localMessage, messagesLoading, noMoreMessages]);

    const onAttachmentClick = (attachments, ind) => {
        setPreviewAttachment({
            attachments,
            ind,
        });
        setShowAttachmentPreview(true);
    };

    useEffect(() => {
        setTimeout(() => {
            if (messagesCtrRef.current) {
                messagesCtrRef.current.scrollTop = messagesCtrRef.current.scrollHeight;
            }
        }, 10);


        const offCreated = on('message.created', messageCreated);
        const offDeleted = on('message.deleted', messageDeleted);

        setScrollFromBottom(0);
        setNoMoreMessage(false);

        return () => {
            offCreated();
            offDeleted();
        };
    }, [selectedConversation]);


    useEffect(() => {
        setLocalMessage([]);
        setNoMoreMessage(false);

        if (selectedConversation) {
            fetchMessages({ replace: true });
        }
    }, [fetchMessages, selectedConversation]);

    useEffect(() => {
        if (messagesCtrRef.current && scrollFromBottom !== null) {
            messagesCtrRef.current.scrollTop =
                messagesCtrRef.current.scrollHeight -
                messagesCtrRef.current.offsetHeight -
                scrollFromBottom;
        }

        if (noMoreMessages) {
            return;
        }


        const observer = new IntersectionObserver(
            (entries) =>
                entries.forEach(
                    (entry) => entry.isIntersecting && loadMoreMessages()
                ),
            {
                rootMargin: "0px 0px 250px 0px",
            }
        );

        if (loadMoreIntersect.current) {
            setTimeout(() => {
                observer.observe(loadMoreIntersect.current);
            }, 100);
        }

        return () => {
            observer.disconnect();
        };
    }, [localMessage]);

    return (
        <>
            {!selectedConversation && (
                <div className='flex flex-col gap-8 justify-center items-center text-center
            h-full opacity-35'>
                    <div className='text-2xl md:text-4xl p-16 text-slate-200'>
                        Please select conversation

                    </div>
                    <ChatBubbleLeftRightIcon className='w-32 h-32 inline-block text-slate-200' />
                </div>
            )}
            {selectedConversation && (
                <>
                    <ConversationHeader
                        selectedConversation={selectedConversation}
                    />
                    <div ref={messagesCtrRef} className='flex-1 overflow-y-auto p-5'>
                        {messagesLoading && localMessage.length === 0 && (
                            <div className='flex justify-center items-center h-full text-slate-200'>
                                Loading messages...
                            </div>
                        )}

                        {!messagesLoading && localMessage.length === 0 && (
                            <div className='flex justify-center items-center h-full'>
                                <div className='text-lg text-slate-200'>
                                    No messages found
                                </div>
                            </div>
                        )}



                        {localMessage.length > 0 && (
                            <div className='flex-1 flex flex-col'>
                                <div ref={loadMoreIntersect}></div>
                                {localMessage
                                    .filter(message => message && message.id) // ✅ Thêm hàm filter này
                                    .map((message) => (
                                        <MessageItem
                                            key={message.id}
                                            message={message}
                                            conversation={selectedConversation}
                                            attachmentClick={onAttachmentClick}
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
            {
                previewAttachment.attachments && (
                    <AttachmentPreviewModal
                        attachments={previewAttachment.attachments}
                        index={previewAttachment.ind}
                        show={showAttachmentPreview}
                        onClose={() => setShowAttachmentPreview(false)}
                    />
                )
            }


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
