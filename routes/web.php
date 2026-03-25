<?php

use Illuminate\Support\Facades\Route;

function serveAdminPage(string $filename = 'index'): \Illuminate\Http\Response|\Illuminate\Http\RedirectResponse
{
    $htmlPath = public_path("admin/{$filename}.html");
    if (! file_exists($htmlPath)) {
        $htmlPath = public_path('admin/index.html');
    }
    if (! file_exists($htmlPath)) {
        return response('Admin panel not found.', 404);
    }

    // Inject <base href="/admin/"> so relative asset paths resolve correctly
    $html = file_get_contents($htmlPath);
    $html = str_replace('<head>', '<head><base href="/admin/">', $html);

    return response($html, 200, ['Content-Type' => 'text/html; charset=utf-8']);
}

Route::get('/', fn () => redirect('/admin/'));

Route::get('/admin', fn () => redirect('/admin/'));

Route::get('/admin/', fn () => serveAdminPage('index'));

Route::get('/admin/{page}', fn (string $page) => serveAdminPage($page));
