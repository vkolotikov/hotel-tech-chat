<?php

use Illuminate\Support\Facades\Route;

// Serve admin panel
Route::get('/', function () {
    $adminPath = public_path('admin/index.html');
    if (file_exists($adminPath)) {
        return response()->file($adminPath, ['Content-Type' => 'text/html']);
    }
    return view('welcome');
});

Route::get('/admin', function () {
    $adminPath = public_path('admin/index.html');
    if (file_exists($adminPath)) {
        return response()->file($adminPath, ['Content-Type' => 'text/html']);
    }
    return view('welcome');
});

Route::get('/admin/{page}', function (string $page) {
    $htmlPath = public_path("admin/{$page}.html");
    if (file_exists($htmlPath)) {
        return response()->file($htmlPath, ['Content-Type' => 'text/html']);
    }
    $adminPath = public_path('admin/index.html');
    if (file_exists($adminPath)) {
        return response()->file($adminPath, ['Content-Type' => 'text/html']);
    }
    return view('welcome');
});
