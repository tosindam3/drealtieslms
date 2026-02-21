<?php

namespace App\Services\Mail;

use App\Models\EmailTemplate;
use App\Mail\DynamicTemplateMail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class EmailTemplateService
{
    /**
     * Send an email based on a template slug.
     *
     * @param string $slug
     * @param string $to
     * @param array $data
     * @return bool
     */
    public function sendTemplateMail(string $slug, string $to, array $data = []): bool
    {
        try {
            $template = EmailTemplate::where('slug', $slug)->first();

            if (!$template) {
                Log::error("Email template not found for slug: {$slug}");
                return false;
            }

            $subject = $this->parseTemplate($template->subject, $data);
            $body = $this->parseTemplate($template->body, $data);
            $settings = $template->settings ?? [];

            Mail::to($to)->send(new DynamicTemplateMail($subject, $body, $settings));

            return true;
        } catch (\Exception $e) {
            Log::error("Failed to send template email ({$slug}): " . $e->getMessage());
            return false;
        }
    }

    /**
     * Parse template strings and replace placeholders.
     *
     * @param string $content
     * @param array $data
     * @return string
     */
    protected function parseTemplate(string $content, array $data): string
    {
        foreach ($data as $key => $value) {
            $content = str_replace("{{{$key}}}", $value, $content);
        }

        // Add some default global placeholders
        $content = str_replace("{{app_name}}", config('app.name', 'DrealtiesFX Academy'), $content);
        $content = str_replace("{{current_year}}", date('Y'), $content);

        return $content;
    }
}
