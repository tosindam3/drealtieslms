@extends('emails.layout')

@section('content')
<h1>Payment Received</h1>
<p>Hello {{ $user->name }},</p>
<p>We've received your payment of <strong>{{ number_format($payment->amount, 2) }} {{ $payment->currency }}</strong> via {{ ucfirst($payment->channel) }}.</p>
<p>Reference: {{ $payment->reference }}</p>
<p>Thank you for choosing DrealtiesFx Academy for your trading education.</p>
@endsection