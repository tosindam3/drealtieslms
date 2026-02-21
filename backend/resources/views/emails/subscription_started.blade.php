@extends('emails.layout')

@section('content')
<h1>Subscription Confirmed!</h1>
<p>Hello {{ $user->name }},</p>
<p>Your subscription to <strong>{{ $subscription->plan_name }}</strong> is now active.</p>
<p>Validity: {{ $subscription->starts_at->format('M d, Y') }} - {{ $subscription->ends_at ? $subscription->ends_at->format('M d, Y') : 'Lifetime' }}</p>
<p>Unlock your path to professional mastery today.</p>
<a href="{{ config('app.url') }}/dashboard" class="button">Access Curriculum</a>
@endsection