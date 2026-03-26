<?php

use Illuminate\Support\Facades\Route;

$serveSpa = function () {
    $spaPath = public_path('spa/index.html');
    if (file_exists($spaPath)) {
        return response()->file($spaPath, ['Content-Type' => 'text/html']);
    }
    return response()->json([
        'status' => 'building',
        'message' => 'Frontend not yet deployed. Run: cd frontend && npm run build:prod && cp -r dist ../public/spa',
        'spa_path' => public_path('spa/index.html'),
    ], 200);
};

Route::get('/', $serveSpa);
Route::get('/{any}', $serveSpa)->where('any', '^(?!api/).*$');
