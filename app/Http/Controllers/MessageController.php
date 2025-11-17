<?php

namespace App\Http\Controllers;

use App\Events\MessageDeleted;
use App\Events\SocketMessage;
use App\Http\Requests\StoreMessageRequest;
use App\Http\Resources\MessageResource;
use App\Models\Conversation;
use App\Models\Group;
use App\Models\Message;
use App\Models\MessageAttachment;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Socket;

class MessageController extends Controller
{

    public function fetchMessages(Request $request, string $type, int $id)
    {
        $perPage = max(10, (int) $request->query('per_page', 10));
        $cursor = $request->query('cursor');
        $user = $request->user();

        if ($type === 'user') {
            $targetUser = User::findOrFail($id);
            abort_unless($targetUser->id === $user->id || true, 403);

            $query = Message::with(['attachments', 'sender'])
                ->withTrashed()
                ->where(function ($q) use ($targetUser, $user) {
                    $q->where('sender_id', $user->id)
                        ->where('receiver_id', $targetUser->id)
                        ->orWhere(function ($inner) use ($targetUser, $user) {
                            $inner->where('sender_id', $targetUser->id)
                                ->where('receiver_id', $user->id);
                        });
                });
        } elseif ($type === 'group') {
            $group = Group::findOrFail($id);
            abort_unless($group->users->contains('id', $user->id), 403);

            $query = Message::with(['attachments', 'sender'])
                ->withTrashed()
                ->where('group_id', $group->id);
        } else {
            abort(404);
        }

        $messages = $query->latest()->cursorPaginate($perPage, ['*'], 'cursor', $cursor);

        return MessageResource::collection($messages);
    }

    public function byUser(User $user)
    {

        $messages = Message::with(['attachments', 'sender'])
            ->withTrashed()
            ->where('sender_id', auth()->id())
            ->where('receiver_id', $user->id)
            ->orWhere('sender_id', $user->id)
            ->where('receiver_id', auth()->id())
            ->latest()
            ->paginate(10);

        return inertia('Home', [
            'selectedConversation' => $user->toConversationArray(),
            'messages' => MessageResource::collection($messages),
        ]);
    }

    public function byGroup(Group $group)
    {
        $messages = Message::with(['attachments', 'sender'])
            ->withTrashed()
            ->where('group_id', $group->id)
            ->latest()
            ->paginate(10);

        return inertia('Home', [
            'selectedConversation' => $group->toConversationArray(),
            'messages' => MessageResource::collection($messages),
        ]);
    }

    public function loadOlder(Message $message)
    {
        if ($message->group_id) {
            $messages = Message::with(['attachments', 'sender'])
                ->withTrashed()
                ->where('created_at', '<', $message->created_at)
                ->where('group_id', $message->group_id)
                ->latest()
                ->paginate(10);
        } else {
            $messages = Message::with(['attachments', 'sender'])
                ->withTrashed()
                ->where('created_at', '<', $message->created_at)
                ->where(function ($query) use ($message) {
                    $query->where('sender_id', $message->sender_id)
                        ->where('receiver_id', $message->receiver_id)
                        ->orWhere('sender_id', $message->receiver_id)
                        ->where('receiver_id', $message->sender_id);
                })
                ->latest()
                ->paginate(10);
        }

        return MessageResource::collection($messages);
    }

    public function store(StoreMessageRequest $request)
    {
        $data = $request->validated();
        $data['sender_id'] = auth()->id();
        $receiverId = $data['receiver_id'] ?? null;
        $groupId = $data['group_id'] ?? null;
        $data['type'] = $data['type'] ?? 'text';

        $files = $request->file('attachments', []);
        $meta = $request->input('meta');
        if ($meta && is_string($meta)) {
            $decoded = json_decode($meta, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $data['meta'] = $decoded;
            } else {
                Log::warning('Invalid meta json', ['meta' => $meta]);
            }
        }
        unset($data['attachments']);

        $message = Message::create($data);

        $attachments = [];
        if ($files) {
            foreach ($files as $file) {
                $directory = 'attachments/' . Str::random(32);
                Storage::makeDirectory($directory);

                $model = [
                    'message_id' => $message->id,
                    'name' => $file->getClientOriginalName(),
                    'mime' => $file->getClientMimeType(),
                    'size' => $file->getSize(),
                    'path' => $file->store($directory, 'public'),
                ];
                $attachment = MessageAttachment::create($model);
                $attachments[] = $attachment;

                // (Thiếu logic lưu $model vào database hoặc thêm vào $attachments array)
            }

            $message->attachments = $attachments;
        }

        if ($receiverId) {
            Conversation::updateConversationWithMessage($receiverId, auth()->id(), $message);
        }

        if ($groupId) {
            Group::updateGroupWithMessage($groupId, $message);
        }
        //$message->load('sender');

        $message->load(['attachments', 'sender']);
        SocketMessage::dispatch($message);
        Log::info('✅ Dispatched SocketMessage event', [
            'sender_id' => $message->sender_id,
            'receiver_id' => $message->receiver_id,
        ]);



        return new MessageResource($message);
    }

    public function destroy(Message $message)
    {
        if ($message->sender_id !== auth()->id()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $message->delete();
        $message->load(['attachments', 'sender']);

        MessageDeleted::dispatch($message);

        return new MessageResource($message);
    }
}
