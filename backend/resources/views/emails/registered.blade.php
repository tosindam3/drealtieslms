@extends('emails.layout')

@section('content')
<h1>Welcome to the Academy, {{ $user->name }}!</h1>
<p>We are thrilled to have you join our institutional trading community.</p>
<p>Your account has been successfully registered. You can now log in and explore our foundation modules.</p>
<a href="{{ config('app.url') }}/dashboard" class="button">Go to Dashboard</a>
@endsection