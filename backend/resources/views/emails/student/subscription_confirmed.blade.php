<!DOCTYPE html>
<html>

<head>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f4f7f9;
            margin: 0;
            padding: 0;
        }

        .wrapper {
            padding: 40px 20px;
        }

        .container {
            max-width: 600px;
            margin: 0 auto;
            background: #fff;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }

        h2 {
            color: #1a202c;
            font-size: 24px;
            margin-bottom: 20px;
        }

        p {
            color: #4a5568;
            line-height: 1.6;
            margin-bottom: 15px;
        }

        .details {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border: 1px solid #e2e8f0;
        }

        .details div {
            margin-bottom: 10px;
            color: #4a5568;
        }

        .details strong {
            color: #1a202c;
        }

        .btn {
            display: inline-block;
            padding: 14px 28px;
            background: #4f46e5;
            color: #fff;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
        }

        .footer {
            margin-top: 30px;
            font-size: 13px;
            color: #a0aec0;
            border-top: 1px solid #edf2f7;
            padding-top: 20px;
        }
    </style>
</head>

<body>
    <div class="wrapper">
        <div class="container">
            <h2>Subscription Confirmed! 🚀</h2>
            <p>Hi {{ $user->name }},</p>
            <p>Your subscription is now active! You have unlocked a world of premium learning content and exclusive features.</p>
            <div class="details">
                <div><strong>Plan Name:</strong> {{ $subscription->plan_name }}</div>
                <div><strong>Expiry Date:</strong> {{ \Carbon\Carbon::parse($subscription->ends_at)->format('d M, Y') }}</div>
            </div>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{ config('app.url') }}/courses" class="btn">Explore Premium Content</a>
            </div>
            <div class="footer">
                &copy; {{ date('Y') }} DRealties FX LMS. All rights reserved.
            </div>
        </div>
    </div>
</body>

</html>