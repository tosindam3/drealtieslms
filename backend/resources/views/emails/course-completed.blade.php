<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Course Completed!</title>
    <style>
        body { font-family: sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .primary-color { color: #f59e0b; }
        .button {
            display: inline-block;
            background-color: #f59e0b;
            color: #fff;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 20px;
        }
        .footer { margin-top: 40px; font-size: 0.8em; text-align: center; color: #777; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="primary-color">Congratulations!</h1>
        </div>
        
        <p>Hello {{ $user->first_name }},</p>
        
        <p>You have successfully completed the course <strong>{{ $courseName }}</strong>!</p>
        
        <p>We are thrilled to see your dedication and progress. You can now download your completion certificate and review your final scores from your student portal.</p>
        
        <div style="text-align: center;">
            <a href="{{ url('/') }}" class="button">Go to Dashboard</a>
        </div>
        
        <div class="footer">
            <p>&copy; {{ date('Y') }} {{ config('app.name') }}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
