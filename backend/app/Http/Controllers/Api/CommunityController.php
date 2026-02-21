<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cohort;
use App\Models\Discussion;
use App\Models\Enrollment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CommunityController extends Controller
{
    /**
     * Get community links and discussions for the student's active cohort
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        // Get active enrollment
        $enrollment = Enrollment::where('user_id', $user->id)
            ->where('status', Enrollment::STATUS_ACTIVE)
            ->first();

        if (!$enrollment) {
            return $this->errorResponse('no_active_enrollment', 'You need an active enrollment to access the community.', 403);
        }

        $cohort = $enrollment->cohort;

        // Fetch top-level discussions with their replies and user info
        $discussions = Discussion::where('cohort_id', $cohort->id)
            ->whereNull('parent_id')
            ->with(['user:id,name,avatar_url', 'replies.user:id,name,avatar_url'])
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'community_links' => [
                'telegram' => $cohort->settings['community_links']['telegram'] ?? null,
                'discord' => $cohort->settings['community_links']['discord'] ?? null,
                'whatsapp' => $cohort->settings['community_links']['whatsapp'] ?? null,
            ],
            'discussions' => $discussions,
            'cohort_name' => $cohort->name,
        ]);
    }

    /**
     * Post a new discussion or reply
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'content' => 'required|string|max:5000',
            'parent_id' => 'sometimes|nullable|exists:discussions,id',
            'is_instructor_only' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors()->toArray());
        }

        // Get active enrollment
        $enrollment = Enrollment::where('user_id', $user->id)
            ->where('status', Enrollment::STATUS_ACTIVE)
            ->first();

        if (!$enrollment) {
            return $this->errorResponse('no_active_enrollment', 'You need an active enrollment to post.', 403);
        }

        $discussion = Discussion::create([
            'user_id' => $user->id,
            'cohort_id' => $enrollment->cohort_id,
            'parent_id' => $request->parent_id,
            'content' => $request->content,
            'is_instructor_only' => $request->boolean('is_instructor_only', false),
        ]);

        return response()->json([
            'message' => 'Message posted successfully',
            'discussion' => $discussion->load('user:id,name,avatar_url'),
        ], 201);
    }

    /**
     * Resolve a discussion (instructor/admin only or the author)
     */
    public function resolve(Request $request, Discussion $discussion): JsonResponse
    {
        $user = $request->user();

        if ($user->id !== $discussion->user_id && !$user->isAdmin() && !$user->isInstructor()) {
            return $this->forbiddenResponse();
        }

        $discussion->update(['is_resolved' => true]);

        return response()->json(['message' => 'Discussion marked as resolved']);
    }
}
