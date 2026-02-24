<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Course Unenrollment Notice</title>
    <style>
        body { font-family: sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .warning-color { color: #dc2626; }
        .footer { margin-top: 40px; font-size: 0.8em; text-align: center; color: #777; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="warning-color">Course Unenrollment Notice</h1>
        </div>
        
        <p>Hello {{ $user->first_name }},</p>
        
        <p>This email is to notify you that your enrollment in the course <strong>{{ $courseName }}</strong> has been cancelled or has expired.</p>
        
        <p>If you believe this was a mistake, or if you would like to re-enroll, please contact our support team or visit your dashboard to sign up again.</p>
        
        <div class="footer">
            <p>&copy; {{ date('Y') }} {{ config('app.name') }}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
