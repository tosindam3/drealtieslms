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
            margin-bottom: 20px;
        }

        .alert {
            color: #e53e3e;
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
            <h2>Security Alert: Password Changed</h2>
            <p>Hi {{ $user->name }},</p>
            <p>This is a confirmation that the password for your <strong>DRealties FX LMS</strong> account has been successfully changed.</p>
            <p class="alert">If you did not make this change, please contact our support team immediately to secure your account.</p>
            <div class="footer">
                &copy; {{ date('Y') }} DRealties FX LMS. All rights reserved.
            </div>
        </div>
    </div>
</body>

</html>