<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Exception;

class ChunkedUploadService
{
    protected string $disk = 'public';
    protected string $chunksFolder = 'chunks';

    /**
     * Initialize a new chunked upload
     */
    public function initializeUpload(string $fileName): array
    {
        $uploadId = Str::uuid()->toString();
        $extension = pathinfo($fileName, PATHINFO_EXTENSION);

        return [
            'uploadId' => $uploadId,
            'fileName' => $fileName,
            'extension' => $extension,
            'receivedChunks' => []
        ];
    }

    /**
     * Store a single chunk
     */
    public function storeChunk(string $uploadId, int $chunkIndex, $file): bool
    {
        $path = "{$this->chunksFolder}/{$uploadId}";
        $filename = "chunk_{$chunkIndex}";

        return Storage::disk('local')->putFileAs($path, $file, $filename);
    }

    /**
     * Reassemble all chunks into a final file
     */
    public function completeUpload(string $uploadId, string $originalFileName, int $totalChunks): string
    {
        $extension = pathinfo($originalFileName, PATHINFO_EXTENSION);
        $cleanName = Str::slug(pathinfo($originalFileName, PATHINFO_FILENAME)) . '-' . Str::random(8) . '.' . $extension;

        $folder = 'videos';
        if (in_array(strtolower($extension), ['jpg', 'jpeg', 'png', 'gif', 'webp'])) {
            $folder = 'images';
        }

        $finalPath = "{$folder}/{$cleanName}";
        $tempPath = storage_path("app/public/{$finalPath}");

        // Ensure directory exists
        if (!file_exists(dirname($tempPath))) {
            mkdir(dirname($tempPath), 0755, true);
        }

        $out = fopen($tempPath, "wb");
        if ($out === false) {
            throw new Exception("Failed to open output stream");
        }

        for ($i = 0; $i < $totalChunks; $i++) {
            $chunkPath = storage_path("app/{$this->chunksFolder}/{$uploadId}/chunk_{$i}");

            if (!file_exists($chunkPath)) {
                fclose($out);
                throw new Exception("Missing chunk {$i}");
            }

            $in = fopen($chunkPath, "rb");
            while ($line = fread($in, 4096)) {
                fwrite($out, $line);
            }
            fclose($in);
        }

        fclose($out);

        // Delete chunks
        Storage::disk('local')->deleteDirectory("{$this->chunksFolder}/{$uploadId}");

        return Storage::url($finalPath);
    }
}
