<?php

return [
    'admin_ttl_hours'    => env('OC_ADMIN_TTL_HOURS', 168),
    'admin_rotate_hours' => env('OC_ADMIN_ROTATE_HOURS', 24),

    // SaaS Core
    'saas_enabled'    => env('SAAS_CORE_ENABLED', true),
    'saas_base_url'   => env('SAAS_CORE_BASE_URL', 'http://localhost:3000'),
    'saas_jwt_secret' => env('SAAS_JWT_SECRET', ''),
    'saas_product_key'=> env('SAAS_PRODUCT_KEY', 'onlinechat'),

    // OpenAI
    'openai_api_key'         => env('OC_OPENAI_API_KEY', ''),
    'openai_model'           => env('OC_OPENAI_DEFAULT_MODEL', 'gpt-4o-mini'),
    'openai_max_tokens'      => env('OC_OPENAI_MAX_TOKENS', 160),
    'openai_temperature'     => env('OC_OPENAI_TEMPERATURE', 0.2),
    'openai_transcribe_model'=> env('OC_OPENAI_TRANSCRIBE_MODEL', 'gpt-4o-transcribe'),
    'openai_tts_model'       => env('OC_OPENAI_TTS_MODEL', 'gpt-4o-mini-tts'),

    // Upload limits
    'upload_max_bytes' => env('OC_UPLOAD_MAX_BYTES', 5242880),
    'avatar_max_bytes' => env('OC_AVATAR_MAX_BYTES', 2097152),
];
