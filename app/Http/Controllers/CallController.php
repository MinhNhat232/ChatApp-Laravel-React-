<?php

namespace App\Http\Controllers;

use App\Events\CallSignal;
use App\Models\Group;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CallController extends Controller
{
    public function signal(Request $request)
    {
        $data = $request->validate([
            'call_id' => ['required', 'string'],
            'call_type' => ['required', Rule::in(['audio', 'video'])],
            'signal_type' => [
                'required',
                Rule::in(['offer', 'answer', 'candidate', 'hangup', 'reject', 'cancel', 'busy']),
            ],
            'payload' => ['nullable', 'array'],
            'is_group' => ['required', 'boolean'],
            'target_id' => ['required', 'integer'],
        ]);

        $user = $request->user();
        $groupId = null;
        $receiverId = null;

        if ($data['is_group']) {
            $group = Group::findOrFail($data['target_id']);
            abort_unless($group->users()->wherePivot('user_id', $user->id)->exists(), 403);
            $groupId = $group->id;
        } else {
            $targetUser = User::findOrFail($data['target_id']);
            $receiverId = $targetUser->id;
        }

        broadcast(new CallSignal(
            $user,
            $data['call_id'],
            $data['call_type'],
            $data['signal_type'],
            $data['payload'] ?? [],
            $groupId,
            $receiverId
        ))->toOthers();

        return response()->json([
            'status' => 'ok',
        ]);
    }
}

