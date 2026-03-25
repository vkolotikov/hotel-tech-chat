<?php

use Illuminate\Support\Facades\Route;

Route::get('/', fn () => response()->file(public_path('admin/index.html')));
Route::get('/admin', fn () => response()->file(public_path('admin/index.html')));
Route::get('/admin/', fn () => response()->file(public_path('admin/index.html')));
Route::get('/admin/index.html', fn () => response()->file(public_path('admin/index.html')));
Route::get('/admin/dashboard.html', fn () => response()->file(public_path('admin/dashboard.html')));

Route::get('/admin/{page}', function (string $page) {
    $file = public_path("admin/{$page}.html");
    return response()->file(file_exists($file) ? $file : public_path('admin/index.html'));
})->where('page', '[a-z\-]+');
