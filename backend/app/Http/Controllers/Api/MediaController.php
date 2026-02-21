<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class MediaController extends Controller
{
    protected $chunkedUploadService;

    public function __construct(\App\Services\ChunkedUploadService $chunkedUploadService)
    {
        $this->chunkedUploadService = $chunkedUploadService;
    }

    /**
     * Upload a media file (Standard method)
     */
    public function upload(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|max:512000', // 500MB max
            'type' => 'sometimes|string|in:video,image,document',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $originalName = $file->getClientOriginalName();
            $extension = $file->getClientOriginalExtension();

            // Generate unique filename but keep original slug for readability
            $filename = Str::slug(pathinfo($originalName, PATHINFO_FILENAME)) . '-' . Str::random(8) . '.' . $extension;

            // Determine folder based on type or mime
            $folder = 'uploads';
            $mime = $file->getMimeType();

            if (str_starts_with($mime, 'video/')) {
                $folder = 'videos';
            } elseif (str_starts_with($mime, 'image/')) {
                $folder = 'images';
            }

            // Store in public disk
            $path = $file->storeAs($folder, $filename, 'public');
            $url = Storage::url($path);

            return response()->json([
                'message' => 'File uploaded successfully',
                'url' => $url,
                'path' => $path,
                'type' => $mime,
                'originalName' => $originalName
            ], 201);
        }

        return response()->json(['error' => 'No file provided'], 400);
    }

    /**
     * Initiate a chunked upload
     */
    public function initiateChunkedUpload(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'fileName' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $result = $this->chunkedUploadService->initializeUpload($request->fileName);

        return response()->json($result);
    }

    /**
     * Upload a single chunk
     */
    public function uploadChunk(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'uploadId' => 'required|string',
            'chunkIndex' => 'required|integer',
            'file' => 'required|file',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $success = $this->chunkedUploadService->storeChunk(
            $request->uploadId,
            $request->chunkIndex,
            $request->file('file')
        );

        return response()->json(['success' => $success]);
    }

    /**
     * Complete a chunked upload
     */
    public function completeChunkedUpload(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'uploadId' => 'required|string',
            'fileName' => 'required|string',
            'totalChunks' => 'required|integer',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $url = $this->chunkedUploadService->completeUpload(
                $request->uploadId,
                $request->fileName,
                $request->totalChunks
            );

            return response()->json([
                'message' => 'File reassembled successfully',
                'url' => $url,
                'originalName' => $request->fileName
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
