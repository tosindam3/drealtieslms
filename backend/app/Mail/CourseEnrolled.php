<?php

namespace App\Mail;

use App\Models\User;
use App\Models\Cohort;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Contracts\Queue\ShouldQueue;

class CourseEnrolled extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public User $user, public $course) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Enrolled Successfully! 📚');
    }

    public function content(): Content
    {
        return new Content(view: 'emails.student.enrolled');
    }
}
