<!DOCTYPE html>
<html>

<head>
    <style>
        body {
            font-family: 'Inter', sans-serif;
            line-height: 1.6;
            color: #334155;
        }

        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 40px;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
        }

        .header {
            text-align: center;
            margin-bottom: 40px;
        }

        .logo {
            font-size: 24px;
            font-weight: 900;
            color: #D4AF37;
            text-transform: uppercase;
            letter-spacing: -1px;
        }

        .button {
            display: inline-block;
            padding: 16px 32px;
            background-color: #D4AF37;
            color: #000000;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 900;
            text-transform: uppercase;
            font-size: 14px;
            letter-spacing: 1px;
            margin-top: 20px;
        }

        .footer {
            margin-top: 40px;
            font-size: 12px;
            color: #94a3b8;
            text-align: center;
        }
    </style>
</head>

<body>
    <div class="container">
        <div class="header">
            <div class="logo">DrealtiesFX Academy</div>
        </div>

        <p>Hello,</p>
        <p>We received a request to reset your password for your DrealtiesFX Academy account. Click the button below to choose a new password:</p>

        <div style="text-align: center;">
            <a href="{{ $resetUrl }}" class="button">Reset Password</a>
        </div>

        <p style="margin-top: 30px;">This link will expire in 60 minutes. If you did not request a password reset, no further action is required.</p>

        <p>Stay Sharp,<br>The DrealtiesFX Academy Team</p>

        <div class="footer">
            &copy; 2026 DrealtiesFX Academy. Professional Trading Resources.
        </div>
    </div>
</body>

</html>