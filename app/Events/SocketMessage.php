<?php

namespace App\Events;

use App\Http\Resources\MessageResource;
use App\Models\Message;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SocketMessage implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(public Message $message)
    {
        //
    }

    public function broadcastWith(): array
    {
        return [
            'message' => new MessageResource($this->message),
        ];
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        $m = $this->message;
        $channels = [];

        if ($m->group_id) {
            $channels[] = new PrivateChannel('message.group.' . $m->group_id);
        } else {
            $channels[] = new PrivateChannel('message.user.' . collect([$m->sender_id, $m->receiver_id])
                ->sort()
                ->implode('-'));
        }
        Log::info('🔊 Broadcasting message on channel:', [
            'channels' => $channels,
            'sender_id' => $m->sender_id,
            'receiver_id' => $m->receiver_id,
            'conversation_id' => $m->conversation_id,
            'group_id' => $m->group_id,
        ]);

        Log::info('Broadcasting', [
            'socket' => optional(request())->header('X-Socket-ID'),
        ]);


        return $channels;
    }
}
