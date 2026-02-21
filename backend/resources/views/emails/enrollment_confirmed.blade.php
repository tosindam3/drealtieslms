@extends('emails.layout')

@section('content')
<h1>Enrollment Confirmed</h1>
<p>Hello {{ $user->name }},</p>
<p>You have been successfully enrolled in <strong>{{ $enrollment->cohort->name }}</strong>.</p>
<p>Get ready to start your journey into institutional order flow and market analysis.</p>
<a href="{{ config('app.url') }}/dashboard" class="button">Resume Learning Path</a>
@endsection