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

        .highlight {
            color: #4f46e5;
            font-weight: 600;
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
            <h2>Enrolled Successfully! 📚</h2>
            <p>Hi {{ $user->name }},</p>
            <p>Congratulations! You have been successfully enrolled in <span class="highlight">{{ $course->name ?? $course->title }}</span>.</p>
            <p>Your learning journey starts now. Dive in and make the most of the resources available to you.</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{ config('app.url') }}/learn" class="btn">Start Learning Now</a>
            </div>
            <div class="footer">
                &copy; {{ date('Y') }} DRealties FX LMS. All rights reserved.
            </div>
        </div>
    </div>
</body>

</html>