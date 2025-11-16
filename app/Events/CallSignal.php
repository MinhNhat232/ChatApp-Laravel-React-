<?php

namespace App\Events;

use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CallSignal implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public User $sender,
        public string $callId,
        public string $callType,
        public string $signalType,
        public array $payload = [],
        public ?int $groupId = null,
        public ?int $receiverId = null,
    ) {
        //
    }

    /**
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        if ($this->groupId) {
            return [new PrivateChannel('call.group.' . $this->groupId)];
        }

        $sortedIds = collect([$this->sender->id, $this->receiverId])
            ->filter()
            ->sort()
            ->implode('-');

        return [new PrivateChannel('call.user.' . $sortedIds)];
    }

    public function broadcastWith(): array
    {
        return [
            'call_id' => $this->callId,
            'call_type' => $this->callType,
            'signal_type' => $this->signalType,
            'payload' => $this->payload,
            'group_id' => $this->groupId,
            'receiver_id' => $this->receiverId,
            'sender' => new UserResource($this->sender),
        ];
    }
}

