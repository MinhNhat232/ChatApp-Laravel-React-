<?php

namespace App\Observers;

use App\Models\Conversation;
use App\Models\Group;
use App\Models\Message;
use Illuminate\Support\Facades\Storage;

class MessageObserver
{


    public function deleting(Message $message)
    {

        // Iterate over the message's attachments and delete them from file system
        $message->attachments->each(function ($attachment) {
            // Delete attachment file from file system saved on public disk
            $dir = dirname($attachment->path);
            Storage::disk('public')->deleteDirectory($dir);
        });

        // delete all attachments related to the message from the database
        $message->attachments()->delete();

        // Update Group and Conversation's last message if the message is the last message
        if ($message->group_id) {
            $group = Group::where('last_message_id', $message->id)->first();

            if ($group) {
                // Tìm tin nhắn gần nhất (trước đó) trong nhóm
                $prevMessage = Message::where('group_id', $message->group_id)
                    ->where('id', '!=', $message->id) // Loại trừ tin nhắn đang bị xóa
                    ->latest() // Sắp xếp theo ID giảm dần (mới nhất trước)
                    ->limit(1) // Chỉ lấy 1 tin nhắn
                    ->first(); // Lấy đối tượng tin nhắn

                if ($prevMessage) {
                    // Cập nhật last_message_id của nhóm sang ID của tin nhắn trước đó
                    $group->last_message_id = $prevMessage->id;
                    $group->save(); // Lưu thay đổi vào cơ sở dữ liệu
                }
            }
        } else {
            $conversation = Conversation::where('last_message_id', $message->id)->first();
            if ($conversation) {
                // Tìm tin nhắn gần nhất (trước đó) trong cuộc hội thoại 1-1
                $prevMessage = Message::where(function ($query) use ($message) {
                    // Điều kiện 1: Tin nhắn được gửi từ A đến B
                    $query->where('sender_id', $message->sender_id)
                        ->where('receiver_id', $message->receiver_id)
                        ->orWhere('sender_id', $message->receiver_id)
                        ->where('receiver_id', $message->sender_id);
                })
                    // Loại trừ tin nhắn đang bị xóa
                    ->where('id', '!=', $message->id)
                    // Sắp xếp theo ID giảm dần (mới nhất)
                    ->latest()
                    // Giả định sẽ có limit(1)->first() ở cuối
                    ->limit(1)
                    ->first();
                if ($prevMessage) {
                    $conversation->last_message_id = $prevMessage->id;
                    $conversation->save();
                }
            }
        }
    }
}
