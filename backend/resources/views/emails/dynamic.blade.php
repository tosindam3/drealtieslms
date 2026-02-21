<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>{{ $mailSubject }}</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #1a1a1b;
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
        }

        .wrapper {
            width: 100%;
            table-layout: fixed;
            background-color: #f8fafc;
            padding: 40px 0;
        }

        .container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }

        .header {
            padding: 40px;
            text-align: center;
            background-color: var(--header-bg);
        }

        .logo {
            max-height: 60px;
            margin-bottom: 20px;
        }

        .header h1 {
            margin: 0;
            color: #ffffff;
            font-size: 24px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 2px;
        }

        .content {
            padding: 40px;
            background-color: #ffffff;
        }

        .action-area {
            padding: 20px 40px 40px;
            text-align: center;
        }

        .button {
            display: inline-block;
            padding: 16px 32px;
            background-color: var(--button-bg);
            color: var(--button-text);
            text-decoration: none;
            border-radius: 8px;
            font-weight: 800;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .footer {
            padding: 30px 40px;
            background-color: #f1f5f9;
            color: #64748b;
            font-size: 11px;
            text-align: center;
            line-height: 1.8;
        }

        .disclaimer {
            margin-top: 15px;
            font-style: italic;
        }
    </style>
</head>

<body style="--header-bg: {{ $settings['header_color'] ?? '#0d1117' }}; --button-bg: {{ $settings['button_color'] ?? '#D4AF37' }}; --button-text: {{ $settings['button_text_color'] ?? '#000000' }};">
    <div class="wrapper">
        <div class="container">
            <div class="header">
                @if(!empty($settings['logo_url']))
                <img src="{{ $settings['logo_url'] }}" alt="{{ config('app.name') }}" class="logo">
                @else
                <h1>{{ config('app.name') }}</h1>
                @endif
            </div>

            <div class="content">
                {!! $mailBody !!}
            </div>

            @if(!empty($settings['show_button']))
            <div class="action-area">
                <a href="{{ $settings['button_url'] ?? '#' }}" class="button">
                    {{ $settings['button_label'] ?? 'Get Started' }}
                </a>
            </div>
            @endif

            <div class="footer">
                <p>&copy; {{ date('Y') }} {{ config('app.name') }}. All rights reserved.</p>
                @if(!empty($settings['footer_disclaimer']))
                <div class="disclaimer">
                    {!! nl2br(e($settings['footer_disclaimer'])) !!}
                </div>
                @endif
            </div>
        </div>
    </div>
</body>

</html>