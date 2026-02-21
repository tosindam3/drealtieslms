<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <style>
        body {
            font-family: 'Inter', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
        }

        .logo {
            font-size: 24px;
            font-weight: 900;
            color: #D4AF37;
            text-transform: uppercase;
            letter-spacing: -1px;
        }

        .content {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 12px;
            border: 1px solid #eee;
        }

        .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 12px;
            color: #999;
        }

        .button {
            display: inline-block;
            padding: 12px 24px;
            background: #D4AF37;
            color: #000;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin-top: 20px;
        }
    </style>
</head>

<body>
    <div class="header">
        <div class="logo">DrealtiesFx Academy</div>
    </div>
    <div class="content">
        @yield('content')
    </div>
    <div class="footer">
        &copy; {{ date('Y') }} DrealtiesFx Academy. All rights reserved.
    </div>
</body>

</html>