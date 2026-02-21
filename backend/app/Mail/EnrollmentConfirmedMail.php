<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class EnrollmentConfirmedMail extends Mailable
{
    use Queueable, SerializesModels;

    public $user;
    public $enrollment;

    /**
     * Create a new message instance.
     */
    public function __construct(\App\Models\User $user, \App\Models\Enrollment $enrollment)
    {
        $this->user = $user;
        $this->enrollment = $enrollment;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Enrollment Confirmed: ' . $this->enrollment->cohort->name,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.enrollment_confirmed',
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
